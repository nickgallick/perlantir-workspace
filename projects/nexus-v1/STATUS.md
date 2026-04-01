# STATUS.md — Nexus v1

## Current Phase

Phase 1A: Capability Layer — **COMPLETE**

## Health

**Yellow** — Blocked on AMB-1 (Supabase client vs. raw PostgreSQL). No implementation until resolved.

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

## Blockers

### AMB-1: Supabase Client vs. Raw PostgreSQL (BLOCKING)

The spec uses `@supabase/supabase-js` client syntax throughout all code (§7, §10, §14), but the Docker compose (§16) connects to raw PostgreSQL, not a Supabase API endpoint. The Supabase JS client requires an HTTP URL to a PostgREST-compatible API, not a PostgreSQL connection string.

**Impact:** Every database operation in the spec must be reinterpreted depending on resolution. Affects: Architect, Backend, DevOps, QA.

**Decision artifact:** `projects/nexus-v1/AMB-1-SUPABASE-VS-POSTGRES-DECISION.md`

## Next Steps

1. Resolve AMB-1 (operator decision required)
2. Upon AMB-1 resolution: optionally approve Phase 1B (9 capability files) or proceed to implementation
3. Implementation Phase 2 (Week 1 core build) cannot start until AMB-1 is resolved

## Notes

- Phase 1B scope defined in `projects/NEXUS-CAPABILITY-LAYER-PLAN.md` (9 files)
- 4 remaining ambiguities (AMB-2 through AMB-5) are non-blocking; resolvable during implementation
- Spec's 15-day build order remains the implementation baseline
