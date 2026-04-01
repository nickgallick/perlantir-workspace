# WORKFLOW: 05-EXECUTION-CONTROL

How Governor monitors and controls execution within approved phases, identifies blockers, and prevents scope creep.

---

## Purpose

Ensure work stays within approved scope, timeline, and quality standards. Identify and resolve blockers quickly. Prevent silent failures. Maintain discipline throughout execution.

---

## Trigger

- Governor grants execution authority from workflow 04

---

## Inputs Required

1. **Specialist Handoff Documents** — Contracts for each specialist
2. **Execution Plan** — Phase 1 objectives, timeline, success criteria
3. **Specialists Ready** — All specialists confirmed and authorized

---

## Responsible Owner

**Governor**

Governor actively monitors execution. Governor is the single point of coordination (specialists do not self-coordinate).

---

## Step-by-Step Process

### Step 1: Execution Kickoff

Governor holds a brief kickoff meeting with all Phase 1 specialists:

**Governor states:**
- "We're now in execution phase. You have your contracts. Start work."
- "I will check in [frequency: daily/every 2 days/weekly] on progress."
- "If you hit blockers, report them immediately to me. Do not work around them."
- "Any scope changes, timeline concerns, or quality issues: escalate to me immediately."

**Specialists acknowledge:**
- "Ready to start."
- "Understood the contract."
- "Will report blockers to you."

Governor marks the project as "In Execution" in STATUS.md with start date.

### Step 2: Progress Monitoring

Governor checks on progress at regular intervals (daily, twice weekly, weekly—depends on phase length and risk):

**Checklist for each specialist:**

- [ ] Specialist is making progress on contract deliverables
- [ ] Specialist is staying within contract scope (not adding work)
- [ ] No blockers are being silently worked around (specialist reports them)
- [ ] Quality is meeting the review standard (Governor spot-checks)
- [ ] Timeline is on track (are we staying in bounds?)
- [ ] No hidden dependencies emerged

**Governor asks:**
- "What did you complete this period?"
- "What are you doing next?"
- "Any blockers or concerns?"

Governor documents answers in project notes or STATUS.md.

### Step 3: Scope Creep Prevention

Specialist approaches Governor with a new idea or request:

**Specialist says:** "Can we also do X?"

**Governor responds:**
- "Is X in your contract scope?"
  - If yes: "Then yes, do it."
  - If no: "No, X is out of scope for Phase 1. Document it as a Phase 2 idea, and continue with your contract work."

**Specialist says:** "The spec says to do Y, but I think we should do Z instead."

**Governor responds:**
- "Why? What's the issue with Y?"
- If specialist's concern is valid: "Good catch. I'll escalate to Product. For now, proceed with Y as planned."
- If specialist wants to improve but Y is acceptable: "Y is in spec. Focus on delivery. We'll iterate in Phase 2."

**Specialist says:** "I found a better way to do this. It requires more time."

**Governor responds:**
- "How much more time? Is it worth the delay?"
- If delay is short and benefit is clear: "Proceed, with operator awareness."
- If delay is significant: "Document the improvement for Phase 2. Stay on timeline for Phase 1."

Governor updates STATUS.md with any scope changes and their impact on timeline.

### Step 4: Blocker Identification and Resolution

Specialist encounters a blocker (technical, resource, dependency):

**Specialist reports:** "I'm blocked on X."

**Governor assesses:**
- Is this a real blocker, or is it a spec clarification?
- Is it within Governor's authority to resolve, or does it need escalation?

**Governor actions:**

**If Governor can resolve:**
- Coordinate with other specialist or provide clarification
- Resolve within 24 hours

**If Governor cannot resolve:**
- Escalate to operator immediately
- Specialist pauses (does not work around the blocker)
- Wait for operator decision

Governor documents blockers in STATUS.md.

**Examples:**

- "I need clarification on the API spec from Backend" → Governor asks Backend for clarification (same day)
- "I need feature X from Phase 2 to complete this" → Governor escalates; operator decides: pull forward X, or defer this work to Phase 2
- "The architecture doesn't support this" → Governor escalates to Architect; operator decides: change architecture or change scope

### Step 5: Quality Gate Checkpoints

At predetermined checkpoints during Phase 1 (mid-phase, 80% complete):

Governor checks each specialist's work:

**For each deliverable:**
- [ ] Does it match the handoff spec?
- [ ] Does it meet the review standard?
- [ ] Is it on track for timeline?

