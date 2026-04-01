# STATUS.md — Nexus v1

## Current Phase

Day 3 Implementation — **COMPLETE**

## Health

**Green** — Monorepo builds (3/3), all tests pass (90/90).

## Progress

- Capability layer: 100% (15/15 files)
- Day 1 implementation: 100% (13/13 tasks)
- Day 2 implementation: 100% (5/5 deliverables)
- Day 3 implementation: 100% (scoring layer complete)
- Implementation: Days 1-3 of 15 complete

## Last Updated

2026-04-02 03:10 UTC+8

## Recent Activity

- Context Compiler scoring layer: all 5 signals implemented per ALGORITHM-REFERENCE.md
- Pure functions: computeDirectAffect, computeTagMatching, computeRoleRelevance, computeSemanticSimilarity, computeFreshness
- Status penalty: superseded (0.4/0.1), reverted (0.05), active/pending (1.0)
- Combined score: min(1.0, relevance×0.7 + freshness×0.3)
- Debug mode: per-decision score breakdown logging
- 43 new scoring tests (exact calculations, role-differentiation proof, missing-signal fallbacks, determinism)
- All 90 tests pass, 3 packages build clean

## Resolved Blockers

### AMB-1: Supabase Client vs. Raw PostgreSQL — RESOLVED 2026-04-01
**Decision:** Adopt raw `pg` (node-postgres). Drop `@supabase/supabase-js`.

### PostgreSQL 17 Compatibility — RESOLVED 2026-04-02
**Issue:** Schema's `get_connected_decisions` function used double `UNION ALL` with recursive reference, rejected by PG17.
**Fix:** Refactored to single recursive term with `JOIN LATERAL` combining both edge directions.

## Next Steps

1. Day 4: Context Compiler — Assembly (expandGraphContext, packIntoBudget, formatAsMarkdown/Json)
2. Day 5: Critical Test + Change Propagator
3. Days 6-10: Server, SDK, Demo, Docker

## Notes

- PostgreSQL runs inside the Docker container (dev only, not production architecture)
- pgvector extension version: 0.8.0 (supports vector(1536) for OpenAI embeddings)
- IVFFlat index warning on empty tables is expected; index rebuilds on sufficient data
- `fileParallelism: false` in vitest config — required for DB integration test ordering
- Auto-state-preservation rule active
