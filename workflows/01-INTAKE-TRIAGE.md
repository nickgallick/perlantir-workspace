# WORKFLOW: 01-INTAKE-TRIAGE

How work enters the enterprise system and is validated for execution.

---

## Purpose

Ensure all work entering the enterprise system is clearly defined, feasible, and aligned with governance. Separate ideas from executable projects. Prevent vague work from proceeding.

---

## Trigger

- Operator submits a request (via message, chat, ticket, email)
- Team member proposes a project
- Customer request is escalated
- Bug report reaches severity threshold
- Strategic opportunity is identified

---

## Inputs Required

1. **Work Request** — What is being requested? (may be vague initially)
2. **Context** — Why is this needed? What problem does it solve?
3. **Priority Signal** — How urgent is this? (if applicable)
4. **Any Existing Specifications** — If the requester has notes or ideas

---

## Responsible Owner

**Governor**

Governor receives work, clarifies it, and decides whether to proceed or reject.

---

## Step-by-Step Process

### Step 1: Intake & Initial Clarification

Governor reads the request and asks clarifying questions:

- **What is the objective?** (not "build a feature," but "solve X for customer Y")
- **Why is this needed?** (customer problem? business opportunity? technical debt?)
- **What does success look like?** (how will we know it worked?)
- **Who cares?** (which customers? which internal teams?)
- **When is it needed?** (rough timeline)
- **Any constraints?** (budget? architecture limits? dependencies?)

Governor documents all answers. If requester cannot answer clearly, work is not yet ready for intake.

### Step 2: Feasibility Assessment

Governor (with input from relevant specialists if needed):

- **Is this technically feasible?** (escalate to Architect if uncertain)
- **Does this align with product strategy?** (escalate to Product if alignment unclear)
- **Is the scope bounded?** (can we define "done"?)
- **Are there obvious blockers?** (dependencies, missing pieces, conflicts?)

Governor may do quick soundings with specialists (5-minute checks, not full reviews).

### Step 3: Triage Decision

Governor decides:

**Accept**: Work is clear, feasible, and worth pursuing. Proceed to Step 4.

**Reject**: Work is not ready, not feasible, or not aligned. Governor communicates:
- Why it's being rejected
- What would need to change for it to be acceptable
- Whether it should be re-submitted later

Rejected work is not escalated further.

**Defer**: Work is valid but not now. Governor:
- Documents the request clearly
- Explains why it's deferred (blocked by other work, waiting for condition, lower priority)
- Schedules a re-review date (if applicable)

Deferred work goes into a backlog, not into active projects.

### Step 4: Intake Summary Creation

For accepted work, Governor creates an **Intake Summary** document:

**Template:**

```
## Intake Summary

**Date:** [date]
**Requester:** [who submitted this]
**Objective:** [one sentence]

### Problem Statement
[What problem are we solving? Why does it matter?]

### Success Criteria
[How will we know this succeeded? 3–5 measurable criteria]

### Scope Boundaries
- In scope: [what's included]
- Out of scope: [what's explicitly not included]

### Timeline
[Rough estimate: how long is this expected to take?]

### Dependencies
[What must happen first? What could block this?]

### Stakeholders
[Who cares about this? Who will use it?]

### Constraints
[Budget, architecture, timeline, technical limits, compatibility requirements]

### Recommended Approach
[High-level strategy: how should we tackle this?]

### Unknowns/Risks
[What are we least confident about?]

### Next Step
[Approval and project creation]
```

Governor creates this document in the workspace and forwards to operator for review.

### Step 5: Operator Approval

Governor presents Intake Summary to operator.

Operator reviews and decides:

- **Approve**: "Let's do this. Create a project."
- **Modify**: "Change X, then we can proceed." Governor revises Intake Summary.
- **Reject**: "Not now" or "Never." Work is closed.

No project is created without operator approval of the Intake Summary.

---

## Decision Points

**Feasible?**
- If yes → Step 2 assessment
- If no → Reject work, explain why, suggest path forward

**Clear objective?**
- If yes → Step 2 assessment
- If no → Return to Step 1, request clarification

**Aligned with strategy?**
- If yes → Step 3 triage decision
- If no → Escalate to operator for strategic decision

**Operator approves?**
- If yes → Proceed to 02-PROJECT-CREATION
- If no → Close intake, document decision

---

## Outputs / Deliverables

1. **Intake Summary Document** — Stored in workspace (path TBD by Governor)
2. **Triage Decision** — Accept / Reject / Defer, documented
3. **If Accepted:** Project creation is triggered (workflow 02)

---

## Failure Modes

**Vague Request:** Requester cannot articulate the objective clearly.
- **Response:** Return to Step 1. Explain what's needed for clarity. Offer to help draft the objective.

**Infeasible Work:** Technical assessment shows this can't be built.
- **Response:** Reject. Explain the blocker. Suggest alternatives.

**Misaligned with Strategy:** Work conflicts with other projects or strategic priorities.
- **Response:** Escalate to operator. Document the conflict. Wait for strategic decision.

**Scope Creep in Intake:** Request keeps expanding during clarification.
- **Response:** Define Phase 1 (what must ship) vs Phase 2 (what comes later). Re-scope and continue.

**Operator Cannot Decide:** Operator doesn't have enough information to approve.
- **Response:** Governor gathers more information, consults specialists, or escalates.

---

## Escalation Path

**To Operator:**
- Strategic conflicts (this work vs other priorities)
- Major resource requirements
- Timeline misalignment (what operator wants vs what's feasible)
- High-risk decisions

**To Architect:**
- Technical feasibility questions
- Architecture implications

**To Product:**
- Strategic alignment with product roadmap
- Customer priority questions

---

## Done Criteria

Intake is **done** when:

- [ ] Objective is crystal clear (no ambiguity)
- [ ] Success criteria are measurable (not vague)
- [ ] Scope is bounded (know what's in and out)
- [ ] Feasibility is assessed (is this possible?)
- [ ] Stakeholders are identified
- [ ] Dependencies are noted
- [ ] Timeline estimate exists
- [ ] Operator has approved (explicit "yes")
- [ ] Intake Summary is documented

Intake is **not done** until all the above are true.

---

## Handoff to Next Workflow

When operator approves:

Governor triggers **02-PROJECT-CREATION** with the Intake Summary as input.

No delays, no auto-execution into next workflow: Governor explicitly starts the next workflow after intake approval.
