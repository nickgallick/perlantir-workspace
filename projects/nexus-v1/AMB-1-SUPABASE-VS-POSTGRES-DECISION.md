# AMB-1: Supabase Client vs. Raw PostgreSQL

**Status:** BLOCKING — no implementation until resolved  
**Identified:** 2026-04-01  
**Owner:** Architect → Operator decision required

---

## The Mismatch

The spec uses the Supabase JavaScript client in **every database operation** across three files:

**Spec §7 — ContextCompiler (compiler.ts):**
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
// ...
constructor(private db: SupabaseClient, private embed: EmbeddingFn) {}
// Used as:
const { data, error } = await this.db.from('decisions').select('*').eq('project_id', projectId)...
const { data: connected } = await this.db.rpc('get_connected_decisions', { start_id, max_depth });
await this.db.from('context_cache').upsert({...}, { onConflict: 'agent_id,task_hash' });
```

**Spec §10 — ChangePropagator (propagator.ts):**
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
constructor(private db: SupabaseClient, ...) {}
// Same .from().select().eq() patterns
```

**Spec §14 — API Server (app.ts):**
```typescript
import { createClient } from '@supabase/supabase-js';
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
```

**But Spec §16 — Docker Compose sets:**
```yaml
SUPABASE_URL=postgresql://nexus:${POSTGRES_PASSWORD:-nexus_dev}@postgres:5432/nexus
```

**The problem:** `@supabase/supabase-js` `createClient(url, key)` expects an HTTP URL pointing to a Supabase API (PostgREST + GoTrue + Storage). A `postgresql://` connection string will fail immediately — the client makes HTTP requests, not PostgreSQL wire protocol connections.

The spec also defines `NexusConfig` (§5) with `supabaseUrl: string` and `supabaseKey: string`, reinforcing the Supabase client assumption throughout the type system.

---

## Options

### Option 1: True Supabase Local Stack

**What:** Replace `pgvector/pgvector:pg16` with the full Supabase self-hosted stack (supabase/supabase Docker images: postgres + postgrest + gotrue + meta + studio).

**Pros:**
- Zero spec code changes. Every `.from().select().eq()` call works as-is
- `.rpc()` calls work natively (PostgREST exposes PostgreSQL functions)
- Supabase Studio gives free admin UI for debugging
- Auth (GoTrue) available if needed later

**Cons:**
- **Heavy.** Supabase self-hosted is 7+ Docker containers (postgres, postgrest, gotrue, meta, storage, studio, kong). Massive overhead for a library that needs one database
- Docker compose goes from 2 services to 8+. Startup time increases significantly
- Opaque failure modes — debugging PostgREST query translation issues is harder than debugging raw SQL
- `pgvector` must be confirmed compatible with Supabase's postgres image (it is, but adds a verification step)
- VPS resource usage: 31 GB RAM is comfortable, but 8 containers for a dev tool is excessive
- Violates spec §16 which explicitly defines a 2-service compose (nexus + postgres)

**Verdict: REJECTED.** The operational complexity is disproportionate to the benefit. Nexus is a library, not a Supabase app.

### Option 2: Raw PostgreSQL + pg Driver (RECOMMENDED)

**What:** Replace `@supabase/supabase-js` with the `pg` (node-postgres) driver. Rewrite all database operations as parameterized SQL queries.

