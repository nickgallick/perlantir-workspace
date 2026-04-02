# SKILL-MIGRATION-RUNNER-OPERATIONS

## Purpose

Run, verify, and troubleshoot database migrations using the Nexus custom migrator in dev and production environments. The migrator is custom-built (not Prisma/Drizzle/Knex) — DevOps must understand its operational behavior: what happens on failure, partial migration, re-run, and fresh setup.

## When to Use

- Deploying schema changes to dev or production
- Fresh environment setup
- Migration failure recovery
- Verifying database state matches expected schema
- Pre-deploy health check

## Inputs Required

- `packages/core/src/db/migrator.ts` — implementation
- `packages/core/tests/migrator.test.ts` — 3 tests
- `supabase/migrations/` — migration SQL files

## Execution Method

### How the Migrator Works

```
migrate(pool, migrationsDir) →
  1. CREATE TABLE IF NOT EXISTS _nexus_migrations (id, name, applied_at)
  2. SELECT name FROM _nexus_migrations → Set of already-applied names
  3. readdir(migrationsDir).filter('.sql').sort() → ordered file list
  4. For each file NOT in applied set:
     a. BEGIN
     b. Execute SQL file content
     c. INSERT INTO _nexus_migrations (name) VALUES (filename)
     d. COMMIT
     e. If error: ROLLBACK, record in errors[]
  5. Return { applied: string[], skipped: string[], errors: { name, error }[] }
```

**Key properties:**
- **Idempotent**: Re-running skips already-applied migrations (tracked by filename in `_nexus_migrations`)
- **Transactional**: Each migration runs in its own transaction. Failure rolls back that migration only — prior migrations are committed.
- **Ordered**: Files are sorted alphabetically. `001_` runs before `002_`.
- **No down migrations**: The migrator only goes forward. To undo, write a new migration.

### Running Migrations

**In application code (tests, server startup):**
```typescript
import { migrate } from '@nexus-ai/core';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const result = await migrate(pool, '/path/to/supabase/migrations');

if (result.errors.length > 0) {
  console.error('Migration errors:', result.errors);
  process.exit(1);
}
console.log(`Applied: ${result.applied.length}, Skipped: ${result.skipped.length}`);
```

**In tests (every integration test file):**
```typescript
beforeAll(async () => {
  pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 });
  await migrate(pool, MIGRATIONS_DIR);  // Idempotent — safe to call in every test file
});
```

### Verifying Migration State

**Check what's applied:**
```typescript
const result = await pool.query('SELECT name, applied_at FROM _nexus_migrations ORDER BY id');
// Returns all applied migration filenames with timestamps
```

**Check what's pending:**
```typescript
import { migrationStatus } from '@nexus-ai/core';
const { applied, pending } = await migrationStatus(pool, migrationsDir);
// applied: filenames in DB, pending: files on disk not yet applied
```

### Fresh Environment Setup (Dev)

```bash
# 1. Start PostgreSQL
sudo -n pg_ctlcluster 17 main start

# 2. Verify connection
pg_isready -h localhost -p 5432

# 3. Run migrations (from Node.js — no psql available)
node -e "
  const pg = require('pg');
  const { migrate } = require('@nexus-ai/core');
  const pool = new pg.Pool({connectionString: 'postgresql://nexus:nexus_dev@localhost:5432/nexus'});
  migrate(pool, './supabase/migrations').then(r => {
    console.log('Applied:', r.applied);
    console.log('Skipped:', r.skipped);
    console.log('Errors:', r.errors);
    pool.end();
  });
"
```

### Fresh Environment Setup (Production — Docker Compose)

Two options:

**Option A — Auto-run via init scripts:**
Mount migration files to `docker-entrypoint-initdb.d/`:
```yaml
volumes:
  - ./supabase/migrations:/docker-entrypoint-initdb.d
```
PostgreSQL runs these on first container start only (when data volume is empty). Does NOT re-run on restart.

**Option B — App-managed (recommended):**
Call `migrate()` at server startup before accepting requests. This handles both fresh deployments and schema updates:
```typescript
const pool = createPool();
const result = await migrate(pool, './supabase/migrations');
if (result.errors.length > 0) {
  console.error('Migration failed, refusing to start');
  process.exit(1);
}
// Now start HTTP server
```

Option B is preferred because it works for both initial setup AND subsequent schema changes.

### Failure Recovery

**Scenario 1 — Migration SQL has a syntax error:**
- Transaction rolls back. File is NOT recorded in `_nexus_migrations`.
- Fix the SQL file. Re-run `migrate()` — it will retry the failed file.

**Scenario 2 — Migration partially succeeds but hits a constraint error:**
- Transaction rolls back entirely (including successful statements within the file).
- Same as Scenario 1: fix and re-run.

**Scenario 3 — Migration succeeds but application code is wrong:**
- File IS recorded in `_nexus_migrations`. Re-running skips it.
- Write a new migration (e.g., `003_fix_column.sql`) to correct the schema.
- Never modify an applied migration file — the migrator won't re-run it.

**Scenario 4 — `_nexus_migrations` table doesn't exist:**
- `ensureMigrationsTable()` creates it on first call. No manual intervention needed.

**Scenario 5 — Extensions missing:**
- `001_initial_schema.sql` includes `CREATE EXTENSION IF NOT EXISTS vector`.
- If running as `nexus` user (not superuser), this fails with `permission denied`.
- Fix: Create extensions manually as `postgres` superuser before running migrations.
- In production: handle in Docker init script or as a pre-migration step.

### Do NOT Do This

- **Do not modify an already-applied migration file.** The migrator tracks by filename. Changes to applied files have no effect.
- **Do not delete entries from `_nexus_migrations` to force re-run.** This can cause duplicate table/column errors if the migration isn't idempotent.
- **Do not run migrations concurrently.** Two processes calling `migrate()` simultaneously can race on the same file. Serialize migration execution.
- **Do not include `BEGIN`/`COMMIT` in migration SQL files.** The migrator wraps each file in a transaction already. Nested transactions cause errors.
- **Do not skip migration verification after deployment.** Always check `migrationStatus()` or query `_nexus_migrations` to confirm.

## Failure Modes

| Failure | Detection | Fix |
|---------|-----------|-----|
| `_nexus_migrations` doesn't exist | Auto-created by migrator | No action needed |
| Permission denied on CREATE EXTENSION | `result.errors` contains permission error | Create extensions as postgres superuser |
| Migration file has syntax error | `result.errors` contains SQL syntax error | Fix SQL, re-run |
| Applied migration needs correction | Can't re-run (tracked as applied) | Write new corrective migration |
| Concurrent migration race | Duplicate key error in `_nexus_migrations` | Serialize migration calls |

## Exit Criteria

- `migrate()` returns zero errors
- `migrationStatus()` shows zero pending migrations
- `_nexus_migrations` table contains entries for all SQL files in `supabase/migrations/`
- Extensions verified present (`vector`, `uuid-ossp`)
- Application health check passes after migration
