# Session Handoff — 2026-04-02

## Current State

**Day 7: COMPLETE.** SDK ergonomics, E2E tests through SDK boundary, demo polish. Days 1–6 locked. Ready for Day 8.

## Build Progress

| Day | Scope | Tests | Status |
|-----|-------|-------|--------|
| 1 | Setup + scaffold | 17 | LOCKED |
| 2 | Decision Graph | 30 | LOCKED |
| 3 | Scoring Layer | 43 | LOCKED |
| 4 | Assembly (compile pipeline, packer, formatter) | 25 | LOCKED |
| 4+ | Proof Lock | 11 | LOCKED |
| 5 | Critical Test + Change Propagator | 24 | LOCKED |
| 6a | SDK Client + Seed + Demo Script | 9 | LOCKED |
| 6b | API Server (Hono) + E2E Tests | 27 | LOCKED |
| 7 | SDK Ergonomics + E2E + Demo Polish | 27 | COMPLETE |

**Total**: 213/213 tests pass, 13 test files, 3/3 packages build clean.

### Test Breakdown by Package

| Package | Tests | Files |
|---------|-------|-------|
| @nexus-ai/core | 150 | 8 (setup, decision-graph, scoring, compiler, role-differentiation, scenario, change-propagator, migrator) |
| @nexus-ai/sdk | 36 | 3 (client, e2e, placeholder) |
| @nexus-ai/server | 27 | 2 (routes, placeholder) |

## Day 7 Deliverables

### SDK Completion
- `NexusApiError` class: preserves server error envelope (status, code, serverMessage, details)
- 6 methods added: `updateDecisionStatus`, `createEdge`, `listEdges`, `deleteEdge`, `listArtifacts`, `health()`
- Type fixes: `ConnectedDecision[]` return on graph, `HealthResponse`, `NexusErrorEnvelope` exports
- SDK now covers 100% of server routes — every endpoint has a typed SDK method

### SDK E2E Tests (27 new)
- Route through real Hono app via `globalThis.fetch` interception + real PostgreSQL
- Cover: health, errors (×3), project CRUD, agent CRUD, decision CRUD (×5), edge CRUD (×4), artifact CRUD (×2), graph, compile (×3), role differentiation proof (×2), notifications (×2), full lifecycle (×1)

### Demo Script (`examples/software-team/comparison.ts`)
- 4-section structure:
  - A: Baseline vector retrieval (identical output for every agent)
  - B: Nexus per-role compilation (builder/reviewer/launch, different scores and ordering)
  - C: Change propagation (supersede → role-appropriate notifications → recompile)
  - D: SDK ergonomics showcase (edges, artifacts, graph traversal, typed error handling)
- Health check on startup with typed error handling
- Developer execution path documented in script header

## Key Decisions (All Locked)

- **AMB-1:** Raw `pg` driver, no Supabase client
- **PostgreSQL**: 17 + pgvector 0.8.0 inside container (dev-only)
- **Start PG**: `sudo -n pg_ctlcluster 17 main start`
- **DATABASE_URL**: `postgresql://nexus:nexus_dev@localhost:5432/nexus`

## Repo State

```
nexus/packages/core/src/       — types, roles, db, decision-graph, context-compiler, change-propagator
nexus/packages/sdk/src/        — NexusClient, NexusApiError, type re-exports
nexus/packages/server/src/     — Hono app + middleware (errors, auth, validate)
nexus/examples/software-team/  — comparison.ts demo (rewritten Day 7)
```

## Deferred Items (From Day 6/7)

- Per-project API key isolation (api_keys table)
- Key rotation, expiry, rate limiting per key, scoped permissions
- WebSocket endpoint for real-time push (propagator supports it, server doesn't expose WS)
- Demo requires running server (no in-process mode)
- No `context_cache` table
- AMB-2 through AMB-5 open (non-blocking)

## Recommended Day 8 Target

Options for operator scoping:
1. **Server standalone runner** — `@hono/node-server` adapter, `pnpm dev:server` script, so the demo can actually run end-to-end from CLI
2. **Integration hardening** — context_cache table, session summaries, artifact scoring in compiler
3. **Auth/security** — per-project API keys, key rotation, rate limiting
4. **Documentation** — README, API reference, getting-started guide

Requires explicit approval.

## Proof Lock

- `ROLE-DIFFERENTIATION-PROOF.md` + `role-differentiation.test.ts` (11 assertions)
- `scenario.test.ts` (11 — THE Scenario from spec §20)
- `routes.test.ts` includes E2E role-differentiation through API boundary
- `e2e.test.ts` includes role-differentiation proof through SDK boundary