Governor provides feedback:
- "This is good. Keep going."
- "This needs rework before you proceed. Here's what needs to change."
- "This is off-track. Let's discuss what's needed."

If rework is needed:
- Governor clearly specifies what needs to change
- Specialist reworks
- Governor re-checks

Governor updates STATUS.md with checkpoint results.

### Step 6: Execution Reporting

Governor updates STATUS.md regularly (weekly or at key milestones):

```
## Project Status

**Project:** [name]
**Status:** 🟢 In Execution — Phase 1
**Week/Period:** [week of X]
**Last Updated:** [date]

### Progress

**Specialist 1 (Role):**
- Completed: [what was done]
- In progress: [what's being worked on]
- Timeline: On track / Slightly delayed / At risk

**Specialist 2 (Role):**
[etc.]

### Blockers

- [Blocker 1]: Status (resolved / escalated / pending operator)
- [Blocker 2]: [etc.]

### Timeline Status

- Phase 1 completion target: [date]
- Currently tracking: On schedule / At risk

### Quality Status

- Spot checks: All meeting standard / Some rework needed

### Next Steps

- [Next checkpoint or milestone]
- [Escalations pending]

### Risks

- [Any new risks emerged?]
```

Governor shares STATUS.md with operator at regular intervals (weekly) so operator has visibility.

---

## Decision Points

**Specialist on track?**
- If yes → Continue monitoring
- If no → Identify why and course-correct

**Blocker raised?**
- If resolvable by Governor → Resolve immediately
- If needs escalation → Escalate to operator

**Quality on standard?**
- If yes → Continue
- If no → Request rework before proceeding

**Scope creep attempted?**
- If minor and low-cost → Allow if operator informed
- If major → Reject, defer to Phase 2

**Timeline at risk?**
- If yes → Escalate to operator immediately; decide: extend timeline, reduce scope, or add resources

---

## Outputs / Deliverables

1. **Regular Status Updates** — Updated STATUS.md with progress, blockers, timeline
2. **Checkpoint Reviews** — Quality assessment at predetermined checkpoints
3. **Blocker Escalations** — Documented issues and resolutions
4. **Scope Change Log** — Any changes to Phase 1 scope (approved by operator)

---

## Failure Modes

**Silent Failure:** Specialist doesn't report a blocker; continues with workaround.
- **Response:** Governor establishes culture: "Report blockers immediately. Workarounds are not acceptable."
- **Escalation:** If specialist is silent, Governor escalates.

**Scope Creep:** Phase 1 expands significantly mid-execution.
- **Response:** Governor locks the scope. Document extras for Phase 2. If critical, escalate to operator for decision.

**Timeline Slippage:** Phase 1 is taking longer than planned.
- **Response:** Governor identifies why. Escalate to operator: extend timeline, reduce scope, or add resources.

**Quality Issues:** Work doesn't meet review standard.
- **Response:** Governor gives clear feedback for rework. Specialist fixes. Governor re-checks.

**Blocker Can't Be Resolved:** Escalation to operator, operator doesn't respond quickly.
- **Response:** Governor escalates more forcefully. Project is blocked waiting for decision.

**Specialist Says "I'm Overwhelmed":** Scope is too much or skills are insufficient.
- **Response:** Governor assesses: Is it a scope problem or a capability problem? Escalate to operator for additional resources or scope reduction.

---

## Escalation Path

**To Operator:**
- Timeline at risk
- Blockers that require strategic decisions (scope changes, resource additions)
- Quality concerns
- Scope creep that's significant
- Specialist overwhelmed or ineffective

**To Architect/Product/Other Specialist:**
- Technical or functional questions that only they can answer
- Coordination needed between specialists

---

## Done Criteria

Execution control is **ongoing** throughout Phase 1.

Phase 1 is **ready for review gate** (workflow 06) when:

- [ ] All specialist deliverables are complete
- [ ] Deliverables meet review standard
- [ ] Quality checkpoints have passed
- [ ] All major blockers have been resolved
- [ ] Timeline target has been met (or extension approved)
- [ ] Scope is as contracted (no major creep)
- [ ] Specialists are done and ready for review

Execution is **not done** until above are true.

---

## Handoff to Next Workflow

When Phase 1 specialists report completion:

Governor triggers **06-REVIEW-GATE-PROGRESSION** to validate Phase 1 exit criteria and determine readiness for Phase 2.

Specialists do not move to Phase 2 until Phase 1 review gate is passed.
