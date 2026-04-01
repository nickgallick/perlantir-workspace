# WORKFLOW: 04-SPECIALIST-HANDOFF

How Governor briefs specialists with exact contracts, ensuring clarity before execution begins.

---

## Purpose

Ensure every specialist understands exactly what they're building, why, what's in/out of scope, what success looks like, and when they're done. Prevent misalignment and scope creep before it starts.

---

## Trigger

- Operator approves execution plan from workflow 03

---

## Inputs Required

1. **Approved Execution Plan** — From workflow 03 (PLAN.md, BRIEF.md)
2. **Specialist Roles Defined** — From workflow 03 (which specialists are involved?)
3. **Phase 1 Objectives and Scope** — Clearly stated and approved

---

## Responsible Owner

**Governor**

Governor writes specialist handoff documents and briefs each specialist individually.

---

## Step-by-Step Process

### Step 1: Specialist Contract Creation

For each specialist involved in Phase 1, Governor writes a **Specialist Handoff Document**.

**Template:**

```
## Specialist Handoff: [Project Name] — [Specialist Role]

**Handoff Date:** [date]
**Project:** [project name and link]
**Phase:** Phase 1 (of [N])
**Specialist:** [name/role]
**Governor:** [Governor]

### Objective

[One sentence: What problem are you solving? Why does it matter?]

### Constraints

[What existing decisions, architecture, standards must you respect?]

### Deliverables

[What artifacts are we expecting from you?]
- Deliverable 1: [description]
- Deliverable 2: [description]
- [etc.]

### Files in Scope

[What directories/files can you create or modify?]
- `workspace/...` [exact paths]
- [etc.]

[If only certain files: "You may create files under workspace/agents/backend/. Do not modify workspace/enterprise/ or workflow files."]

### Out of Scope

[What is explicitly NOT your job?]
- [e.g., "You do not own visual design; that's Design's job"]
- [e.g., "You do not modify the database schema; coordinate with Architect"]

### Success Criteria

[How do we evaluate your work?]
- [Criterion 1]
- [Criterion 2]
- [etc.]

### Review Standard

[What are we looking for in your work?]
- [e.g., "Code is clean, tested, and documented"]
- [e.g., "Design is premium, not generic"]
- [e.g., "Architecture is clear and scalable"]

### Acceptance Criteria

[What must be true for us to accept your work?]
- [Criterion 1]
- [Criterion 2]

### Timeline

- Start: [date]
- Checkpoint (if applicable): [date and what's checked]
- Complete: [date]
- Buffer for rework: [if applicable]

### Key Questions for Clarification

[If anything is unclear, specialist should ask Governor now]
- [Governor may have provided space for specialist input]

---

### How to Proceed

1. Read this handoff completely. Ask Governor any clarifying questions.
2. Review the project BRIEF.md, PLAN.md, and related specialist AGENT.md.
3. When you understand the contract fully, confirm with Governor: "I understand the contract. Ready to execute."
4. Begin work as outlined.

### If Anything is Unclear

Stop and ask Governor. Do not proceed with assumptions or guesses.

### If Blockers Emerge

Report to Governor immediately. Do not work around blockers.
```

### Step 2: Specialist Briefing

Governor meets with each specialist individually (or groups specialists with similar work):

**Governor explains:**
- What the project is trying to accomplish
- This specialist's role and why it matters
- The exact contract (objective, scope, deliverables, review standard)
- Any dependencies or sequencing
- Timeline and expectations
- What happens when work is done

**Governor answers questions:**
- "What do you need from me to succeed?"
- "Are there any blockers or concerns?"
- "Do you need clarification on any part?"

**Specialist confirms:**
- "I understand the contract."
- "I have the information I need."
- "I'm ready to execute [or I need X before I can start]."

Governor documents this confirmation.

### Step 3: Specialist Readiness Check

Governor verifies each specialist has what they need:

- [ ] Handoff document understood
- [ ] Questions answered
- [ ] Access to all needed information (project files, specs, related docs)
- [ ] Dependencies are clear (what must be done first?)
- [ ] Timeline is realistic (specialist confirms feasibility)
- [ ] No blockers (what's blocking you?)

If a specialist says they're not ready, Governor escalates:
- "What's blocking you?" 
- Solve the blocker or defer this specialist's work to later

### Step 4: Execution Authority Grant

Once all specialists confirm understanding:

Governor grants execution authority:

**Message to each specialist:**

```
You are authorized to begin work on [project] Phase 1 as outlined in your handoff contract.

Start date: [date]
Target completion: [date]

Key reminders:
- Stick to your contract scope
- Ask Governor about any scope changes
- Report blockers immediately
- Deliver at the quality standard specified

Begin work.
```

Governor marks the project status as "In Execution — Phase 1" in STATUS.md.

### Step 5: Governor Monitoring Begins

Governor now monitors execution (workflow 05):

- Are specialists progressing?
- Are blockers emerging?
- Is work staying within scope?
- Are we on track for the timeline?

Specialists do not self-coordinate. All coordination goes through Governor.

---

## Decision Points

**Specialist understands the contract?**
- If yes → Grant execution authority
- If no → Clarify further. Revise handoff if needed

**Specialist has no blockers?**
- If yes → Grant execution authority
- If no → Identify blocker, escalate, and resolve before granting authority

**All specialists ready?**
- If yes → Proceed to execution (workflow 05)
- If no → Wait for ready specialists, or stagger start dates

---

## Outputs / Deliverables

1. **Specialist Handoff Documents** — One per specialist (or per specialist team)
2. **Specialist Confirmations** — Written confirmation that specialist understands contract
3. **Execution Authority** — Governor grants permission to begin work
4. **Updated STATUS.md** — Project status shows "In Execution — Phase 1"

---

## Failure Modes

**Specialist Misunderstands Contract:** Specialist starts work and realizes scope is different.
- **Response:** Stop work. Governor clarifies contract. Revise handoff if needed. Restart work with clarity.

**Specialist Questions Contract:** Handoff is ambiguous or conflicting.
- **Response:** Governor refines handoff document. Re-brief specialist.

**Specialist Has Blockers:** Specialist can't start because something's missing.
- **Response:** Governor identifies blocker. Escalates to operator or other specialist. Resolves before handoff.

**Too Many Specialists:** Coordination becomes chaotic.
- **Response:** Governor prioritizes which specialists start first. Stagger if needed.

**Specialist Wants to Change Scope:** "Can I also do X?"
- **Response:** No. Specialist works on contract scope only. If X is important, Governor reassesses and either adds to this phase (with approval) or defers to Phase 2.

---

## Escalation Path

**To Operator:**
- Blockers that prevent execution
- Specialist unavailability
- Timeline conflicts

**To Specialist's AGENT.md:**
- Questions about what the specialist is responsible for (read their AGENT.md for authority and scope)

---

## Done Criteria

Specialist handoff is **done** when:

- [ ] Handoff document is written for each specialist
- [ ] Handoff document is clear and unambiguous
- [ ] Governor has briefed each specialist
- [ ] Specialist has confirmed understanding
- [ ] Specialist has no blockers (or blockers are identified and escalated)
- [ ] Execution authority is granted
- [ ] Project STATUS.md is updated
- [ ] Governor is prepared to monitor execution

Specialist handoff is **not done** until all above are true.

---

## Handoff to Next Workflow

When all specialists confirm readiness:

Governor triggers **05-EXECUTION-CONTROL** to manage Phase 1 execution.

No work proceeds without completed handoff. Specialists do not begin until Governor explicitly grants authority.
