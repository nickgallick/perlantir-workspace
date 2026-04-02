# SKILL-HEALTH-CHECK-VERIFICATION

## Purpose

Use the `/api/health` endpoint and direct DB checks to verify system health, diagnose degraded state, and determine deployment readiness.

## When to Use

- System health investigation after deployment
- Monitoring integration (Docker health check, uptime monitoring)
- Pre-deploy verification
- Diagnosing "degraded" health status
- Load testing readiness check

## Inputs Required

- `packages/server/src/app.ts` — health route implementation
- `packages/core/src/db/client.ts` — `healthCheck` function
- `packages/sdk/src/client.ts` — `health()` SDK method

## Execution Method

### Health Endpoint Behavior

```
GET /api/health

Healthy response (200):
{
  "status": "ok",
  "version": "1.0.0",
  "dependencies": { "database": "connected" },
  "timestamp": "2026-04-02T..."
}

Degraded response (503):
{
  "status": "degraded",
  "version": "1.0.0",
  "dependencies": { "database": "disconnected" },
  "timestamp": "2026-04-02T..."
}
```

**Implementation**: `healthCheck(pool)` runs `SELECT 1 AS ok` against the pool. If it returns `1`, database is "connected". If it throws (connection refused, timeout, pool exhausted), database is "disconnected" and status is "degraded".

### Health Check Tiers

**Tier 1 — Liveness** (is the process alive?):
- HTTP server responds on configured port
- Use for: Docker `HEALTHCHECK`, Kubernetes liveness probe
- Check: `curl -f http://localhost:3000/api/health` exits 0

**Tier 2 — Readiness** (can it serve requests?):
- Database is connected (`dependencies.database === "connected"`)
- Use for: load balancer readiness, deployment verification
- Check: response status is 200 (not 503)

**Tier 3 — Deep health** (not yet implemented):
Future checks to add:
- Migration state: all migrations applied
- Pool saturation: connections used vs max
- Extension availability: vector and uuid-ossp present
- Disk space on data volume

### Docker Compose Health Check

```yaml
# For the nexus service:
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 10s
```

**Note**: The production Docker image needs `curl` installed, or use a wget/node-based check instead:
```yaml
test: ["CMD", "node", "-e", "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1))"]
```

### SDK Health Check

```typescript
const client = new NexusClient({ url: 'http://localhost:3000' });
try {
  const h = await client.health();
  if (h.status === 'ok') console.log('System healthy');
  if (h.status === 'degraded') console.warn('System degraded:', h.dependencies);
} catch (e) {
  console.error('System unreachable');
}
```

### Diagnosing Degraded State

| Symptom | Likely Cause | Verification | Fix |
|---------|-------------|-------------|-----|
| `database: "disconnected"` | PG not running | `pg_isready -h localhost -p 5432` | Start PG |
| `database: "disconnected"` | Wrong DATABASE_URL | Check env var | Fix connection string |
| `database: "disconnected"` | Pool exhausted | Check active connections: `SELECT count(*) FROM pg_stat_activity` | Fix connection leaks, increase pool max |
| Health endpoint unreachable | Server not started | Check process / container logs | Start server |
| 503 intermittent | PG under heavy load | Check `pg_stat_activity` for long queries | Optimize queries, add connection pool |

### Do NOT Do This

- **Do not use health endpoint as a performance benchmark.** It runs `SELECT 1` — tells you nothing about query performance.
- **Do not set health check interval below 10s in production.** Frequent checks add load and noise.
- **Do not expose health endpoint without auth in multi-tenant deployments.** For v1 (single-tenant, self-hosted), unauthenticated health is acceptable. The health route is under `/api/*` so auth middleware applies when `NEXUS_API_KEY` is set — consider exempting it.
- **Do not treat "degraded" as "down."** The server is still responding — it just can't reach the database. Useful for debugging.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| Health returns 200 but compile fails | Health only checks connectivity, not schema | Compile endpoint returns 500 | Add migration state to health check (future) |
| Health check blocks on slow DB | `SELECT 1` waiting for connection from exhausted pool | Health timeout | Set query timeout on health check pool query |
| Auth blocks health check | `NEXUS_API_KEY` set, health needs Bearer token | Docker health check fails (no auth header) | Exempt `/api/health` from auth, or include key in health check command |

## Exit Criteria

- `GET /api/health` returns 200 with `status: "ok"` and `database: "connected"`
- Health check integrated into Docker Compose or deployment monitoring
- Degraded state (503) correctly detected when PG is down
- No false positives (healthy when actually broken)
