# PHASE-A-TASK-BREAKDOWN.md — Live Integration Task List

**Created**: 2026-04-03 01:22 UTC+8
**Author**: Governor
**Status**: READY FOR EXECUTION
**Related**: PHASE-A-INTEGRATION-PROTOCOL.md (just created)

---

## Overview

Phase A requires executing exactly 2 real specialist tasks with Nexus-compiled context, recording 1+ real decisions, and demonstrating a supersede cycle that changes compiled output.

This document breaks Phase A into executable specialist tasks.

---

## Task 1: Architect → Protocol Design & Decision Framework

**Objective**: Design the Governor ↔ Nexus protocol and define decision taxonomy for Phase A work

**Specialist**: Architect (role: "architect")
**Type**: Real architecture work (not demo)
**Deliverables**:
1. PHASE-A-INTEGRATION-PROTOCOL.md (created above) — integration points, workflows, examples
2. 5 Nexus decisions recorded: integration design choices
3. 1 decision supersedes prior related work (if any exists)

**Constraints**:
- Must not add new features to Nexus (only integration protocol)
- Must respect Nexus locked decisions (AMB-1, stack choices, etc.)
- Must be Governor-appropriate (production-grade, defensible, executable)

**Files in Scope**:
- `projects/nexus-v1/PHASE-A-INTEGRATION-PROTOCOL.md` ← Architect designs this
- New decisions in Nexus DB (created via SDK)

**Out of Scope**:
- Implementation (that's Task 2, Backend)
- Changes to Nexus API or schema
- Product roadmap adjustments

**Success Criteria**:
- Protocol has 5+ integration points clearly defined
- 5 decisions created with status "pending" (awaiting approval)
- Decision edges map dependencies and supersedes
- Governor can review + approve all 5 decisions
- Architect references compiled context from prior decisions (proof that compile was used)

**Timeline**: Day 1 (2026-04-03)

---

## Task 2: Backend → SDK Implementation & Logging

**Objective**: Implement the Governor ↔ Nexus integration in code (SDK wrapper, decision recording, logging)

**Specialist**: Backend Engineer (role: "backend")
**Type**: Real engineering work (not demo)
**Deliverables**:
1. SDK methods: `compileForAgent()`, `createDecision()`, `updateDecisionStatus()`, `listNotifications()`
2. Governor logging: compile calls, decision recordings, notification checks
3. 3 execution decisions recorded: implementation choices
4. 1 decision supersedes an earlier Task 1 decision (e.g., "protocol too complex, simplified")

**Constraints**:
- Use SDK client pattern (already designed in v1)
- Must add 0 new product features
- Must not break existing Nexus tests
- Must log all compile calls for A-1 evidence

**Files in Scope**:
- `nexus/packages/sdk/src/client.ts` ← Add methods
- New file: `nexus/packages/sdk/src/governor-integration.ts` ← Helper for Governor calls
- New file: `nexus/packages/server/src/logging.ts` ← Audit logging for compile/decision calls
- Existing `nexus/packages/*/test/` ← Add integration tests
- New decisions in Nexus DB

**Out of Scope**:
- Governor's dispatcher code (that's phase-dependent)
- Hermes integration (Phase D)
- Performance optimization (that's Phase B)

**Success Criteria**:
- All 4 SDK methods implemented + tested
- Compile calls logged with: timestamp, role, decision count, context size
- Decision recording logged with: timestamp, title, tags, made_by, edges
- 3 execution decisions created and linked via edges
- 1 supersede event created (links to Task 1 decision)
- All tests pass (no regression)
- Backend references compiled context from Task 1 decisions (proof of use)

**Timeline**: Day 1–2 (2026-04-03 to 2026-04-04)

**Dependency**: Task 1 (needs protocol + decisions to implement against)

---

## Task 3: Verify Supersede Event Changes Compiled Context (A-3 Evidence)

**Objective**: Prove that superseding a decision actually changes what future compiles return

**Specialist**: QA Engineer (role: "qa")
**Type**: Real verification work (not demo)
**Deliverables**:
1. Test scenario: compile before supersede, record supersede event, compile after, compare
2. Evidence file: PHASE-A-SUPERSEDE-EVIDENCE.md showing before/after score diffs
3. 1 decision: QA methodology/verification approach for Phase A

**Constraints**:
- Use real decisions (from Task 1 + Task 2)
- Supersede a real decision (not create fake ones)
- Show actual score penalty in compile output

**Files in Scope**:
- `nexus/packages/server/test/phase-a-supersede-scenario.test.ts` ← Test
- `projects/nexus-v1/PHASE-A-SUPERSEDE-EVIDENCE.md` ← Evidence report
- New decision in DB

**Out of Scope**:
- Performance testing (Phase B)
- Load testing
- Architecture validation

**Success Criteria**:
- Test compiles context before supersede: shows decision with full score
- Test supersedes decision + updates status
- Test compiles again for same agent: shows superseded decision with 0.4 penalty applied
- Before/after scores differ as expected
- Evidence file shows concrete numbers

**Timeline**: Day 2 (2026-04-03)

**Dependency**: Task 1 + Task 2 (needs real decisions and working SDK)

---

## Evidence Collection Timeline

| Date | Task | Evidence Type | Maps to |
|------|------|---------------|---------|
| 2026-04-03 | Task 1 (Architect) | 5 decisions + protocol doc | A-2 (≥1 real decision) |
| 2026-04-03 | Task 2 (Backend) | 3 decisions + tests + logs | A-1 (≥2 tasks) + A-2 (more decisions) |
| 2026-04-03 | Task 3 (QA) | Supersede test + evidence | A-3 (supersede changes context) |
| 2026-04-03 | Operator Review | Written judgment | A-4 (did Nexus reduce friction?) |

---

## Real Work Verification

**Why these tasks are "real" (not demo seeded work)**:

1. **Not pre-seeded data**: Decisions are recorded as tasks complete, not loaded from demo script
2. **Not isolated test scenarios**: These integrate into the actual Nexus codebase and decision graph
3. **Specialists make real choices**: Architect designs protocol; Backend implements; QA validates — actual decision points
4. **Generates durable artifacts**: Protocol doc + code changes + test + decision graph — all persist beyond Phase A
5. **Agents use Nexus for their own work**: Each specialist uses compiled context from prior decisions to do their work
6. **Measurable friction points**: If a specialist says "this protocol is awkward" or "decision recording was slow", that feedback is real

---

## Completion Criteria

Phase A is complete when:

1. ✅ Task 1 done: Architect delivers protocol + 5 decisions
2. ✅ Task 2 done: Backend implements + 3 decisions + logs
3. ✅ Task 3 done: QA verifies supersede scenario + evidence
4. ✅ A-1 evidence: Logs show 2+ compile calls, tasks received context
5. ✅ A-2 evidence: 8 decisions exist in DB, linked to Phase A tasks
6. ✅ A-3 evidence: Before/after compile output shows score penalty from supersede
7. ✅ A-4 evidence: Operator written judgment (pass/fail/conditional)
8. ✅ State preserved: STATUS.md, CHECKPOINT.md, DECISIONS.md, SESSION-HANDOFF updated

**Governor will not proceed to Phase B until all 8 are complete.**

---

## Recovery Points

If execution is interrupted:

- **After Task 1**: Restart at Task 2 (protocol is done, ready for implementation)
- **After Task 2**: Restart at Task 3 (code is done, ready for verification)
- **After Task 3**: Restart at evidence collection (work is done, just need to document)

CHECKPOINT.md tracks recovery state for multi-session continuation.

---

**Ready to Dispatch Task 1.**
