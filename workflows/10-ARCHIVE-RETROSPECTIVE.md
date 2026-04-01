# WORKFLOW: 10-ARCHIVE-RETROSPECTIVE

How completed projects are analyzed for lessons learned and documented for organizational memory.

---

## Purpose

Capture what worked, what didn't, and what to do differently next time. Build organizational knowledge. Prevent repeating mistakes.

---

## Trigger

- Project is handed off and complete (workflow 09)
- Project is archived
- Scheduled retrospective (1-2 weeks after completion)

---

## Inputs Required

1. **All Project Documentation** — BRIEF.md, PLAN.md, STATUS.md, DECISIONS.md
2. **Specialist Feedback** — From team members who worked on project
3. **Outcome Data** — If product/launch, usage data, feedback, metrics
4. **Timeline Data** — How long did each phase take vs estimate?

---

## Responsible Owner

**Governor**

Governor facilitates retrospective and documents learnings. May gather input from specialists.

---

## Step-by-Step Process

### Step 1: Retrospective Planning

Governor schedules a retrospective meeting (1-2 weeks after project completion):

**Participants:**
- Governor
- Key specialists (Architect, Product, Backend, etc.—whoever led major work)
- Operator (optional, but valuable for strategic perspective)

**Duration:** 1-2 hours

**Agenda:**
1. What went well?
2. What was harder than expected?
3. What would we do differently next time?
4. What did we learn about our process, tools, team?
5. Key metrics/outcomes (if applicable)

### Step 2: Retrospective Facilitation

Governor facilitates the discussion:

**What Went Well:**

Governor asks: "What are we proud of? What did we execute well?"

Specialists share:
- "The scoping process really helped us stay on track."
- "Architecture held up under scale testing."
- "Design reviews prevented rework."

Governor documents these.

**What Was Harder Than Expected:**

Governor asks: "What surprised us? What took longer? What was harder?"

Specialists share:
- "Integration with X service took 2x longer than estimated."
- "Rework cycle on the UI was longer than anticipated."
- "Approval process had delays."

Governor documents with context.

**What Would We Do Differently:**

Governor asks: "If we could do this again, what would we change?"

Specialists share:
- "Earlier architectural review would have caught issue X."
- "More user testing before design would have avoided rework."
- "Clearer initial spec would have saved time."

Governor documents the improvements.

**Process Learnings:**

Governor asks: "Did our governance/workflows/tools help or hinder us?"

Specialists share:
- "The handoff process was clear and prevented misalignment."
- "Review gates caught issues before they became problems."
- "We needed better communication with [team]."

Governor documents process improvements.

**Metrics and Outcomes:**

If the project shipped/launched:
- "Users love feature X" / "Users don't use feature Y"
- "Performance met targets" / "Performance was below target"
- "No security issues found" / "Security issue X emerged"

Governor documents actual outcomes vs expectations.

### Step 3: Lessons Learned Documentation

Governor creates a **Retrospective Report**:

**Template:**

```
## Project Retrospective

**Project:** [name]
**Date:** [completion date]
**Retrospective Date:** [date]

**Duration:** [how long did project take]
**Team:** [who was involved]

### What Went Well

**[Theme 1]:** [What worked]
- Example: [specific instance]

**[Theme 2]:** [What worked]
- Example: [specific instance]

### Surprises and Challenges

**[Challenge 1]:** [What was harder]
- Impact: [how did this affect us]
- Why: [root cause]
- Next time: [how to avoid/handle differently]

**[Challenge 2]:** [What was harder]
[same structure]

### Timeline Analysis

| Phase | Estimate | Actual | Variance | Notes |
|-------|----------|--------|----------|-------|
| [Phase 1] | [est] | [actual] | [+/- X] | [why?] |
| [Phase 2] | [est] | [actual] | [+/- X] | [why?] |

**Summary:** [Were we generally accurate? Where did we miss?]

### Process Improvements

**What Went Well:**
- [Process element]: [Why it worked]

**What Could Improve:**
- [Process element]: [Why it didn't work / how to improve]

### Outcome Analysis (if applicable)

**Expected:** [What we planned to achieve]
**Actual:** [What actually happened]

**Success Metrics:**
- [Metric 1]: [Target] vs [Actual]
- [Metric 2]: [Target] vs [Actual]

**Customer/User Feedback:** [What are they saying?]

### Key Learnings

**Technical:**
- [Learning 1]: [How to apply next time]
- [Learning 2]: [How to apply next time]

**Process:**
- [Learning 1]: [How to apply next time]
- [Learning 2]: [How to apply next time]

**Team:**
- [Learning 1]: [How to apply next time]
- [Learning 2]: [How to apply next time]

### Recommendations for Next Projects

1. [Recommendation 1]: [When/how to apply]
2. [Recommendation 2]: [When/how to apply]
3. [Recommendation 3]: [When/how to apply]

### Decisions to Document

Any strategic decisions or learnings that should influence future work.

### Specialist Feedback Summary

**[Specialist 1]:** [Key feedback]
**[Specialist 2]:** [Key feedback]
```