**Pros:**
- **Simplest possible data layer.** Direct PostgreSQL connection, no intermediary
- Docker compose stays at 2 services (spec §16 preserved)
- `pgvector/pgvector:pg16` image works unchanged
- Full control over connection pooling (`pg.Pool`)
- Recursive CTE (`get_connected_decisions`) called directly via `pool.query()` — no PostgREST translation layer
- Vector queries (`ORDER BY embedding <=> $1`) run as native SQL — no Supabase client abstraction
- Type safety via explicit query result typing (no Supabase's generated types dependency)
- Easier to test — connect pool to test database, run queries, done
- Ecosystem standard: `pg` is the most-used Node.js PostgreSQL driver (13M+ weekly npm downloads)

**Cons:**
- **Every database query in the spec must be rewritten.** ~25-30 query calls across compiler.ts, propagator.ts, app.ts, and CRUD operations. The Supabase `.from().select().eq().single()` chain becomes `pool.query('SELECT * FROM decisions WHERE id = $1', [id])`
- `.rpc('get_connected_decisions', {...})` becomes `pool.query('SELECT * FROM get_connected_decisions($1, $2)', [startId, maxDepth])`
- `.upsert()` becomes `INSERT ... ON CONFLICT ... DO UPDATE`
- No query builder — raw SQL strings (or add a lightweight query builder like Kysely, but that's scope creep)
- `NexusConfig` type needs `databaseUrl: string` instead of `supabaseUrl` + `supabaseKey`

**Rewrite scope:** Moderate. The queries are straightforward CRUD + one RPC + one upsert. The logic doesn't change — only the database access layer.

### Option 3: PostgreSQL + Standalone PostgREST

**What:** Keep `pgvector/pgvector:pg16`, add a `postgrest/postgrest` container. Supabase JS client talks to PostgREST's HTTP API.

**Pros:**
- Most spec code works with minimal changes (Supabase client → PostgREST client, nearly identical API)
- `.from().select().eq()` works because PostgREST speaks the same query language
- `.rpc()` works (PostgREST exposes PostgreSQL functions)
- Lighter than full Supabase stack (3 containers instead of 8)

**Cons:**
- Docker compose goes from 2 services to 3
- PostgREST requires its own configuration (db URI, schemas, JWT secret)
- Adds an HTTP hop between app and database for every query
- PostgREST has edge cases with complex queries, especially vector operations (`<=>` operator may not be natively supported via PostgREST filters — would need `.rpc()` wrapper)
- The Supabase JS client works against PostgREST but with caveats (no GoTrue auth, no Storage, some client features assume full Supabase stack)
- Introduces a component that doesn't appear in the spec and doesn't add value for users

**Verdict: REJECTED.** PostgREST adds operational complexity and a network hop without meaningful benefit over direct `pg` driver.

### Option 4: Supabase JS Client Against Supabase Cloud (Free Tier)

**What:** Use Supabase cloud (free tier) for the database. Docker compose runs only the nexus container. `SUPABASE_URL` points to cloud instance.

**Pros:**
- Spec code works as-is
- Simplest Docker compose (1 service)
- Supabase cloud handles pgvector

**Cons:**
- **Defeats the "self-hosted" value proposition.** Spec §1 explicitly lists "Docker compose for self-hosting" as a v1 feature
- External dependency for a tool marketed as self-contained
- Free tier limits (500 MB database, 2 projects) may be hit during development
- Latency for embedding queries (cloud round-trip vs. local PostgreSQL)
- Users must create a Supabase account — friction for "one-command setup"
- Breaks the docker compose demo: `docker compose up -d` no longer gives you a working system

**Verdict: REJECTED.** Contradicts the self-hosted positioning that is central to Nexus's launch strategy.

---

## Recommendation: Option 2 — Raw pg Driver

### Rationale

1. **Simplest architecture.** One database dependency, one driver, no intermediary layers. This is a TypeScript library, not a Supabase app
2. **Preserves spec §16.** 2-service Docker compose, `pgvector/pgvector:pg16`, one-command setup — all unchanged
3. **Better developer experience for Nexus users.** Anyone self-hosting Nexus has PostgreSQL; not everyone has (or wants) Supabase
4. **Transparent query behavior.** Raw SQL is debuggable, profileable, and has no translation layer surprises. Critical for the vector similarity queries and recursive CTE
5. **The rewrite is bounded.** ~25-30 query calls, all straightforward CRUD. The business logic (scoring, packing, formatting, propagation) is completely untouched

### Migration Impact

**Files requiring reinterpretation:**

| Spec § | File | Changes |
|--------|------|---------|
| §5 | `types.ts` | `NexusConfig`: replace `supabaseUrl`/`supabaseKey` with `databaseUrl` (or `pgHost`/`pgPort`/`pgDatabase`/`pgUser`/`pgPassword`) |
| §7 | `compiler.ts` | Replace `SupabaseClient` constructor param with `pg.Pool`. Rewrite ~12 query calls from `.from().select()...` to `pool.query()` with parameterized SQL. `.rpc()` → direct function call via `pool.query('SELECT * FROM get_connected_decisions($1, $2)', ...)` |
| §10 | `propagator.ts` | Replace `SupabaseClient` with `pg.Pool`. Rewrite ~6 query calls |
| §13 | `relevance.ts` | No change (embedding utility doesn't touch DB) |
| §14 | `app.ts` | Replace `createClient` import with `pg.Pool` setup. Rewrite ~15 route handler queries |
| §16 | `docker-compose.yml` | Change `SUPABASE_URL` to `DATABASE_URL=postgresql://nexus:...@postgres:5432/nexus`. Remove `SUPABASE_SERVICE_KEY` |
| §4 | `001_initial_schema.sql` | No change (pure PostgreSQL already) |
| §15 | `client.ts` (SDK) | No change (SDK talks HTTP to server, never to database) |

**Files NOT affected:**
- `types.ts` (except NexusConfig) — all entity interfaces unchanged
- `roles.ts` — no database interaction
- `packer.ts` — no database interaction
- `formatter.ts` — no database interaction
- `freshness.ts` — no database interaction
- `comparison.ts` — uses SDK, not database
- `client.ts` (SDK) — HTTP only

**New dependency:** `pg` + `@types/pg` (replaces `@supabase/supabase-js`)

**New file:** `packages/core/src/db/client.ts` — pool creation, connection config, query helpers. Spec §3 already includes this file in the directory structure.

### Estimated Effort

~2-3 hours of query translation during Day 1-2 implementation. The query patterns are mechanical:

```typescript
// Supabase (spec)
const { data, error } = await this.db.from('decisions').select('*')
  .eq('project_id', projectId).in('status', statuses)
  .order('created_at', { ascending: false }).limit(500);

// pg (rewrite)
const { rows } = await this.pool.query(
  `SELECT * FROM decisions WHERE project_id = $1 AND status = ANY($2)
   ORDER BY created_at DESC LIMIT 500`,
  [projectId, statuses]
);
```

The rewrite is tedious but not complex. No business logic changes.

---

## Impact by Agent

| Agent | Impact |
|-------|--------|
| **Architect** | Must update NEXUS-ARCHITECTURE-BRIEF.md data layer section: "Supabase client" → "pg Pool". Package boundary unchanged. Algorithm unchanged |
| **Backend** | Rewrites ~30 queries during implementation. Must add `db/client.ts` with pool setup. NEXUS-SPEC-TO-CODE-MAP.md Day 1 adds pg setup step. NEXUS-KNOWN-SPEC-ISSUES.md: AMB-1 becomes a resolved decision, not an ambiguity |
| **DevOps** | Docker compose `SUPABASE_URL` → `DATABASE_URL`. Remove `SUPABASE_SERVICE_KEY`. NEXUS-INFRASTRUCTURE-SPEC.md env var table updated. No other changes |
| **QA** | Test setup uses `pg.Pool` instead of Supabase client. Test assertions unchanged (they test behavior, not query syntax). NEXUS-TEST-PLAN.md infrastructure section updated |
| **Security** | AMB-1 concern about Supabase service key is eliminated. Raw pg uses connection string auth — simpler trust model. Threat model unchanged |

---

## What this changes in execution

Resolving AMB-1 unblocks implementation. Once approved, 5 capability files get minor updates (env vars, client references), then Day 1 implementation can begin. The database access pattern is decided once and applied consistently — no mid-implementation discovery that the Supabase client doesn't work with Docker Postgres.
