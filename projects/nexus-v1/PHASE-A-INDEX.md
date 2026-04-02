# PHASE-A-INDEX.md — Navigation Guide

**Last Updated**: 2026-04-03 01:55 UTC+8
**Phase**: A (Live OpenClaw Integration)
**Status**: PLANNING + TASK 1 COMPLETE, TASK 2 READY FOR DISPATCH

---

## Quick Navigation

### For Operator (Nick)
1. Start here: **PHASE-A-EXECUTION-SUMMARY.md** (overview of what happened)
2. Check evidence: **STATUS.md** (evidence checklist: A-1 through A-4)
3. Next step: **PHASE-A-BACKEND-CONTRACT.md** (Task 2 briefing, ready to dispatch)

### For Backend Engineer (Task 2)
1. Read spec: **PHASE-A-INTEGRATION-PROTOCOL.md** (what to implement)
2. Understand context: **PHASE-A-DECISIONS-CREATED.md** (5 Architect decisions)
3. Get briefing: **PHASE-A-BACKEND-CONTRACT.md** (your task contract)

### For QA Engineer (Task 3)
1. Understand workflow: **PHASE-A-TASK-BREAKDOWN.md** (all 3 tasks)
2. Read Task 1+2 output: **PHASE-A-DECISIONS-CREATED.md** + Task 2 decisions
3. Get briefing: **(to be created after Task 2 complete)**

### For Recovery (Next Session)
1. Check state: **CHECKPOINT.md** (where we are, how to resume)
2. Check progress: **STATUS.md** (evidence collected so far)
3. Read notes: **SESSION-HANDOFF-2026-04-03.md** (what happened today)

---

## Complete File List (15 Files)

### Core Governance Documents (7)

| File | Purpose | Size | Read Time |
|------|---------|------|-----------|
| **PHASE-A-INTEGRATION-PROTOCOL.md** | Protocol specification (5 integration points, workflows) | 12.3 KB | 15 min |
| **PHASE-A-TASK-BREAKDOWN.md** | Task structure + success criteria | 7.4 KB | 10 min |
| **PHASE-A-ARCHITECT-CONTRACT.md** | Task 1 specialist briefing (completed) | 6.7 KB | 8 min |
| **PHASE-A-BACKEND-CONTRACT.md** | Task 2 specialist briefing (ready) | 7.7 KB | 10 min |
| **PHASE-A-PLANNING-COMPLETION-REPORT.md** | Planning phase summary | 10.2 KB | 12 min |
| **PHASE-A-TASK-1-COMPLETION-REPORT.md** | Task 1 summary | 8.3 KB | 10 min |
| **PHASE-A-STATE-PRESERVATION-REPORT.md** | State synchronization verification | 9.6 KB | 12 min |

**Total**: 62.2 KB, 77 minutes read time (all documents)

---

### Context & Decision Records (3)

| File | Purpose | Size | Read Time |
|------|---------|------|-----------|
| **PHASE-A-ARCHITECT-CONTEXT-PACKAGE.md** | Compiled context provided to Architect | 12.9 KB | 12 min |
| **PHASE-A-DECISIONS-CREATED.md** | 5 decisions with rationale + edges | 9.5 KB | 10 min |
| **PHASE-A-EXECUTION-SUMMARY.md** | Execution overview + timeline | 12.0 KB | 10 min |

**Total**: 34.4 KB, 32 minutes read time

---

### State Files (Updated/Created, 5)

| File | Updated By | Purpose |
|------|-----------|---------|
| **STATUS.md** | Governor | Evidence checklist, task status, risk tracking |
| **CHECKPOINT.md** | Governor | Recovery point for multi-session work |
| **MEMORY.md** | Governor | Long-term memory of Phase A |
| **SESSION-HANDOFF-2026-04-03.md** | Governor | Daily session notes + learnings |
| **PHASE-A-INDEX.md** | Governor | This file (navigation guide) |

**Purpose**: Continuity & state preservation across sessions