Governor documents the retrospective thoroughly.

### Step 4: Update DECISIONS.md

Governor adds a retrospective summary to the project's DECISIONS.md:

```
### Decision: Project Retrospective

**Date:** [date]
**Owner:** Governor

**Context:** Project [name] is complete. Conducting retrospective to capture learnings.

**Key Findings:**
- [Finding 1]
- [Finding 2]

**Process Changes for Next Project:**
- [Change 1]
- [Change 2]

**Learnings Applied:**
- [Learning 1]
- [Learning 2]

**Retrospective Report:** [Link to full report]
```

### Step 5: Archive Retrospective Report

Governor stores the **Retrospective Report** in the project archive:

**Location:** `workspace/projects/[PROJECT-NAME]/RETROSPECTIVE.md`

This becomes part of the project's permanent record.

### Step 6: Share Learnings Broadly

Governor shares the retrospective with the broader team:

**Message:**

"Project [name] is complete. Retrospective attached.

Key learnings:
- [Learning 1]
- [Learning 2]
- [Learning 3]

These learnings will inform our next projects. If you're starting similar work, read this retrospective first."

Governor may also update process docs (like this workflow file) if learnings suggest changes.

### Step 7: Process Improvement

If retrospective reveals systemic issues:

Governor may propose improvements to:
- Workflows (e.g., "should we add a step here?")
- Governance (e.g., "should we change approval gates?")
- Tools/practices (e.g., "should we use different tooling?")

Governor documents proposed improvements and presents to operator for consideration.

---

## Decision Points

**Are there actionable learnings?**
- If yes → Document them clearly for application next time
- If no → Still capture for reference

**Should processes change based on learnings?**
- If yes → Propose changes to operator and workflows
- If no → Document why we're not changing

**Should team composition change for next project?**
- If yes → Note for consideration on future projects
- If no → Note what worked in this team

---

## Outputs / Deliverables

1. **Retrospective Report** — Complete analysis of project learnings
2. **Updated DECISIONS.md** — Final decision record
3. **Process Improvement Proposals** — If changes are needed
4. **Organizational Learning** — Shared with team for future projects

---

## Failure Modes

**Retrospective Skipped:** Team is tired, moves on to next project without retrospective.
- **Response:** Governor insists on retrospective. "We learn from every project. Schedule it."

**Retrospective is Blame-Focused:** Discussion devolves into blame ("X specialist was slow").
- **Response:** Governor refocuses: "We're looking for systems improvements, not individual blame. What can we improve?"

**Learnings Are Not Applied:** Retrospective documents good ideas, but next project ignores them.
- **Response:** Governor enforces application. When starting next project: "Read the retrospective from [project]. Let's apply those learnings."

**Retrospective is Too Long:** Takes forever to complete, too much time spent analyzing.
- **Response:** Governor time-boxes the retrospective. 1-2 hours, capture key points, move on.

---

## Escalation Path

**To Operator:**
- Systemic process issues that need strategic decision
- Resource or team composition changes needed for future projects

---

## Done Criteria

Retrospective is **complete** when:

- [ ] Retrospective meeting has been held
- [ ] Feedback from all key specialists has been gathered
- [ ] Retrospective Report is documented
- [ ] DECISIONS.md is updated
- [ ] Learnings are clear and actionable
- [ ] Report is stored in project archive
- [ ] Learnings are shared with team
- [ ] Process improvements are identified (if applicable)

Retrospective is **not done** until all above are true.

---

## Handoff to Next Workflow

When retrospective is complete:

Project is **fully archived**. All workflows are done.

Next project starts fresh with **01-INTAKE-TRIAGE**.

Learnings from this project inform the next.
