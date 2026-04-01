# MEMORY.md

## Operator Context

**Nick Gallick**
- Timezone: Asia/Kuala_Lumpur (UTC+8)
- Communication style: Direct, technical, precise. No filler. No hedging.
- Quality bar: Premium — no generic output, everything specific to this system
- Approval discipline: Explicit approval phrases required for all Category 2+ work
- Expectation: State-of-the-art multi-agent operating system with strict governance, restart resilience, strong verification, and no generic filler

---

## System Identity

**Project**: Perlantir — Enterprise multi-agent AI operating system

**Architecture**: Governor-centric. Governor manages phases, approval gates, and specialist dispatch. Specialists execute within approved scope. All behavior governed by explicit standards, not prompts alone.

**Workspace root**: `/data/.openclaw/workspace/`

---

## Build State (as of 2026-04-01)

### Completed Work

**Phase 5 — Standards and Operator Layer**
19 files: 16 standards + 3 memory convention files.

**Phase 6 — Governor Bootstrap Protocol**
`enterprise/BOOTSTRAP.md` (536 lines). 9-stage read order, 27 required files, 10 block triggers.

**Execution Persistence — CHECKPOINT.md System**
`standards/EXECUTION-PERSISTENCE-STANDARD.md` (774 lines), `projects/.template/CHECKPOINT.md` (327 lines), Bootstrap Stage 2.5 enhanced. No per-project CHECKPOINTs yet.

**Correction Phase 1 — Bootstrap Self-Contradiction Resolution**
Deleted root `BOOTSTRAP.md`. Populated `USER.md`. Rewrote 4 enterprise core files: GOVERNANCE.md (authority hierarchy, decision thresholds, standard-precedence rule), INTAKE.md (intake authority, points to workflow 01), REVIEW-GATES.md (gate authority, points to workflows 06/07), GLOSSARY.md (30 key terms). All 27 Tier 1 files now substantive. Bootstrap B-3 resolved.

**Correction Phase 2A — Coordination Centralization**
Created `agents/COORDINATION.md` (278 lines, 44 unique agent-pair relationships). Replaced Section 7 in all 11 specialist AGENT.md files with concise summary + COORDINATION.md reference. Governor AGENT.md untouched. Net −116 lines.

**Correction Phase 2B — Agent-Standards Binding**
Fixed Governor approval-language contradiction: Category 0-1 allows informal approval; Category 2+ requires explicit phrase; defaults to Category 2 when uncertain. Added "Governing Standards" section to all 12 agent files. Governor references 17 standards; specialists reference 7-11 each, role-appropriate. +196 lines.

**Mechanical Coding Override Integration**
Integrated 6 high-value execution mechanics into `standards/ENGINEERING-EXECUTION.md` only (+47 lines, 224→271). No other files modified.
1. §Structural Quality Discipline — coding-time structural reasoning criteria (naming, cohesion, coupling, abstraction boundaries, God-file detection, separation of concerns). Coding-only. Grounds for Governor rework.
2. §Decomposition Signaling — specialists must flag phases touching >8 files, >500 LOC net new, >3 logical concerns, or exceeding context capacity. Universal.
3. §Tool Output Completeness — truncation awareness extended from file reads to all tool output (exec, grep, web fetch, API). Truncated output acted on without acknowledgment = verification failure. Universal.
4. §Refactor Pre-Protocol (Step 0) — mandatory 4-step cleanup pass (dead code, formatting, cruft, separate checkpoint) before any refactor phase. Coding-only.
5. §Long-File Handling tightened — bounded reads default at >300 lines (was >3000), mandatory at >1000 lines (was >5000). Universal.
6. §Rename search targets — replaced generic "include" list with 9 enumerated categories (direct imports, types, string literals, dynamic imports, re-exports, test fixtures, docs, configs, manifests). Coding-only.

---

## First Project: Nexus v1

**Status**: Confirmed as the first real project. No execution has started.

**What Nexus is**: The first project to be executed under the full Perlantir governance system. Will instantiate the first CHECKPOINT.md, exercise all write triggers, and prove the system works in practice.

**Capability Layer Planning**: A Specialist Capability Layer was designed (85 files across 11 agents, 4 phases). Decision: do NOT build generic capability files before knowing the project. Build only Nexus-specific capability assets that are clearly justified by what Nexus needs. Avoid premature abstraction and generic "best practices" documents.

**Next step**: Plan a Nexus-specific capability layer before implementation begins. Only build assets that directly serve Nexus execution — decision frameworks, templates, and rubrics the build agents will actually use for this project.

**What is deferred**: Generic capability files, repo cloning/downloading, and stack-specific external resource expansion — unless clearly justified by Nexus needs.

---

## What Exists Now

```
workspace/enterprise/          5 files (all substantive)
workspace/agents/              12 agent directories (each with AGENT.md + Governing Standards section)
                               + COORDINATION.md (centralized inter-specialist rules)
workspace/workflows/           10 workflows (01–10)
workspace/standards/           17 files
workspace/memory/              3 convention files + daily log + session handoff
workspace/projects/.template/  5 files
```

Root: AGENTS.md, SOUL.md, USER.md, IDENTITY.md, TOOLS.md, HEARTBEAT.md, MEMORY.md, BOOT.md

---

## Approved vs. Not Approved

**Approved and complete**: All build phases, Correction Phases 1, 2A, 2B.

**Not yet approved**:
- Nexus v1 execution — confirmed as next project, no phase approved yet
- Nexus-specific capability layer — planning pass needed before execution
- Remaining lower-priority corrections (see below)

---

## Remaining Corrections (Lower Priority, Deferred)

1. Consolidate VERIFICATION-STANDARD into DEFINITION-OF-DONE (merge, manifest 16→15)
2. Merge POSTMORTEM-AND-LEARNING and LESSONS-LEARNED-FORMAT (merge, manifest change)
3. Tighten SESSION-HANDOFF-FORMAT.md (~483→~250 lines)
4. Merge MEMORY-RULES.md into MEMORY-CONVENTIONS.md (Tier 1 count 27→26)

These are cleanliness fixes. The system is operationally sound without them.

---

## Known Issues

1. **MEMORY-RULES / MEMORY-CONVENTIONS overlap**: ~60% restatement. Deferred.
2. **VERIFICATION-STANDARD / DEFINITION-OF-DONE overlap**: Both partially define completion evidence. Deferred.
3. **No active project CHECKPOINTs**: Infrastructure ready, no projects in execution.
4. **IDENTITY.md, TOOLS.md, BOOT.md unpopulated**: Low priority.

---

## Recommended Next Step

Plan a Nexus-specific capability layer: identify what decision frameworks, templates, and rubrics the core build agents (Architect, Product, Backend, DevOps, Frontend) actually need for Nexus, then build only those before execution begins. No generic files. No premature abstraction.

Nick decides scope. No phase starts without approval.
