# Session Handoff — 2026-04-01

## Last Completed Phase

**Phase 1A — Nexus Capability Layer** — approved and executed.

15 files created:
- 4 shared Nexus foundation files (`projects/nexus-v1/shared/`)
- 2 Architect capability files
- 3 Backend capability files (highest stakes: spec-to-code map, known bugs, algorithm reference with worked examples)
- 1 Product capability file (scope boundary)
- 1 DevOps capability file (infrastructure spec)
- 1 Security capability file (v1-scoped threat model)
- 2 QA capability files (test plan + scenario definitions with expected outputs)
- 1 Docs capability file (key messaging)

Spec relocated: `projects/nexus-v1/nexus-v1-spec.txt`

Full planning pass: `projects/NEXUS-CAPABILITY-LAYER-PLAN.md`

## System State

- Enterprise layer: 5 files, all substantive
- Agents: 12 directories + COORDINATION.md. 7 agents now have `capabilities/` subdirectories with Nexus-specific files
- Workflows: 10 (01–10)
- Standards: 17 files (ENGINEERING-EXECUTION.md mechanically hardened in prior session)
- Projects: `nexus-v1/` — STATUS.md, CHECKPOINT.md, DECISIONS.md, shared/ (4 files), spec, AMB-1 decision artifact, CAPABILITY-LAYER-PLAN.md
- Memory: MEMORY.md updated with Phase 1A completion state

## Nexus v1

### Status: BLOCKED on AMB-1

**AMB-1: Supabase Client vs. Raw PostgreSQL**

The spec uses `@supabase/supabase-js` client syntax everywhere but Docker compose connects to raw PostgreSQL. These are incompatible. Every database operation in the spec depends on this resolution.

Decision artifact: `projects/nexus-v1/AMB-1-SUPABASE-VS-POSTGRES-DECISION.md`

**Recommendation:** Option 2 (raw `pg` driver + pgvector). See decision artifact for full analysis.

### What's Next (After AMB-1)

1. Operator resolves AMB-1
2. Optionally: Phase 1B (9 more capability files) — see CAPABILITY-LAYER-PLAN.md
3. Implementation Phase 2 (Week 1 core build: Days 1-5)

### Discovered Issues

**5 confirmed spec bugs:** Missing comma in graph expansion, truncated role tags, truncated freshness divisor, truncated formatter lines, truncated packer joins. All in `agents/backend/capabilities/NEXUS-KNOWN-SPEC-ISSUES.md`.

**5 ambiguities:** AMB-1 (blocking), AMB-2 through AMB-5 (non-blocking, resolvable during implementation).

## Deferred

- Phase 1B: 9 capability files (defined in CAPABILITY-LAYER-PLAN.md, not started)
- Lower-priority corrections from prior sessions (standard consolidations)
- IDENTITY.md, TOOLS.md, BOOT.md still minimal (low priority)

## What Not to Do

- Do not begin implementation until AMB-1 is resolved
- Do not rebuild Phase 1A files (they are complete and approved)
- Do not start Phase 1B without explicit approval
- Do not create generic capability files — everything must be Nexus-specific