---

## Reading Paths (By Role)

### Path 1: Operator Review (30 minutes)
1. **PHASE-A-EXECUTION-SUMMARY.md** (10 min) — What happened today
2. **STATUS.md** (5 min) — Evidence progress (A-1 through A-4)
3. **PHASE-A-BACKEND-CONTRACT.md** (15 min) — Task 2 briefing + decision on dispatch

---

### Path 2: Backend Engineer Starting Task 2 (45 minutes)
1. **PHASE-A-INTEGRATION-PROTOCOL.md** (15 min) — Protocol specification
2. **PHASE-A-DECISIONS-CREATED.md** (10 min) — Architect's 5 decisions (context)
3. **PHASE-A-BACKEND-CONTRACT.md** (10 min) — Your task contract
4. **PHASE-A-ARCHITECT-CONTEXT-PACKAGE.md** (10 min) — Background context (optional)

---

### Path 3: QA Engineer Starting Task 3 (45 minutes)
*(After Task 2 is complete)*
1. **PHASE-A-TASK-BREAKDOWN.md** (10 min) — Overall structure
2. **PHASE-A-DECISIONS-CREATED.md** (5 min) — Architect's 5 decisions
3. **[Task 2 decisions file]** (5 min) — Backend's 3 decisions
4. **PHASE-A-INTEGRATION-PROTOCOL.md** (15 min) — Protocol (you're verifying it works)
5. **[Your task 3 contract]** (10 min) — Your task briefing *(to be created)*

---

### Path 4: Operator Requesting Evidence (20 minutes)
1. **STATUS.md** (5 min) — Checklist status
2. **PHASE-A-DECISIONS-CREATED.md** (10 min) — Actual decisions created
3. **[Task 2 decisions file]** (5 min) — More decisions *(to be created)*

---

### Path 5: Next Session Recovery (10 minutes)
1. **CHECKPOINT.md** (3 min) — Current state + recovery point
2. **STATUS.md** (3 min) — Evidence progress
3. **SESSION-HANDOFF-2026-04-03.md** (4 min) — What happened before

---

## Document Relationships (Dependency Graph)

```
PHASE-A-INTEGRATION-PROTOCOL.md (specification)
  ↓
PHASE-A-DECISIONS-CREATED.md (5 architect decisions)
  ↓ (input to)
PHASE-A-BACKEND-CONTRACT.md (Task 2 briefing)
  ↓ (Task 2 executes against)
[Task 2 code + decisions] (not yet created)
  ↓ (input to)
[Task 3 briefing] (to be created)
  ↓ (Task 3 executes and verifies)
[Evidence: A-1, A-2, A-3, A-4] (collected)

All feeding into:
  STATUS.md (evidence tracking)
  CHECKPOINT.md (recovery point)
  MEMORY.md (long-term memory)
  SESSION-HANDOFF (daily notes)
```

---

## Evidence Rubric Status (A-1 through A-4)

### A-1: ≥2 Specialist Tasks with Compiled Context
- **Target**: 2
- **Current**: 1/2 (Architect done)
- **Path to completion**: Task 2 (Backend) receives Task 1 output as compiled context
- **Evidence file**: Will be in STATUS.md after Task 2 complete

### A-2: ≥1 Real Decision from Live Work
- **Target**: 8+ (target, minimum 1)
- **Current**: 5/8 (Architect created 5)
- **Path to completion**: Task 2 creates 3 more, Task 3 creates 1 (the verification methodology itself is a decision)
- **Evidence file**: PHASE-A-DECISIONS-CREATED.md (5 decisions documented)

### A-3: ≥1 Supersede Event Changes Compiled Context
- **Target**: 1
- **Current**: 0/1 (pending)
- **Path to completion**: Task 2 creates 1 supersede; Task 3 verifies it changes compiled context
- **Evidence file**: Will be PHASE-A-SUPERSEDE-EVIDENCE.md (to be created by Task 3)

### A-4: Operator Judgment on Friction Reduction
- **Target**: 1 statement
- **Current**: 0/1 (pending)
- **Path to completion**: After all tasks, operator writes 1-2 sentences: "Did Nexus reduce friction?"
- **Evidence file**: Will be in final completion report

---

## Key Decision Artifacts

### 5 Architect Decisions (Task 1, Complete)
- DECISION-PHASE-A-001: Compile before dispatch
- DECISION-PHASE-A-002: Record at phase boundaries
- DECISION-PHASE-A-003: Self-serve context refresh
- DECISION-PHASE-A-004: Check notifications before dispatch
- DECISION-PHASE-A-005: Protocol + workflows

All documented in: **PHASE-A-DECISIONS-CREATED.md**

### Backend Decisions (Task 2, Pending)
- DECISION-PHASE-A-006: SDK compileForAgent() method
- DECISION-PHASE-A-007: Audit logging all compile calls
- DECISION-PHASE-A-008: Notification check prevents stale context
- DECISION-PHASE-A-009 (supersede): Simplified protocol (Backend Decision 6 supersedes Architect Decision 4)

Will be documented in: **[Task 2 decisions file]** (to be created)

---

## Timeline & Milestones

```
2026-04-03 01:15  → Phase A Planning begins
2026-04-03 01:25  → Planning complete, approval requested
2026-04-03 01:19  → ✅ OPERATOR APPROVAL RECEIVED
2026-04-03 01:40  → Task 1 (Architect) dispatch
2026-04-03 01:50  → ✅ TASK 1 COMPLETE (5 decisions created)
2026-04-03 01:55  → State preservation complete
2026-04-03 XX:XX  → (Pending) Task 2 dispatch approval
2026-04-04 XX:XX  → (Target) Task 2 complete
2026-04-04 XX:XX  → (Target) Task 3 complete
2026-04-04 XX:XX  → (Target) A-4 operator judgment
```

---

## How to Use This Index

**For quick lookup**: Use the table of contents above (organized by role)

**For workflow continuation**: Start with your role's path (operator / engineer)

**For state recovery**: Read "Path 5: Next Session Recovery"

**For evidence tracking**: Monitor "Evidence Rubric Status"

**For decision history**: Scroll to "Key Decision Artifacts"

---

## Files in `projects/nexus-v1/` (All Phase A)

```
projects/nexus-v1/
├── PHASE-A-INTEGRATION-PROTOCOL.md          (specification)
├── PHASE-A-TASK-BREAKDOWN.md                (task structure)
├── PHASE-A-ARCHITECT-CONTRACT.md            (Task 1 briefing)
├── PHASE-A-BACKEND-CONTRACT.md              (Task 2 briefing, ready)
├── PHASE-A-ARCHITECT-CONTEXT-PACKAGE.md     (compiled context)
├── PHASE-A-DECISIONS-CREATED.md             (5 decisions)
├── PHASE-A-PLANNING-COMPLETION-REPORT.md    (planning summary)
├── PHASE-A-TASK-1-COMPLETION-REPORT.md      (Task 1 summary)
├── PHASE-A-STATE-PRESERVATION-REPORT.md     (state sync)
├── PHASE-A-EXECUTION-SUMMARY.md             (overview)
├── PHASE-A-INDEX.md                         (this file)
├── STATUS.md                                (evidence tracking)
├── CHECKPOINT.md                            (recovery point)
└── [other pre-Phase-A files]
```

---

## Next Session Checklist

- [ ] Read CHECKPOINT.md (recovery state)
- [ ] Check operator chat for Task 2 approval
- [ ] If approved: Dispatch Task 2 using PHASE-A-BACKEND-CONTRACT.md
- [ ] Monitor Task 2 progress
- [ ] Update STATUS.md as evidence is collected

---

**PHASE A — Planning & Task 1 Complete**

**This index is your navigation guide. Start with the path that matches your role.**

---

**Updated**: 2026-04-03 01:55 UTC+8
**Governor**
