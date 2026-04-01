# NEXUS-SPEC-TO-CODE-MAP.md

Maps every spec section to its implementation target files, with build sequencing.

---

## Build Sequence

Implementation follows the spec's 15-day order (§19). Each day's deliverables depend only on prior days.

### Day 1: Setup (Spec §2, §3, §4, §5, §6, §13)

| Spec § | Output File | What to Do |
|--------|-----------|-----------|
| §3 | Monorepo root: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.env.example` | Scaffold monorepo. Enable corepack + pnpm first |
| §5 | `packages/core/src/types.ts` | Copy type definitions. Fix truncated lines (see KNOWN-SPEC-ISSUES). Change `NexusConfig`: `supabaseUrl`/`supabaseKey` → `databaseUrl` |
| §6 | `packages/core/src/roles.ts` | Copy role templates. Fix truncated weight map lines |
| §4 | `supabase/migrations/001_initial_schema.sql` | Copy schema. Verify all 9 tables + 2 functions + 3 triggers |
| §13 | `packages/core/src/context-compiler/relevance.ts` | `createOpenAIEmbedder()` + `cosineSimilarity()` |
| — | `packages/core/src/db/client.ts` | **New (AMB-1).** Create `pg.Pool` wrapper: pool creation from `DATABASE_URL`, typed query helpers, connection health check |
| — | `packages/core/package.json`, `tsconfig.json`, `vitest.config.ts` | Package setup for @nexus-ai/core. Dependencies: `pg`, `@types/pg` (not `@supabase/supabase-js`) |

**Verify:** monorepo builds (`pnpm install && pnpm turbo build`), types compile, DB schema applies cleanly, pool connects to Postgres

### Day 2: Decision Graph (Spec §4 tables + §7 graph parts)

| Output File | What to Do |
|-----------|-----------|
| `packages/core/src/decision-graph/graph.ts` | Decision CRUD: create (with embedding), read, list, update status |
| `packages/core/src/decision-graph/traversal.ts` | Call `get_connected_decisions` RPC, parse results |
| `packages/core/src/decision-graph/queries.ts` | Edge CRUD: create, list by decision |
| `packages/core/src/decision-graph/index.ts` | Barrel exports |
| `packages/core/tests/decision-graph.test.ts` | Tests: create 5 decisions with edges, verify CRUD + traversal |

**Verify:** create decisions → create edges → traverse graph → get connected decisions at depth

### Day 3: Context Compiler — Scoring (Spec §7 `scoreDecisions`)

| Output File | What to Do |
|-----------|-----------|
| `packages/core/src/context-compiler/compiler.ts` (partial) | `scoreDecisions()` with all 5 signals. `computeFreshness()`. `computeRoleRelevance()`. `cosineSimilarity()` |
| `packages/core/tests/context-compiler.test.ts` (partial) | Test: security decision → reviewer HIGH, launch LOW. Marketing decision → launch HIGH, builder LOW |

**Verify:** scores match expected values for known inputs (see ALGORITHM-REFERENCE)

### Day 4: Context Compiler — Assembly (Spec §7 full, §8, §9)

| Output File | What to Do |
|-----------|-----------|
| `packages/core/src/context-compiler/compiler.ts` (complete) | `expandGraphContext()`, `compile()` full pipeline |
| `packages/core/src/context-compiler/packer.ts` | `packIntoBudget()` from §8 |
| `packages/core/src/context-compiler/formatter.ts` | `formatAsMarkdown()`, `formatAsJson()` from §9 |
| `packages/core/src/context-compiler/index.ts` | Barrel exports |

**Verify:** `compile()` returns complete `ContextPackage` with both formatted outputs

### Day 5: Critical Test + Change Propagator (Spec §10, §20)

| Output File | What to Do |
|-----------|-----------|
| `packages/core/tests/scenario.test.ts` | THE test: same project, 3 agents (builder/reviewer/launch), 10 decisions → compile each → verify different context. See QA SCENARIO-DEFINITIONS |
| `packages/core/src/change-propagator/propagator.ts` | `ChangePropagator` class from §10 |
| `packages/core/src/change-propagator/subscriptions.ts` | Subscription management |
| `packages/core/src/change-propagator/index.ts` | Barrel exports |
| `packages/core/tests/change-propagator.test.ts` | Test: create decision → notifications generated → role messages differ → cache invalidated |

**Verify:** core product claim proven — different roles get different context from same data

### Days 6-10: Server, SDK, Demo, Docker (Spec §14, §15, §16, §17)

| Day | Output Files | Spec § |
|-----|------------|--------|
| 6 | `examples/software-team/comparison.ts`, SDK seed method | §15 (seed), §17 |
| 7 | Demo polish, artifact CRUD integration | §7 (artifacts) |
| 8 | `packages/server/src/app.ts`, all route files, middleware, WS handler | §14 |
| 9 | `packages/sdk/src/client.ts`, `types.ts`, `index.ts` | §15 |
| 10 | `docker-compose.yml`, `Dockerfile`, `.env.example` | §16 |

### Days 11-15: Docs, CI/CD, Launch Content, Launch (Spec §18, §19, §21)

Backend's role diminishes. Primarily Docs, GTM, DevOps scope.

---

## File Count Summary

| Package | Source Files | Test Files |
|---------|------------|-----------|
| core | ~15 (types, roles, nexus, db/*, decision-graph/*, context-compiler/*, change-propagator/*, distillery/*, temporal/*) | 5 |
| server | ~10 (app, index, routes/×7, middleware/×3, ws/handler) | 1 |
| sdk | 3 (client, types, index) | 1 |

---

## What this changes in execution

Backend knows exactly what to build on each day, which spec sections to reference, and what verification looks like. No ambiguity about "what's next." Eliminates: implementation ordering mistakes, building server before core is proven, skipping the critical scenario test, working on the wrong files for the current phase.
