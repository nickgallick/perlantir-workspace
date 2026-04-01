# STATUS.md — Nexus v1

## Current Phase

Phase 1A: Capability Layer — **COMPLETE**

## Health

**Green** — AMB-1 resolved. Ready for implementation.

## Progress

- Capability layer: 100% (15/15 files)
- Project instantiation: In progress (STATUS, CHECKPOINT, DECISIONS created)
- Implementation: 0% — not started, blocked

## Last Updated

2026-04-01 23:10 UTC+8

## Recent Activity

- Full 56-page spec ingested and analyzed
- Planning pass completed → `projects/NEXUS-CAPABILITY-LAYER-PLAN.md`
- Phase 1A approved and executed: 15 capability files across 4 shared + 7 agent directories
- 5 confirmed spec code bugs documented in `agents/backend/capabilities/NEXUS-KNOWN-SPEC-ISSUES.md`
- 5 ambiguities documented, AMB-1 identified as blocking
- Spec relocated to `projects/nexus-v1/nexus-v1-spec.txt`
- MEMORY.md updated with Phase 1A state

## Resolved Blockers

### AMB-1: Supabase Client vs. Raw PostgreSQL — RESOLVED 2026-04-01

**Decision:** Adopt raw `pg` (node-postgres). Drop `@supabase/supabase-js`. Preserve 2-service Docker compose.

**Decision artifact:** `projects/nexus-v1/AMB-1-SUPABASE-VS-POSTGRES-DECISION.md`

## Next Steps

1. Day 1 implementation (monorepo setup, types, roles, DB schema, embeddings, pg pool)
2. Optionally: Phase 1B (9 capability files) in parallel or after implementation starts
3. Implementation Phase 2 (Week 1 core build: Days 1-5)

## Notes

- Phase 1B scope defined in `projects/NEXUS-CAPABILITY-LAYER-PLAN.md` (9 files)
- 4 remaining ambiguities (AMB-2 through AMB-5) are non-blocking; resolvable during implementation
- Spec's 15-day build order remains the implementation baseline
