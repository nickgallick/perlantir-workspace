# Session Handoff — 2026-04-01 / 2026-04-02

## Current State

**Day 1 Implementation: COMPLETE.** Nexus v1 monorepo is scaffolded, builds, and passes all tests. Ready for Day 2.

## Key Decisions (All Locked)

- **AMB-1 RESOLVED:** Raw `pg` (node-postgres) driver with `pg.Pool`. No `@supabase/supabase-js`. Approved 2026-04-01 23:57 UTC+8. All capability files updated to reflect this. Decision artifact: `projects/nexus-v1/AMB-1-SUPABASE-VS-POSTGRES-DECISION.md`
- **pnpm install method:** `npm install -g pnpm` (corepack needs elevated permissions in container). Functionally equivalent; matches Dockerfile approach.

## Repo State

**Location:** `workspace/nexus/`

```
nexus/
├── package.json, pnpm-workspace.yaml, turbo.json, .gitignore, .env.example, LICENSE
├── node_modules/                    (installed, 71 packages)
├── packages/
│   ├── core/                        (@nexus-ai/core — ACTIVE)
│   │   ├── src/
│   │   │   ├── index.ts             (barrel exports: types, roles, db, embeddings)
│   │   │   ├── types.ts             (all Nexus types, NexusConfig with databaseUrl)
│   │   │   ├── roles.ts             (8 role templates, BUG-2 fixed, TS strict fixed)
│   │   │   ├── nexus.ts             (stub)
│   │   │   ├── db/client.ts         (createPool, healthCheck via pg.Pool)
│   │   │   ├── db/index.ts          (barrel)
│   │   │   ├── context-compiler/relevance.ts  (createOpenAIEmbedder, cosineSimilarity)
│   │   │   ├── context-compiler/index.ts      (barrel)
│   │   │   ├── decision-graph/index.ts        (stub)
│   │   │   ├── change-propagator/index.ts     (stub)
│   │   │   ├── temporal/index.ts              (stub)
│   │   │   └── distillery/index.ts            (stub)
│   │   ├── tests/setup.test.ts      (17 tests — roles, cosine similarity, pool)
│   │   └── dist/                    (compiled)
│   ├── server/                      (@nexus-ai/server — stubs only)
│   └── sdk/                         (@nexus-ai/sdk — stubs only)
└── supabase/migrations/001_initial_schema.sql  (9 tables, 2 functions, 3 triggers — NOT YET APPLIED)
```

**Build status:** `pnpm turbo build` — 3/3 packages, zero errors
**Test status:** `pnpm turbo test` — 19/19 tests pass (17 core + 2 placeholders)

## Remaining Ambiguities (Non-Blocking)

- **AMB-2:** No API routes for session summaries — sessions are opt-in/post-launch; table exists, no routes needed in v1
- **AMB-3:** API key auth middleware not implemented in spec — open design decision, needed before launch (Day 8+)
- **AMB-4:** `PackResult` type import location — trivial; add to types.ts or import from packer
- **AMB-5:** WebSocket handler not specified — open design decision, needed for real-time propagation (Day 5+)

None of these block Day 2.

## Day 2 Target Scope

1. **Schema application via Node.js** — write a migration runner using pg.Pool (no psql available in container)
2. **Decision CRUD** — create (with embedding), read, list, update status. Parameterized SQL via pg.Pool
3. **Edge CRUD** — create, list by decision. Enforce constraints (no self-edge, unique per source/target/relationship)
4. **Graph traversal** — call `get_connected_decisions` PostgreSQL function via `pool.query()`
5. **Integration tests** — create 5 decisions with edges, verify CRUD + traversal returns correct depth/path

Day 2 requires a running PostgreSQL with pgvector. Schema applied via the Node.js migration runner as first task.

## Capability Layer State

- **Phase 1A:** 15 files complete (4 shared + 11 agent capabilities)
- **Phase 1B:** 9 files scoped but not started (see `projects/NEXUS-CAPABILITY-LAYER-PLAN.md`)
- **Planning pass:** `projects/NEXUS-CAPABILITY-LAYER-PLAN.md`
- **Spec:** `projects/nexus-v1/nexus-v1-spec.txt` (56 pages)
- **Known bugs:** 5, all documented in `agents/backend/capabilities/NEXUS-KNOWN-SPEC-ISSUES.md`

## Project Tracking Files

- `projects/nexus-v1/STATUS.md` — current status
- `projects/nexus-v1/CHECKPOINT.md` — checkpoint 003, Day 1 deliverables listed
- `projects/nexus-v1/DECISIONS.md` — 3 decisions (capability layer, scope compression, AMB-1, pnpm method)
- `projects/nexus-v1/DAY-1-IMPLEMENTATION-PLAN.md` — completed reference

## What Not to Do

- Do not rebuild Day 1 files (complete and verified)
- Do not start Phase 1B without explicit approval
- Do not skip the Node.js migration runner (no psql in container)
- Do not mock the database for Day 2 integration tests (must hit real pgvector Postgres)
- Do not jump to Day 3+ features (scoring, compiler) until Day 2 CRUD + traversal is proven
