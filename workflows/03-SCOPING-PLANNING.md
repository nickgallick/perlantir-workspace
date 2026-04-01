# WORKFLOW: 03-SCOPING-PLANNING

How Governor breaks project scope into detailed execution phases with specialist inputs and produces a complete execution plan.

---

## Purpose

Transform high-level project plan into detailed, sequenced phases with clear objectives, dependencies, risks, and specialist roles. Enable specialists to understand exactly what they're building.

---

## Trigger

- Operator approves a project from workflow 02

---

## Inputs Required

1. **Approved Project Folder** — From workflow 02
2. **BRIEF.md and PLAN.md** — High-level project definition
3. **Specialist Availability** — Which specialists are needed? (Architect, Product, Backend, etc.)

---

## Responsible Owner

**Governor**

Governor leads scoping and planning. Governor actively involves specialists (Architect, Product, Design, Backend, etc.) as required for specific phases.

---

## Step-by-Step Process

### Step 1: Specialist Assembly

Governor identifies which specialists are needed for Phase 1:

- **Architect** — If new services, data models, or scaling required
- **Product** — If product features or flows are involved
- **Design** — If UI/UX is involved
- **Backend** — If services or APIs are involved
- **Frontend** — If UI is involved
- **DevOps** — If deployment or infrastructure is involved
- **Security** — For all projects (at least a threat review)
- **QA** — To plan testing strategy
- **Others** — As needed

Governor notifies specialists: "We're planning Phase 1 of [project]. I need your input on [specific aspects]."

### Step 2: Phase 1 Detailed Scoping

Governor (with specialists) defines Phase 1 in detail:

**Objective:** What exactly does Phase 1 accomplish? (one or two sentences)

**Scope:**
- Features included in Phase 1
- Features explicitly deferred to Phase 2+
- Non-functional requirements (performance, scale, compliance)

**Specialist Roles:** For each specialist:
- What are they doing in this phase?
- What are their deliverables?
- Any constraints or dependencies?

**Dependencies:** What must be true before Phase 1 starts?
- Do we need other work done first?
- Are there external dependencies (APIs, integrations)?
- Do we need decisions from operator or product?

**Timeline:** Rough estimate (days/weeks, not hours)

**Risks:** What could derail Phase 1?
- Technical unknowns
- Resource constraints
- Dependencies on others
- Skills gaps

**Success Criteria:** How do we know Phase 1 is done?
- Acceptance criteria that are measurable

### Step 3: Architecture and Design Review

Governor requests specialist reviews:

**Architect Review:** "Can we build this? Are there architectural issues?"

**Design Review (if UI):** "Can we design this intuitively? Are the flows clear?"

**Product Review (if needed):** "Does this solve the problem? Does scope make sense?"

Governor documents specialist feedback in PLAN.md.

If specialist flags a blocker (e.g., "this architecture won't scale"), Governor and specialist escalate to operator for decision.

### Step 4: Phasing for Future Phases

Governor outlines Phase 2, Phase 3, etc. (at high level):

For each phase:
- **Objective:** What is this phase for?
- **High-Level Scope:** What does it include?
- **Entry Criteria:** What must be true to start this phase?
- **Exit Criteria:** What must be true to complete it?
- **Rough Timeline:** Order-of-magnitude estimate

Later phases are high-level. Governor will detail them when Phase 1 is nearing completion.

### Step 5: Complete Execution Plan Document

Governor updates PLAN.md with full detail:

**Template:**

