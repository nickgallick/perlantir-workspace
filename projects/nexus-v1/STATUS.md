# STATUS.md — Nexus v1

## Current Phase

Day 2 Implementation — **COMPLETE**

## Health

**Green** — Monorepo builds (3/3), all tests pass (47/47), schema applied to live PostgreSQL.

## Progress

- Capability layer: 100% (15/15 files)
- Day 1 implementation: 100% (13/13 tasks)
- Day 2 implementation: 100% (5/5 deliverables)
- Implementation: Days 1-2 of 15 complete

## Last Updated

2026-04-02 02:22 UTC+8

## Recent Activity

- Migration runner implemented (Node.js-based, no psql dependency)
- Decision CRUD: create (with optional embedding), read, list (with filters), update status
- Edge CRUD: create, list by source/target/decision, delete, list by relationship
- Graph traversal: `getConnectedDecisions` (recursive via SQL function), `getProjectGraph`
- Fixed schema `get_connected_decisions` for PostgreSQL 17 compatibility (LATERAL JOIN pattern)
- PostgreSQL 17 + pgvector 0.8.0 installed and running inside container (dev environment)
- 30 new tests (3 migrator + 27 decision-graph integration)
- All 47 tests pass, 3 packages build clean

## Resolved Blockers

### AMB-1: Supabase Client vs. Raw PostgreSQL — RESOLVED 2026-04-01
**Decision:** Adopt raw `pg` (node-postgres). Drop `@supabase/supabase-js`.

### PostgreSQL 17 Compatibility — RESOLVED 2026-04-02
**Issue:** Schema's `get_connected_decisions` function used double `UNION ALL` with recursive reference, rejected by PG17.
**Fix:** Refactored to single recursive term with `JOIN LATERAL` combining both edge directions.

## Next Steps

1. Day 3: Context Compiler — Scoring (`scoreDecisions`, freshness, role relevance)
2. Day 4: Context Compiler — Assembly (expand, pack, format)
3. Day 5: Critical Test + Change Propagator

## Notes

- PostgreSQL runs inside the Docker container (dev only, not production architecture)
- pgvector extension version: 0.8.0 (supports vector(1536) for OpenAI embeddings)
- IVFFlat index warning on empty tables is expected; index rebuilds on sufficient data
- `fileParallelism: false` in vitest config — required for DB integration test ordering
- Auto-state-preservation rule active
