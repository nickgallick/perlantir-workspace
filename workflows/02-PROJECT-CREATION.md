# WORKFLOW: 02-PROJECT-CREATION

How approved intake is formalized as an executable project with structure, ownership, and clear initial planning.

---

## Purpose

Convert an approved intake into a structured project that can be executed. Establish project artifacts (folder, files, ownership), initial scope, and planning assumptions. Make the project real and trackable.

---

## Trigger

- Operator approves an Intake Summary from workflow 01

---

## Inputs Required

1. **Approved Intake Summary** — From workflow 01-INTAKE-TRIAGE
2. **Project Name/ID** — Operator or Governor chooses a short, meaningful name
3. **Project Owner** — Governor designates who leads the project (usually Governor itself, or can delegate to a specialist lead)

---

## Responsible Owner

**Governor**

Governor creates the project structure and initial planning. Governor may involve specialists for input (Architect, Product, etc.) but Governor owns the process.

---

## Step-by-Step Process

### Step 1: Project Folder Creation

Governor creates a new project folder:

**Path:** `workspace/projects/[PROJECT-NAME]/`

Where `[PROJECT-NAME]` is a short, descriptive name (e.g., `checkout-flow-redesign`, `auth-system`, `analytics-engine`).

**Contents:** (initially empty, will be populated by governance files below)

### Step 2: Initial Governance Files

Governor copies project template files and populates them with project specifics:

**From:** `workspace/projects/.template/`
**To:** `workspace/projects/[PROJECT-NAME]/`

Files created:
- `BRIEF.md` — High-level project brief (based on Intake Summary)
- `PLAN.md` — Initial phasing and sequencing (high-level)
- `STATUS.md` — Current status (initially "just created")
- `DECISIONS.md` — Decision log (initially empty, will grow)

**BRIEF.md Contents:**

```
## Project Brief

**Project Name:** [from intake]
**Owner:** [Governor, or delegated lead]
**Created:** [date]

**Objective:** [from intake]

**Success Criteria:** [from intake]

**Scope:**
- In scope: [from intake]
- Out of scope: [from intake]

**Timeline:** [from intake estimate]

**Stakeholders:** [from intake]

**Dependencies:** [from intake]

**Key Risks:** [from intake]

**Next Steps:** [move to scoping and planning]
```

**PLAN.md Contents (High-Level):**

```
## Project Plan

**Project Name:** [name]

**Phase 1: [Name]**
- Objective: [what does phase 1 accomplish?]
- Owner: [Governor will assign]
- Duration: [estimate]
- Deliverables: [high-level, will detail later]

**Phase 2: [Name]** (if applicable)
- Objective: [tbd, will define after Phase 1 planning]
- Owner: [tbd]

**Key Dependencies:** [what must happen in order?]

**Risks and Mitigation:** [what could go wrong?]

**Success Criteria:** [from brief]
```

**STATUS.md Contents (Initial):**

```
## Project Status

**Project:** [name]
**Status:** 🟡 Planning (just created)
**Phase:** Pre-execution (scoping and planning phase)
**Last Updated:** [date]

**Recent Activity:** Project created from approved intake.

**Current Phase Objectives:** Define detailed execution plan.

**Blockers:** None yet.

**Next Steps:**
1. Architect reviews scope for technical feasibility
2. Governor creates detailed phase plans
3. Operator approves phase plan
4. Execution begins
```

**DECISIONS.md:** Initially empty. Example structure shown:

```
## Project Decisions Log

**Project:** [name]

### Decision: [Placeholder]
**Date:** [date]
**Owner:** [who decided]
**Context:** [tbd]
**Decision:** [tbd]
**Rationale:** [tbd]
```

### Step 3: Specialist Review Gate (Quick)

Governor may request quick input from key specialists (15–30 minute soundings, not full reviews):

**For Architect:** "Is the scope architecturally reasonable? Any major blockers?"

**For Product:** "Does this solve the right problem? Does it make sense?"

Governor documents specialist input in PLAN.md or BRIEF.md as "initial feedback" (not commitments, just signals).

### Step 4: Initial Phase Definition

Governor and operator review the initial high-level plan:

**Does the phasing make sense?**
- Is Phase 1 small enough to be executable?
- Are dependencies clear?
- Are phases realistic in scope and timeline?

If needed, Governor adjusts phasing.

### Step 5: Operator Approval of Project

Operator reviews:
- BRIEF.md (is the brief clear and correct?)
- PLAN.md (does the phasing make sense?)
- Project ownership and structure

Operator decides:

- **Approve**: "This project is ready for detailed planning."
- **Modify**: "Change X in the brief/plan, then approved."
- **Reject**: "This project is cancelled." (rare, but possible if conditions changed)

No detailed scoping/planning proceeds without operator approval of project.

### Step 6: Project Documentation

Governor documents:

- Project is created and approved
- BRIEF.md, PLAN.md, STATUS.md, DECISIONS.md are in place
- Project is ready for workflow 03 (scoping and planning)

---

## Decision Points

**Phasing clear?**
- If yes → Step 3 specialist input
- If no → Refine phases in PLAN.md with operator

**Operator approves project?**
- If yes → Proceed to workflow 03-SCOPING-PLANNING
- If no → Modify or close project

**Timeline realistic?**
- If yes → Continue
- If no → Adjust estimate, consult specialist, or escalate

---

## Outputs / Deliverables

1. **Project Folder** — `workspace/projects/[PROJECT-NAME]/`
2. **BRIEF.md** — Project brief (high-level summary)
3. **PLAN.md** — Initial phasing and plan (high-level)
4. **STATUS.md** — Initial status document
5. **DECISIONS.md** — Decision log (template ready)
6. **Operator Approval** — Written approval to proceed to detailed planning

---

## Failure Modes

**Phasing is Wrong:** Initial phases don't make sense after review.
- **Response:** Governor revises phases with operator and specialist input. Re-plan.

**Specialist Input Reveals Blocker:** Architect or Product flags a fundamental issue.
- **Response:** Escalate to operator. Decide: modify project scope or defer project.

**Timeline is Unrealistic:** Governor or specialist says the estimate is too optimistic.
- **Response:** Revise estimate upward. Adjust project schedule. Re-approve if needed.

**Scope is Too Large:** Phase 1 is actually too much work.
- **Response:** Split Phase 1 into 1a and 1b. Reduce Phase 1 scope. Re-plan.

---

## Escalation Path

**To Operator:**
- Timeline or scope concerns
- Feasibility questions that can't be quickly resolved
- Conflicts with other projects

**To Architect:**
- Technical feasibility concerns
- Architecture implications

**To Product:**
- Strategic alignment questions
- Customer priority validation

---

## Done Criteria

Project creation is **done** when:

- [ ] Project folder exists (`workspace/projects/[PROJECT-NAME]/`)
- [ ] BRIEF.md is complete and clear
- [ ] PLAN.md shows initial high-level phasing
- [ ] STATUS.md is created (initial status)
- [ ] DECISIONS.md is ready (template in place)
- [ ] Specialist feedback is documented (if gathered)
- [ ] Operator has approved the project
- [ ] Project is ready for detailed planning (workflow 03)

Project creation is **not done** until all the above are true.

---

## Handoff to Next Workflow

When operator approves:

Governor triggers **03-SCOPING-PLANNING** with the project folder and BRIEF.md/PLAN.md as inputs.

Governor does not auto-execute into next workflow. Governor explicitly starts detailed planning after project approval.