```
## Execution Plan

**Project:** [name]
**Created:** [date]

### Phase 1: [Name]

**Objective:** [one sentence]

**In Scope:** [features and work items]
**Out of Scope:** [explicitly what's NOT included]

**Specialist Roles:**

- **Architect:** [role and deliverables]
- **Product:** [role and deliverables]
- **Design:** [role and deliverables]
- **Backend:** [role and deliverables]
- **Frontend:** [role and deliverables]
- **DevOps:** [role and deliverables]
- **Security:** [role and deliverables]
- **QA:** [role and deliverables]

**Dependencies:**
- [What must be true to start?]
- [What are we waiting for?]

**Timeline:**
- Start: [target date]
- Key checkpoint: [if applicable]
- Complete: [target date]

**Risks & Mitigation:**
- Risk: [what could go wrong?]
  - Mitigation: [how do we reduce it?]

**Success Criteria:**
- [Measurable criteria for Phase 1 completion]

**Review Gates:**
- Gate 1 (mid-phase): [What do we verify? Who reviews?]
- Gate 2 (end of phase): [What must be true to progress?]

### Phase 2: [Name]

**Objective:** [tbd, high-level for now]

**Entry Criteria:** Phase 1 complete + operator approval

**Rough Timeline:** [order of magnitude]

**Rough Specialist Roles:** [will detail when Phase 1 nears completion]

### Phase 3+: [Continue as needed, high-level]
```

### Step 6: Operator Approval

Governor presents the execution plan to operator:

**Does Phase 1 scope make sense?** (is it achievable?)

**Are dependencies clear?** (do we know what we're waiting for?)

**Is timeline realistic?** (can specialists deliver in this time?)

**Approve to execute?** (give the green light for Phase 1?)

Operator decides:

- **Approve**: "Execute Phase 1 as planned."
- **Modify**: "Change X in the plan, then we're good."
- **Reject**: "This isn't the right approach. Rethink Phase 1."

---

## Decision Points

**Scope too large for one phase?**
- If yes → Split into multiple phases
- If no → Continue to specialist review

**Specialist has blockers?**
- If yes → Escalate to operator, modify scope, or defer phase
- If no → Continue to detailed planning

**Timeline realistic?**
- If yes → Continue
- If no → Expand timeline or reduce scope

**Operator approves plan?**
- If yes → Proceed to workflow 04-SPECIALIST-HANDOFF
- If no → Revise plan and re-submit

---

## Outputs / Deliverables

1. **Updated PLAN.md** — Full execution plan with detailed Phase 1 and outlined later phases
2. **Specialist Feedback Notes** — Documented in PLAN.md or separate notes
3. **Risk Identification** — Documented in PLAN.md
4. **Operator Approval** — Written approval to proceed to Phase 1 execution

---

## Failure Modes

**Scope Creep:** Phase 1 keeps expanding during planning.
- **Response:** Lock the scope. Document extras as Phase 2. Re-plan Phase 1 with reduced scope.

**Unknown Unknowns:** Specialist discovers a fundamental issue mid-planning.
- **Response:** Escalate to operator. Decide: modify scope, delay phase, or find alternative approach.

**Timeline Unrealistic:** After specialist input, Phase 1 is bigger than initially estimated.
- **Response:** Extend timeline or reduce scope. Governor and operator decide priority.

**Specialist Unavailable:** Key specialist needed for Phase 1 is not available.
- **Response:** Governor and operator decide: delay phase until specialist available, or work around absence.

**Phasing Doesn't Make Sense:** Phases are not logically sequenced.
- **Response:** Governor restructures phases for logical execution order. Re-plan.

---

## Escalation Path

**To Operator:**
- Timeline or scope concerns
- Specialist unavailability
- Blocker discovered (phase is infeasible)
- Conflict between phases or dependencies

**To Architect:**
- Technical feasibility questions
- Architecture decisions needed

**To Product:**
- Product feature prioritization
- Scope alignment with customer needs

---

## Done Criteria

Scoping & planning is **done** when:

- [ ] Phase 1 objective is crystal clear
- [ ] Phase 1 scope is bounded (in and out)
- [ ] All specialist roles are defined
- [ ] Dependencies are identified
- [ ] Timeline is realistic (specialists confirm)
- [ ] Risks are identified and mitigations are planned
- [ ] Success criteria are measurable
- [ ] Future phases are outlined (high-level)
- [ ] Operator has approved the execution plan
- [ ] Specialists have been notified of their Phase 1 roles

Scoping & planning is **not done** until all above are true.

---

## Handoff to Next Workflow

When operator approves:

Governor triggers **04-SPECIALIST-HANDOFF** with the execution plan as input.

Governor does not auto-execute. Governor explicitly starts specialist handoff when plan is approved.
