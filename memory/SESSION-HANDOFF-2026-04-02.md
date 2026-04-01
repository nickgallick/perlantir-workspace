# Session Handoff — 2026-04-02

## Current State

**Day 6 (both parts): COMPLETE.** SDK client + seed data + demo script + full API server built and tested. Days 1–5 locked. Ready for Day 7.

## What Was Built Today

| Day | Scope | Tests | Status |
|-----|-------|-------|--------|
| 2 | Decision Graph | 30 | LOCKED |
| 3 | Scoring Layer | 43 | LOCKED |
| 4 | Assembly (compile pipeline, packer, formatter) | 25 | LOCKED |
| 4+ | Proof Lock | 11 | LOCKED |
| 5 | Critical Test + Change Propagator | 24 | LOCKED |
| 6a | SDK Client + Seed + Demo Script | 9 | LOCKED |
| 6b | API Server (Hono) + E2E Tests | 27 | COMPLETE |

**Total**: 186/186 tests pass (12 test files), 3/3 packages build clean.

## Key Decisions (All Locked)

- **AMB-1:** Raw `pg` driver, no Supabase client
- **PostgreSQL**: 17 + pgvector 0.8.0 inside container (dev-only)
- **Start PG**: `sudo -n pg_ctlcluster 17 main start`
- **DATABASE_URL**: `postgresql://nexus:nexus_dev@localhost:5432/nexus`

## Repo State

```
nexus/packages/core/src/       — types, roles, db, decision-graph, context-compiler, change-propagator
nexus/packages/sdk/src/        — NexusClient + type re-exports
nexus/packages/server/src/     — Hono app + middleware (errors, auth, validate)
nexus/examples/software-team/  — comparison.ts demo
```

## Next: Day 7 — Demo Polish + Artifact CRUD Integration

Requires explicit approval.

## Proof Lock

- `ROLE-DIFFERENTIATION-PROOF.md` + `role-differentiation.test.ts` (11)
- `scenario.test.ts` (11)
- `routes.test.ts` includes E2E role-differentiation through API boundary

## Stubbed / Remaining

- Per-project API key isolation (api_keys table)
- Key rotation, expiry, rate limiting per key, scoped permissions
- WS endpoint for real-time push
- No `context_cache` table
- AMB-2 through AMB-5 open (non-blocking)
