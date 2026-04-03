# SKILL-CROSS-AGENT-RECONCILIATION.md

**Purpose**: Reconcile outputs from multiple specialists. Ensure consistency, resolve conflicts, maintain coherence.

**When to Use**: After >1 specialist completes work on same project. Before phase closure. When outputs might conflict.

---

## Reconciliation Gates

### Gate 1: Consistency Check

Do specialist outputs conflict?

- Same problem solved different ways?
- Contradictory decisions made?
- Incompatible code/specs?

**If conflict exists**: Do not proceed. Route back to specialists for reconciliation.

### Gate 2: Completeness Check

Do outputs fit together?

- Architect's spec implemented correctly by Engineer?
- Engineer's code matches QA test expectations?
- All decisions are documented and linked?

**If gaps exist**: Route back to specialists for rework.

### Gate 3: Architecture Alignment

Do outputs respect prior decisions?

- Locked decisions not violated?
- Standards not broken?
- Constraints not ignored?

**If violations exist**: Do not proceed. Escalate to operator.

### Gate 4: Quality Bar

Do outputs meet review standard?

- Code is clean, tested, maintainable?
- Spec is clear, unambiguous, complete?
- Design is defensible?

**If quality is low**: Request rework.

---

## Conflict Resolution

**When Specialist A's work conflicts with Specialist B's**:

1. Name the conflict explicitly
2. Show both perspectives
3. Ask operator to decide (not Governor)
4. Route back to specialists with decision
5. Get rework or accept trade-off

Example:
```
Conflict: Architect designed protocol with Notification checking.
         Backend implementation found it overkill, simplified to direct compile.

Options:
  1. Keep Architect's design, Backend rework
  2. Accept Backend's simplification, mark Architect decision as superseded
  3. Hybrid: compile fresh when notifications exist, compile direct otherwise

Operator decision required.
```

---

## Cross-Specialist Dependencies

**Track dependencies**:
- Architect decisions referenced by Engineer code
- Engineer code tested by QA scenarios
- QA evidence depends on Engineer deliverables

**Verify lineage**:
- Does Engineer's code cite which decisions it implements?
- Does QA test reference which requirements it verifies?
- Are dependencies explicit (not assumed)?

**If lineage broken**: Rework until connected.

---

## Reconciliation Checklist

Before phase completion:
- [ ] No unresolved conflicts between specialists
- [ ] All outputs fit together (no gaps, no overlaps)
- [ ] All standards/constraints respected
- [ ] Quality bar met by all specialists
- [ ] Dependencies documented and explicit
- [ ] Decisions linked (edges, rationale)
- [ ] No orphaned work

---

**END SKILL-CROSS-AGENT-RECONCILIATION**
