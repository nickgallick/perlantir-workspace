# SKILL-POSTGRES-OPERATIONS

## Purpose

Start, stop, configure, and troubleshoot PostgreSQL 17 with pgvector in the Nexus development environment. Maintain explicit separation between the dev-only container-local workaround and production architecture truth.

## When to Use

- PostgreSQL won't start or accept connections
- Connection refused errors in tests or server
- Extension not available (`vector`, `uuid-ossp`)
- Migration failures
- Fresh environment setup
- Performance issues or disk space concerns

## Inputs Required

- `MEMORY.md` — infrastructure notes (start command, DATABASE_URL)
- `packages/core/src/db/client.ts` — `createPool`, `healthCheck`
- `packages/core/src/db/migrator.ts` — migration runner
- `supabase/migrations/001_initial_schema.sql` — schema requiring vector and uuid-ossp extensions

## Execution Method

### Dev vs Production Architecture

| Aspect | Dev (Current) | Production (Target) |
|--------|--------------|-------------------|
| **PostgreSQL** | 17.x installed inside the OpenClaw Docker container via `apt-get` | Separate `pgvector/pgvector:pg16` container |
| **Start command** | `sudo -n pg_ctlcluster 17 main start` | Container auto-starts via Docker Compose `restart: unless-stopped` |
| **Data persistence** | Container-local filesystem — **lost on container rebuild** | Named Docker volume `pgdata` mounted to `/var/lib/postgresql/data` |
| **Connection string** | `postgresql://nexus:nexus_dev@localhost:5432/nexus` | `postgresql://nexus:${POSTGRES_PASSWORD}@postgres:5432/nexus` (inter-container) |
| **Extensions** | Manually enabled by `postgres` superuser | Auto-created via `docker-entrypoint-initdb.d` scripts |
| **User/DB setup** | Manually created (`CREATE USER nexus`, `CREATE DATABASE nexus`) | Auto-created by Postgres container env vars (`POSTGRES_USER`, `POSTGRES_DB`) |
| **Backups** | None | Volume snapshots or `pg_dump` cron |
| **Connection pooling** | `pg.Pool` with `max: 20` in `client.ts` | Same, but consider PgBouncer for multi-instance |
| **Network** | `localhost:5432` | Docker network, service name `postgres` resolves |

**Critical rule**: Never treat the dev container-local PostgreSQL as production architecture. It is a workaround because we cannot run Docker-in-Docker inside the OpenClaw container.

### Dev Environment: Standard Operations

**Start PostgreSQL:**
```bash
sudo -n pg_ctlcluster 17 main start
```

**Verify it's running:**
```bash
pg_isready -h localhost -p 5432
# Expected: localhost:5432 - accepting connections
```

**Verify extensions:**
```bash
# From Node.js:
pool.query("SELECT extname FROM pg_extension WHERE extname IN ('vector', 'uuid-ossp')");
# Must return both rows
```

**Run migrations:**
```typescript
import { migrate } from '@nexus-ai/core';
const result = await migrate(pool, './supabase/migrations');
// result.applied: files applied this run
// result.skipped: already applied
// result.errors: any failures
```

**Check database exists:**
```bash
# Cannot use psql (not installed). Use Node.js:
node -e "
  const pg = require('pg');
  const pool = new pg.Pool({connectionString: 'postgresql://nexus:nexus_dev@localhost:5432/nexus'});
  pool.query('SELECT current_database()').then(r => console.log(r.rows[0])).finally(() => pool.end());
"
```

### Transition Checklist: Dev → Production

Before deploying to production, verify each item:

- [ ] Docker Compose file uses `pgvector/pgvector:pg16` image (not `postgres:16`)
- [ ] `POSTGRES_PASSWORD` is not `nexus_dev` — use a strong generated password
- [ ] `DATABASE_URL` uses Docker service name `postgres` not `localhost`
- [ ] Named volume `pgdata` is configured for data persistence
- [ ] Migration files are in `docker-entrypoint-initdb.d` or run by the app at startup
- [ ] Extensions (`vector`, `uuid-ossp`) created by init scripts (not manual superuser)
- [ ] `NEXUS_API_KEY` is set (not empty/dev mode)
- [ ] Health check configured on both containers
- [ ] Backup strategy defined (at minimum: volume snapshots)
- [ ] Network egress restricted (Nexus container → Postgres container + OpenAI API only)

### Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `connection refused localhost:5432` | PostgreSQL not started | `sudo -n pg_ctlcluster 17 main start` |
| `FATAL: role "nexus" does not exist` | User not created | `sudo -u postgres createuser nexus` then `sudo -u postgres psql -c "ALTER USER nexus PASSWORD 'nexus_dev'"` |
| `FATAL: database "nexus" does not exist` | Database not created | `sudo -u postgres createdb -O nexus nexus` |
| `ERROR: type "vector" does not exist` | pgvector extension not created | `sudo -u postgres psql -d nexus -c "CREATE EXTENSION IF NOT EXISTS vector"` |
| `could not access directory "/var/lib/postgresql/17/main"` | Cluster not initialized | `sudo -n pg_ctlcluster 17 main start` (auto-initializes) or `pg_createcluster 17 main` |
| `too many clients already` | Pool max exceeded or leaked connections | Verify `max: 20` in `createPool`, ensure `pool.end()` in test cleanup |
| `disk usage > 80%` | Accumulated test data or WAL files | Delete old test data; `VACUUM FULL` on large tables |

### Do NOT Do This

- **Do not assume dev PostgreSQL data survives container rebuilds.** It doesn't. Treat dev DB as ephemeral.
- **Do not use `localhost` in production `DATABASE_URL`.** Production uses Docker service names.
- **Do not use `nexus_dev` as the production password.** Generate a strong password.
- **Do not install PostgreSQL in the production Nexus container.** Production runs PostgreSQL as a separate container.
- **Do not skip the pgvector image in production.** `CREATE EXTENSION vector` fails on standard postgres images.

## Failure Modes

| Failure | Detection | Fix |
|---------|-----------|-----|
| PG process dies silently | `healthCheck(pool)` returns false | Restart: `sudo -n pg_ctlcluster 17 main start` |
| Extensions missing after restart | `migrate()` fails with "type vector does not exist" | Re-create extensions as postgres superuser |
| Connection pool exhaustion | New queries hang or timeout | Check for unclosed pools in test files; restart PG |

## Exit Criteria

- PostgreSQL accepting connections on expected host:port
- Both extensions (`vector`, `uuid-ossp`) present
- `healthCheck(pool)` returns true
- `migrate()` completes with zero errors
- Dev-vs-production distinction understood and documented
