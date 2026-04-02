# SKILL-DOCKER-COMPOSE-MANAGEMENT

## Purpose

Build, configure, and troubleshoot the Docker Compose production deployment: nexus service + postgres service with pgvector, multi-stage Dockerfile, volume management, health checks, and environment configuration.

## When to Use

- Creating the Dockerfile and docker-compose.yaml for production
- Troubleshooting container networking or startup ordering
- Volume management (data persistence, backup)
- Environment variable configuration
- Updating the deployment for new schema or code changes

## Inputs Required

- `agents/devops/capabilities/NEXUS-INFRASTRUCTURE-SPEC.md` — Docker Compose topology, Dockerfile, env vars
- `TOOLS.md` — runtime constraints (no Docker-in-Docker in dev)
- `packages/server/src/index.ts` — server entry point

## Execution Method

### Production Topology

```
┌─────────────────────────────────────────┐
│           Docker Compose                 │
│                                          │
│  ┌──────────┐      ┌──────────────────┐ │
│  │  nexus    │─────→│  postgres        │ │
│  │  :3000    │      │  :5432           │ │
│  │  node:22  │      │  pgvector/pg16   │ │
│  └──────────┘      └──────────────────┘ │
│                          │               │
│                     ┌────▼────┐          │
│                     │ pgdata  │          │
│                     │ volume  │          │
│                     └─────────┘          │
└─────────────────────────────────────────┘
```

### Critical Image Requirement

**MUST use `pgvector/pgvector:pg16`**, not `postgres:16`. Standard postgres images do not include the pgvector extension. `CREATE EXTENSION vector` will fail.

Verify: `docker run --rm pgvector/pgvector:pg16 postgres --version` should show PostgreSQL 16.x.

### Docker Compose Configuration

Reference: `agents/devops/capabilities/NEXUS-INFRASTRUCTURE-SPEC.md` contains the full `docker-compose.yaml` and `Dockerfile`.

Key decisions already locked:
- Two services: `nexus` (app) + `postgres` (DB)
- Named volume `pgdata` for data persistence
- Health check on postgres: `pg_isready -U nexus`
- `depends_on: condition: service_healthy` ensures postgres is ready before nexus starts
- Migrations auto-run via `docker-entrypoint-initdb.d` mount OR app-managed startup (see SKILL-MIGRATION-RUNNER-OPERATIONS)

### Environment Variable Configuration

| Variable | Where Set | Production Value |
|----------|----------|-----------------|
| `DATABASE_URL` | nexus service env | `postgresql://nexus:${POSTGRES_PASSWORD}@postgres:5432/nexus` |
| `POSTGRES_PASSWORD` | `.env` file or secrets | Strong generated password (NOT `nexus_dev`) |
| `POSTGRES_USER` | postgres service env | `nexus` |
| `POSTGRES_DB` | postgres service env | `nexus` |
| `OPENAI_API_KEY` | `.env` file or secrets | Real API key |
| `NEXUS_API_KEY` | `.env` file or secrets | Strong generated key |
| `PORT` | nexus service env | `3000` (default) |

**`.env` file** (create alongside docker-compose.yaml, do NOT commit):
```
POSTGRES_PASSWORD=<generated-strong-password>
OPENAI_API_KEY=sk-...
NEXUS_API_KEY=nx-<generated-strong-key>
```

### Dockerfile Notes

Multi-stage build (from NEXUS-INFRASTRUCTURE-SPEC.md):
- Stage 1 (`builder`): Install deps, build all packages via turbo
- Stage 2 (`runner`): Copy only dist/ and node_modules, run server

**Node version**: Spec says `node:20-slim`. Dev environment runs Node 22. All code must be compatible with Node 20+ (no Node 22-only APIs). Use `node:22-slim` if targeting Node 22 in production.

**No SDK in production image**: The SDK package is for external consumers, not the server. Only copy `core` and `server` dist to the production image.

### Startup Sequence

1. Docker Compose starts postgres service
2. Postgres health check passes (`pg_isready -U nexus`)
3. Docker Compose starts nexus service
4. Nexus app calls `migrate(pool, migrationsDir)` (if app-managed)
5. Nexus starts HTTP server on configured port
6. `GET /api/health` returns `{ "status": "ok" }`

### Volume Management

**Data persistence**: The `pgdata` named volume survives `docker compose down` but NOT `docker compose down -v` (which removes volumes).

**Backup** (minimum viable):
```bash
# Dump database to file
docker compose exec postgres pg_dump -U nexus nexus > backup_$(date +%Y%m%d).sql

# Restore from dump
cat backup.sql | docker compose exec -T postgres psql -U nexus nexus
```

**Volume cleanup** (destroys all data):
```bash
docker compose down -v  # Removes containers AND volumes
```

### Do NOT Do This

- **Do not use `postgres:16` image.** pgvector is required. Use `pgvector/pgvector:pg16`.
- **Do not hardcode passwords in `docker-compose.yaml`.** Use `.env` file or Docker secrets.
- **Do not expose port 5432 to the host in production.** Only the nexus container needs database access. Remove `ports: ["5432:5432"]` from production compose.
- **Do not use `docker compose down -v` without confirming data backup.** This deletes the pgdata volume.
- **Do not build the Docker image inside the dev container.** No Docker-in-Docker available. Build on the host or in CI.
- **Do not use `latest` tag for pgvector image.** Pin to `pgvector/pgvector:pg16` for reproducibility.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| `nexus` starts before postgres is ready | Missing `depends_on.condition: service_healthy` | Connection refused on startup | Add health check + condition |
| `CREATE EXTENSION vector` fails | Wrong postgres image | Migration error | Switch to `pgvector/pgvector:pg16` |
| Data lost after `docker compose down` | Used `-v` flag | Database empty on restart | Restore from backup; don't use `-v` |
| Port conflict on 3000 or 5432 | Another service using the port | Bind error | Change port in env or stop conflicting service |
| `.env` committed to git | Missing `.gitignore` entry | Secrets in repo | Add `*.env` and `.env` to `.gitignore` |

## Exit Criteria

- `docker compose up` starts both services successfully
- Postgres health check passes before nexus starts
- Migrations apply on first start
- `GET /api/health` returns `{ "status": "ok" }` with `dependencies.database: "connected"`
- Data persists across `docker compose restart` (not `down -v`)
- No hardcoded passwords in compose file
- pgvector image used (not standard postgres)
