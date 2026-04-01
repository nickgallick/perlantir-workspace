# WORKFLOW: 07-REVISION-LOOPS

How work that fails quality bar or misses acceptance criteria is revised efficiently without scope creep.

---

## Purpose

Enable rapid iteration when work doesn't meet standards. Keep rework focused, avoid scope expansion, and return to gate review quickly.

---

## Trigger

- Phase review gate (workflow 06) determines "REWORK REQUIRED"

---

## Inputs Required

1. **Rework List** — Specific items from gate review that need fixing
2. **Quality Standard** — What needs to change to meet standard
3. **Specialist Responsible** — Which specialist owns each rework item

---

## Responsible Owner

**Governor**

Governor directs rework, prevents scope expansion, and re-checks completion.

---

## Step-by-Step Process

### Step 1: Rework Specification

Governor creates a **Rework Spec** document:

**Template:**

```
## Rework Specification

**Project:** [name]
**Phase:** [1, 2, etc.]
**Gate Review Date:** [date]

**Rework Items:**

### Item 1: [Clear, specific rework]
- **What's wrong:** [Description of issue]
- **What needs to change:** [Specific fix]
- **Specialist responsible:** [who fixes this]
- **Acceptance criteria:** [how do we know it's fixed?]
- **Estimated effort:** [how long should this take?]
- **Timeline:** [when should this be done?]

### Item 2: [etc.]

---

**Important:**
- Only fix what's listed above.
- Do not add new features or improvements.
- Do not change scope.
- Focus only on meeting the quality standard.
```

Governor shares this spec with each specialist.

### Step 2: Specialist Confirmation

Governor presents rework spec to each affected specialist:

**Governor asks:**
- "Do you understand what needs to be fixed?"
- "Is the estimated effort realistic?"
- "Do you have blockers?"

Specialist confirms understanding and timeline.

**If specialist disputes the rework list:**

Governor escalates: "We disagree on what needs fixing. Let's clarify."

Governor and specialist (and relevant others) align on what's actually needed.

### Step 3: Rework Execution

Specialist reworks the items in the rework spec only.

**Specialist does NOT:**
- Add new features
- Refactor things not on the rework list
- Change scope
- Improve things beyond the spec

**Specialist DOES:**
- Fix the exact issues listed
- Meet the acceptance criteria specified
- Complete within the estimated timeframe

Governor monitors progress (daily or every 2 days, depending on rework size).

### Step 4: Rework Verification

When specialist reports rework complete:

Governor checks each rework item:

- [ ] Is the issue actually fixed?
- [ ] Does it meet the acceptance criteria?
- [ ] Does it meet the quality standard?

**If fixed:**
- "Good. Rework on this item is done."

**If not fixed:**
- "This still has issues. What's the blocker?"
- Specialist fixes further.

**If over-scoped:**
- "You also changed X, which wasn't in the rework spec. Revert that. Focus on the spec."

Governor verifies all rework items.

### Step 5: Return to Gate Review

Once all rework is verified complete:

Governor triggers **06-REVIEW-GATE-PROGRESSION** again to re-review the phase.

This time, the gate review is narrower: only checking the rework items and overall phase readiness.

---

## Decision Points

**Specialist understands rework spec?**
- If yes → Begin rework
- If no → Clarify and re-confirm

**Rework effort reasonable?**
- If yes → Proceed
- If no → Adjust timeline or escalate

**Rework item fixed?**
- If yes → Accept it
- If no → Request further fixes

**All rework items complete?**
- If yes → Return to gate review
- If no → Continue rework

---

## Outputs / Deliverables

1. **Rework Spec** — Clear specification of what needs fixing
2. **Rework Completion** — Fixed work that meets criteria
3. **Verification Checklist** — Confirmation that all rework is done

---

## Failure Modes

**Specialist Over-Scopes:** Reworks more than specified.
- **Response:** Governor says "stop. This is out of scope. Revert to spec. Only fix what's listed."

**Rework Doesn't Actually Fix the Issue:** Governor checks and says "this still doesn't meet standard."
- **Response:** Governor specifies exactly what's still wrong. Specialist continues fixing until standard is met.

**Timeline Slips:** Rework is taking longer than estimated.
- **Response:** Governor assesses: Is specialist blocked? Is estimate wrong? Escalate if timeline impact is significant.

**Specialist Refuses to Rework:** "I think my work is fine."
- **Response:** Governor is the authority. If specialist refuses, escalate to operator. Project is blocked.

---

## Escalation Path

**To Operator:**
- Specialist refuses to rework
- Rework is taking much longer than estimated (timeline impact)
- Quality standard is unachievable (maybe standard is too high)

---

## Done Criteria

Rework is **complete** when:

- [ ] Rework spec is clear
- [ ] Specialist understands spec
- [ ] All rework items are implemented
- [ ] All items meet acceptance criteria
- [ ] Quality standard is achieved
- [ ] No scope creep occurred

Rework is **not done** until above are true.

---

## Handoff to Next Workflow

When rework is verified complete:

Governor triggers **06-REVIEW-GATE-PROGRESSION** (second gate review) to confirm phase readiness.

If gate passes on second review: proceed to Phase 2 planning or completion.
If gate still fails: escalate to operator.
