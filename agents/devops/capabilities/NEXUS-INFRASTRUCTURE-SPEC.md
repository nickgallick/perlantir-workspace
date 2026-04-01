# NEXUS-INFRASTRUCTURE-SPEC.md

Infrastructure specification for Nexus v1. Derived from Spec §16, constrained by TOOLS.md runtime reality.

---

## Docker Compose Topology (Spec §16)

Two services, one volume:

```yaml
services:
  nexus:
    build: .
    ports: ["${PORT:-3000}:${PORT:-3000}"]
    environment:
      - DATABASE_URL=postgresql://nexus:${POSTGRES_PASSWORD:-nexus_dev}@postgres:5432/nexus
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - PORT=${PORT:-3000}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: pgvector/pgvector:pg16        # NOT standard postgres — pgvector required
    ports: ["5432:5432"]
    environment:
      - POSTGRES_USER=nexus
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-nexus_dev}
      - POSTGRES_DB=nexus
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d   # Auto-run schema on first start
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nexus"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

**Critical:** `pgvector/pgvector:pg16` is mandatory. Standard `postgres:16` does not include `CREATE EXTENSION vector`.

## Dockerfile (Spec §16)

Multi-stage build:

```dockerfile
# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/ packages/
RUN pnpm install --frozen-lockfile
RUN pnpm turbo build

# Stage 2: Run
FROM node:20-slim
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/server/package.json ./packages/server/
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/node_modules ./node_modules
EXPOSE ${PORT:-3000}
CMD ["node", "packages/server/dist/index.js"]
```

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|---------|---------|---------|
| `OPENAI_API_KEY` | **Yes** | — | Embeddings API (every decision/artifact creation) |
| `DATABASE_URL` | Auto | Derived from compose (`postgresql://nexus:...@postgres:5432/nexus`) | PostgreSQL connection string for `pg.Pool` |
| `POSTGRES_PASSWORD` | No | `nexus_dev` | Database password (used in compose + DATABASE_URL) |
| `PORT` | No | `3000` | Server port |
| `ANTHROPIC_API_KEY` | No | — | Distillery only (post-launch, opt-in) |
| `NEXUS_API_KEY` | No | — | API authentication |

## Runtime Constraints (from TOOLS.md)

| Constraint | Impact on DevOps |
|-----------|-----------------|
| **No Docker CLI inside container** | Cannot test `docker compose up` from dev environment. Compose files are authored and committed; tested on host or in CI |
| **No kubectl/terraform** | No Kubernetes. Docker compose is the deployment target for v1 |
| **Node.js 22.22.2 in dev, Node 20-slim in Docker** | Minor version gap. All code must work on Node 20+. Don't use Node 22-specific APIs |
| **No database CLIs** | Cannot verify schema via psql. Use migration auto-run + test suite verification |
| **Git available** | GitHub Actions workflow files can be created and committed normally |
| **corepack available** | Use corepack for pnpm in dev. Dockerfile uses `npm install -g pnpm` instead (spec's choice) |

## CI/CD Target (Spec §19 Day 13)

GitHub Actions:
- **On PR:** Run `pnpm install && pnpm turbo test`. Requires a PostgreSQL service container with pgvector for integration tests
- **On tag:** Publish @nexus-ai/core, @nexus-ai/server, @nexus-ai/sdk to npm

Key CI requirement: the test job needs a `pgvector/pgvector:pg16` service container, not standard postgres. This is non-negotiable for tests that touch vector queries or the recursive CTE.

## Health Check

```
GET /api/health → {"status":"ok","version":"1.0.0"}
```

This is the liveness check. Docker compose `depends_on` only waits for Postgres health; the nexus container's own health should be verifiable via this endpoint.

---

## What this changes in execution

DevOps knows exactly what to build: two-service compose, multi-stage Dockerfile, pgvector image requirement, CI with pgvector service container. No guessing about infrastructure. Runtime constraints prevent wasted effort on Docker-in-Docker testing or Kubernetes planning. Eliminates: wrong Postgres image, missing pgvector in CI, Node version mismatches, undocumented env vars.
