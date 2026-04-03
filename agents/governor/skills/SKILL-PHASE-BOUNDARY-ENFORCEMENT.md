# SKILL-PHASE-BOUNDARY-ENFORCEMENT.md

**Purpose**: Prevent phase leakage. Enforce sequential phases, explicit approval, hard exits.

**When to Use**: After any phase completes. Before starting next phase. When tempted to auto-progress.

---

## The Rule

**No phase starts without explicit operator approval for that phase.**

Phase completion ≠ next phase start. These are separate decisions.

---

## Enforcement Protocol

### Step 1: Confirm Phase Complete

Is the exit criteria for this phase met?

- [ ] All deliverables produced
- [ ] All tests passing (if applicable)
- [ ] All evidence collected
- [ ] No blockers remaining (or blocker is documented + escalated)
- [ ] Lessons learned documented

If not: phase is not complete. Do not proceed.

### Step 2: Report Phase Completion

To operator, report:
```
Phase [N] Complete

Deliverables: [list]
Evidence: [what was proven]
Blocker (if any): [exact]
Next Phase: [describe Phase N+1]

Awaiting approval for Phase N+1.
```

### Step 3: Wait for Approval

Do NOT start Phase N+1 until operator explicitly approves.

Do NOT auto-progress.

Do NOT assume approval.

### Step 4: Receive Approval

Operator says: "Approved. Execute Phase N+1."

Or: "Phase N+1 revised as follows: [changes]"

Or: "Defer Phase N+1. Address [blocker] first."

Only then proceed.

### Step 5: Execute Phase N+1

With explicit constraints from approval.

---

## Example: Phase Boundary (Phase A)

```
[Phase A Live Loop completes or gets blocked]

Governor reports:
"Phase A Status

Design: COMPLETE (PHASE-A-INTEGRATION-PROTOCOL.md)
Live Execution: BLOCKED on PostgreSQL unavailable

Blocker: Container environment has no DB service access

Next Phase: Phase B (SDK Implementation)
Dependency: Phase A live execution (blocked)

Cannot proceed to Phase B until:
- Option 1: PostgreSQL made available
- Option 2: Defer Phase A, start Phase B design independently
- Option 3: Different environment provided

Awaiting operator decision."

Operator approves ONE of:
- "Provide PostgreSQL within container" (resolves blocker)
- "Phase B: Start implementation of protocol anyway" (accepts design-phase-only progress)
- "Defer Phase A. Proceed to [Phase X]" (skips blocked work)

Governor proceeds ONLY with explicit approval.
```

---

## Hard Boundaries

**Cannot cross** unless:
- [ ] Current phase exit criteria met
- [ ] Operator explicitly approves next phase
- [ ] Blocker resolution is explicit (if any)

**Red flags** (do not proceed):
- ❌ "Phase complete, so Phase N+1 begins"
- ❌ "Design is done, so implementation is ready"
- ❌ "Blocked, but proceeding with next phase anyway"
- ❌ "Soft complete; moving forward"

**Always require explicit approval**.

---

**END SKILL-PHASE-BOUNDARY-ENFORCEMENT**
