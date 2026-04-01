# WORKFLOW: 08-BLOCKERS-ESCALATION

How technical, resource, and strategic blockers are identified, documented, and escalated for resolution.

---

## Purpose

Ensure blockers don't silently derail projects. Surface issues early. Get operator decisions quickly. Prevent work-arounds and hidden failures.

---

## Trigger

- Governor identifies a blocker during execution (workflow 05)
- Specialist reports a blocker
- Phase review gate (workflow 06) reveals a fundamental issue

---

## Inputs Required

1. **Blocker Description** — What is the problem?
2. **Impact** — How does it affect the project?
3. **What was tried** — Have we attempted workarounds?
4. **Decision needed** — What are the options?

---

## Responsible Owner

**Governor**

Governor documents the blocker, assesses options, and escalates to operator.

---

## Step-by-Step Process

### Step 1: Blocker Documentation

Governor creates an **Escalation Note**:

**Template:**

```
## Escalation: Blocker

**Project:** [project name]
**Date:** [date]
**Severity:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

**Blocker:** [title]

**Description:**
[What is the problem? Be specific.]

**Current Impact:**
- Phase: [which phase is blocked?]
- Work affected: [what can't proceed?]
- Timeline impact: [how long are we blocked?]
- Quality impact: [does this affect quality or risk?]

**Root Cause:**
[Why did this happen? Is it a spec gap? A technical limitation? A dependency?]

**Options:**

### Option A: [Option title]
- **What:** [What would this entail?]
- **Pros:** [Benefits]
- **Cons:** [Drawbacks]
- **Timeline impact:** [Will this delay us?]
- **Resource impact:** [Do we need more people?]

### Option B: [Option title]
[same structure]

### Option C: [Option title]
[same structure]

**Recommendation:**
[Governor's recommended path and why]

**Decision Needed:**
Which option should we pursue?

**Timeline for Decision:**
[How long can we wait for a decision before impact?]
```

Governor completes this note thoroughly and thoughtfully.

### Step 2: Specialist Input (if needed)

If the blocker is technical:

Governor may ask relevant specialists for input:
- "What are your thoughts on this blocker?"
- "Are there other options I'm missing?"
- "Which option do you recommend?"

Governor documents specialist input in the escalation note.

Governor does NOT ask the specialist to work around the blocker. Workarounds are only with operator approval.

### Step 3: Escalation to Operator

Governor sends the escalation note to operator:

**Message:**

"Blocker on [project]. Project is waiting for your decision. See escalation note attached. Options are:
- Option A: [brief summary]
- Option B: [brief summary]
- Option C: [brief summary]

I recommend Option [X] because [reason].

Decision needed by [date] to stay on timeline."

Governor may also request a synchronous discussion if the blocker is urgent/complex.

### Step 4: Operator Decision

Operator reviews and decides:

**Operator chooses Option A / B / C and communicates:**

"Proceed with Option [X]. Here's the approval: [details]."

**If operator needs clarification:**

"I need more information on Option B. What would [question]?"

Governor provides clarification.

**If operator needs to consult someone:**

"Let me talk to [specialist] and get back to you."

Governor waits.

### Step 5: Blocker Resolution

Once operator decides:

Governor implements the decision:

**If the decision requires specialist action:**

Governor notifies specialist: "Blocker resolved. Proceeding with Option [X]. Here's what that means for your work: [details]."

Specialist proceeds accordingly.

**If the decision requires scope changes:**

Governor updates the execution plan and re-communicates to affected specialists.

**If the decision requires rework:**

Governor may return to workflow 07 (revision loops) or adjust the execution plan.

Governor updates STATUS.md with blocker resolution.

### Step 6: Timeline Adjustment

If the blocker caused delay:

Governor assesses timeline impact:

- "We lost 3 days waiting for decision. Phase 1 now completes [new date]."
- "We're adding a week to rework this. New timeline: [date]."

Governor updates the execution plan and notifies operator of any timeline impact.

---

## Decision Points

**Is this actually a blocker?**
- If yes → Escalate
- If no → Governor resolves it directly or returns specialist to work

**Is there a clear decision path?**
- If yes → Escalate with options
- If no → Escalate for operator guidance on what to decide

**Is blocker critical or can we work around it?**
- If critical → Escalate immediately
- If workaround possible → Escalate, but note that workaround exists (for operator to decide)

**Does specialist have input?**
- If yes → Gather it before escalating
- If no → Escalate with Governor's assessment

---

## Outputs / Deliverables

1. **Escalation Note** — Clear documentation of blocker and options
2. **Operator Decision** — Written decision on how to proceed
3. **Updated STATUS.md** — Blocker status documented
4. **Timeline Adjustment** — If needed, updated project timeline

---

## Failure Modes

**Blocker is Vague:** Governor escalates but doesn't clearly explain the issue.
- **Response:** Operator asks for clarification. Governor provides it.

**Options are Missing:** Governor missed a potential solution.
- **Response:** Operator points out alternative option. Governor considers it.

**Blocker Resolution Takes Too Long:** Waiting for operator decision delays project significantly.
- **Response:** Governor escalates urgency. Operator expedites decision.

**Specialist Works Around Blocker:** Specialist doesn't wait for decision; hacks a solution.
- **Response:** Governor catches this and stops it. "Stop. You're working around a blocker without approval. Wait for operator decision."

**Decision Causes More Problems:** Operator's chosen option creates a bigger blocker.
- **Response:** Governor re-escalates: "Option X caused issue Y. Need revised decision."

---

## Escalation Path

**All blockers escalate to Operator** (there is no higher level).

Governor's job is to surface blockers clearly so operator can decide.

---

## Done Criteria

Blocker escalation is **complete** when:

- [ ] Blocker is clearly documented
- [ ] Impact is assessed
- [ ] Options are identified
- [ ] Governor's recommendation is stated
- [ ] Escalation note is sent to operator
- [ ] Operator has decided
- [ ] Decision is implemented
- [ ] STATUS.md is updated
- [ ] Affected specialists are notified
- [ ] Work resumes (with new direction)

Escalation is **not done** until all above are true.

---

## Handoff to Next Workflow

**If blocker required scope change:**

Governor may return to **03-SCOPING-PLANNING** to revise the phase plan.

**If blocker required rework:**

Governor may trigger **07-REVISION-LOOPS**.

**If blocker is resolved and work resumes:**

Governor returns to **05-EXECUTION-CONTROL** to continue monitoring.

No work proceeds while a blocker is unresolved without explicit operator approval to work around it.
