# PLAYBOOK-PHASE-A-LIVE-VALUE-VALIDATION.md

**Purpose**: Execute Phase A from live loop to evidence collection.

**When to Use**: When environment is ready and you're starting Phase A actual validation.

---

## Prerequisites

- [ ] PLAYBOOK-FIRST-LIVE-LOOP.md executed successfully
- [ ] Environment confirmed ready
- [ ] All Nexus endpoints responsive
- [ ] PostgreSQL accessible

---

## Phase A Execution

### Stage 1: Protocol Design (Complete)

- [ ] PHASE-A-INTEGRATION-PROTOCOL.md exists
- [ ] Describes 5 integration points
- [ ] No blockers (design doesn't require environment)

**Skip to Stage 2**

---

### Stage 2: Task 1 (Architect)

- [ ] Dispatch Architect with contract
- [ ] Architect produces: protocol refinement + 5 decisions
- [ ] 5 decisions recorded in Nexus (createDecision calls)
- [ ] Proof: decision IDs logged, decisions queryable

**Evidence A-2 collected** (at least 1 decision persisted)

---

### Stage 3: Task 2 (Backend)

- [ ] Dispatch Backend with Architect protocol + decisions
- [ ] Backend produces: SDK methods + logging + tests
- [ ] All tests pass
- [ ] 3 new decisions recorded
- [ ] 1 decision supersedes Architect decision (creates A-3 edge)

**Evidence A-1 collected** (Backend received real compile context from Stage 2)
**Evidence A-2 expanded** (4 more decisions: 5 + 3 = 8)

---

### Stage 4: Task 3 (QA)

- [ ] Dispatch QA with Backend code + all decisions + protocol
- [ ] QA creates test: compile before supersede → supersede → compile after
- [ ] Log before/after compile outputs
- [ ] Verify score penalty (S1 → S2, S2 = S1 × 0.4)

**Evidence A-3 collected** (supersede changes compile context, before/after diffs logged)

---

### Stage 5: Operator Judgment

- [ ] Operator reviews all evidence (A-1, A-2, A-3)
- [ ] Operator writes: "Nexus reduced friction" or "did not reduce friction" or "conditional on X"
- [ ] Statement recorded in STATUS.md

**Evidence A-4 collected** (operator judgment)

---

## If Blocked at Any Stage

Report blocker:
- Exact layer where it failed
- Exact error
- Root cause
- Options for resolution

Do NOT proceed to next stage.
Do NOT work around with design.
Stop and escalate.

---

## Evidence Logging (Throughout)

After each stage, log:

```
Stage N Complete

Deliverables:
  - [list]

Evidence Collected:
  - A-1: [status]
  - A-2: [number of decisions]
  - A-3: [status]

Decisions Recorded in System:
  - Decision ID: [title] (maker, status, tags)
  - [...]

Blocker (if any):
  - [exact blocker]
  - [root cause]
  - [resolution needed]
```

---

## Phase A Complete When

- [ ] A-1: 2/2 specialist tasks with real compiled context
- [ ] A-2: All decisions persisted in Nexus
- [ ] A-3: Supersede event verified (score changes observable)
- [ ] A-4: Operator judgment recorded

---

**END PLAYBOOK-PHASE-A-LIVE-VALUE-VALIDATION**
