# WORKFLOW: 09-COMPLETION-HANDOFF

How completed work is handed off for next phase (launch, support, operation) with full documentation and continuity.

---

## Purpose

Ensure completed work is fully documented, understood by next team/phase, and ready for production use or next phase.

---

## Trigger

- All project phases are complete and all review gates have passed
- Final phase review gate (workflow 06) results in "PASS"

---

## Inputs Required

1. **All Phase Work** — Completed and reviewed
2. **Project Files** — BRIEF.md, PLAN.md, STATUS.md, DECISIONS.md all complete
3. **Specialist Deliverables** — All code, design, documentation, etc.
4. **Test and QA Sign-off** — QA has validated all acceptance criteria

---

## Responsible Owner

**Governor**

Governor orchestrates handoff and ensures nothing is lost in transition.

---

## Step-by-Step Process

### Step 1: Completion Verification

Governor confirms project is truly complete:

**Checklist:**

- [ ] All phases are done
- [ ] All review gates have passed
- [ ] All deliverables exist and are reviewed
- [ ] All acceptance criteria are met
- [ ] All blockers have been resolved
- [ ] Documentation is complete and accurate
- [ ] Quality standards are met
- [ ] QA has signed off
- [ ] Security has reviewed (if applicable)

Governor documents final completion in STATUS.md:

```
## Project Status

**Project:** [name]
**Status:** ✅ COMPLETE
**Completion Date:** [date]

**Final Phase:** [X]

**All Phases Passed:** Yes
**All Acceptance Criteria Met:** Yes
**Quality Standard:** Met
**QA Sign-Off:** Yes
**Security Review:** [Yes / N/A]

**Ready for Handoff:** Yes
```

### Step 2: Documentation Finalization

Governor ensures all project documentation is complete and final:

**BRIEF.md:**
- ✅ Final brief (unchanged from original, or final version if changed)

**PLAN.md:**
- ✅ Complete plan of all phases (including what actually happened)

**STATUS.md:**
- ✅ Final status showing completion

**DECISIONS.md:**
- ✅ All decisions documented with rationale
- ✅ Any changes or learnings are recorded

Governor reviews for clarity and completeness.

If documentation is lacking, Governor works with specialists to complete it.

### Step 3: Handoff to Next Phase/Team

Depending on the project type:

**If launching to production:**

Governor prepares **Launch Handoff Document**:

```
## Launch Handoff

**Project:** [project name]
**Launch Date:** [date]

### What's Being Launched
[Clear description of what is shipping]

### Systems and Components
[List of systems, services, features being deployed]

### Documentation
- User docs: [link to documentation]
- API reference: [link if applicable]
- Runbooks: [link to operational guides]
- Known issues: [any issues launched with]

### Support Readiness
- Support team has been trained: [yes/no]
- FAQ is complete: [yes/no]
- Escalation procedures: [documented]

### Monitoring and Operations
- Dashboards are set up: [link]
- Alerts are configured: [list]
- Incident response plan: [link]
- Rollback procedure: [documented]

### First Week Checklist
- [ ] Monitoring shows system is healthy
- [ ] User feedback is positive (or issues are being addressed)
- [ ] Support team is responding to issues
- [ ] No critical bugs have emerged

### Post-Launch Retrospective
[Schedule for retrospective to capture learnings]
```

Governor shares this with launch team (DevOps, Support, etc.).

**If handing off to another project/team:**

Governor prepares **Handoff Summary**:

```
## Handoff Summary

**From Project:** [name]
**To Project/Team:** [name]
**Handoff Date:** [date]

### What's Being Handed Off
[Description of work]

### Location of All Artifacts
- Code: [repository/path]
- Design: [location]
- Documentation: [location]
- Tests: [location]

### Key Team Members to Contact
- [Specialist 1]: [role, contact]
- [Specialist 2]: [role, contact]

### Critical Context
- Known issues: [list]
- Architecture decisions: [summary]
- Performance characteristics: [metrics]
- Scaling limits: [what won't work at scale?]

### Dependency Tree
[What this work depends on, what depends on it]

### Next Steps for Receiving Team
1. [Step 1]
2. [Step 2]
3. [etc.]
```

Governor shares this with receiving team.

### Step 4: Specialist Releases

Governor notifies all Phase specialists:

"Phase [X] is complete and handed off. Thank you for your work. You are now released from this project (unless you have ongoing responsibilities).

If you're needed for support or maintenance, you'll be contacted."

Specialists are released to new projects.

### Step 5: Project Archive

Governor archives the project:

**Move project folder to archive** (or mark it as "complete"):

Update STATUS.md:

```
**Status:** ✅ COMPLETE — ARCHIVED
**Archived Date:** [date]
**Archive Location:** [if moving]
```

Create a **README for Archive**:

```
## Project Archive

**Project:** [name]
**Dates:** [start date] — [completion date]

**What happened in this project:**
[One-paragraph summary of what was built]

**Key deliverables:**
- [Deliverable 1]
- [Deliverable 2]

**Where to find everything:**
- Code: [link]
- Design: [link]
- Docs: [link]

**Contact for questions:**
[List key team members if people need to ask questions]
```

### Step 6: Operator Notification

Governor notifies operator:

"Project [name] is complete and handed off. 

Completion summary:
- All phases complete
- All acceptance criteria met
- Handed off to [team/launch]
- Project is now archived

Final details are in [project folder]."

---

## Decision Points

**Is project truly complete?**
- If yes → Proceed to handoff
- If no → Return to execution or review gates

**Is all documentation complete?**
- If no → Complete it before handing off

**Who receives the handoff?**
- Launch team → Use launch handoff
- Another team → Use team handoff
- Archive only → Use archive readme

---

## Outputs / Deliverables

1. **Launch Handoff Document** (if launching) — Full preparation for production
2. **Handoff Summary** (if transferring) — Preparation for receiving team
3. **Archive README** — Context for anyone revisiting the project later
4. **Updated STATUS.md** — Final project status marked complete
5. **Operator Notification** — Confirmation of completion

---

## Failure Modes

**Documentation is Missing:** Handoff happens but documentation is incomplete.
- **Response:** Governor halts handoff. "Complete the documentation before handoff." Specialist finishes.

**Launch Team is Not Prepared:** Handoff happens but launch team doesn't know what to do.
- **Response:** Governor provides more training and context. Handoff is not complete until receiving team is ready.

**Known Issues Are Hidden:** Handoff happens but there are undocumented problems.
- **Response:** If discovered later, Governor updates archive notes. For future: never hide known issues.

**Specialist Knowledge is Lost:** Specialist leaves project before fully documenting their work.
- **Response:** Governor must extract knowledge from them before release. Cannot proceed with handoff until documented.

---

## Escalation Path

**To Operator:**
- Documentation is severely incomplete and can't be completed
- Receiving team/launch team is not ready and needs postponement
- Known issues are too severe to hand off as-is

---

## Done Criteria

Completion handoff is **complete** when:

- [ ] Project is fully complete (all gates passed)
- [ ] All documentation is final and accurate
- [ ] Handoff document is prepared (launch or team transfer)
- [ ] Receiving team/launch team is ready
- [ ] Archive is set up and documented
- [ ] Operator is notified
- [ ] Specialists are released
- [ ] Project is marked archived or in production

Handoff is **not done** until all above are true.

---

## Handoff to Next Workflow

When project is handed off:

Governor may trigger **10-ARCHIVE-RETROSPECTIVE** to capture final learnings.

Or project is simply closed/archived.

New projects start fresh with **01-INTAKE-TRIAGE**.
