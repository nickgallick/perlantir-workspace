# WORKFLOW: 06-REVIEW-GATE-PROGRESSION

How Governor validates phase exit criteria and determines readiness to proceed to the next phase or iterate.

---

## Purpose

Ensure each phase meets its success criteria and acceptance criteria before proceeding. Gate prevents unfinished work from rolling forward. Determine: proceed to Phase 2, iterate/rework, or escalate.

---

## Trigger

- Specialists report Phase 1 completion from workflow 05

---

## Inputs Required

1. **Specialist Deliverables** — All Phase 1 work completed
2. **Execution Plan** — Phase 1 exit criteria and success criteria
3. **Status and Checkpoint Reports** — From execution monitoring

---

## Responsible Owner

**Governor**

Governor conducts the phase review and makes the gate decision. Governor may involve specialists for technical questions.

---

## Step-by-Step Process

### Step 1: Deliverable Verification

Governor checks that all Phase 1 deliverables are complete:

**For each specialist:**

- [ ] All contracted deliverables are provided
- [ ] Deliverables are in the correct location (files exist, documents are in place)
- [ ] Deliverables are not partial or incomplete

Governor makes a checklist and verifies completeness.

**If deliverables are missing:**

Governor escalates: "X deliverable is missing. Specialist must complete before gate review proceeds."

Specialist completes missing deliverable. Governor rechecks.

No gate review proceeds with incomplete deliverables.

### Step 2: Exit Criteria Review

Governor verifies Phase 1 against exit criteria from the execution plan:

**Exit Criteria Examples:**

- "All APIs are specified and implemented"
- "All acceptance criteria from Product are met"
- "Design mockups are complete and reviewed"
- "Code is tested and documented"
- "No critical bugs remain"
- "Performance meets targets"

**For each criterion:**

Governor assesses: Is it met? Yes / No / Partial

**If not met:**

Governor documents what's missing and escalates or returns to execution for rework.

### Step 3: Success Criteria Evaluation

Governor assesses Phase 1 against success criteria from the brief/plan:

**Success Criteria Examples:**

- "User can log in via [auth method]" — Does login work? Test it.
- "API latency is under 100ms" — Measure it. Is it under 100ms?
- "Design is reviewed by operator" — Did operator review? Approved?
- "No security vulnerabilities identified" — Did Security review? Any findings?

Governor documents assessment for each criterion.

**If success criteria are not met:**

Governor escalates: "X criterion is not met. What's needed to meet it?"

Options:
- Rework (Phase 1 work needs improvement)
- Accept with caveat (operator approves the gap, document as known issue)
- Defer to Phase 2 (important, but not Phase 1 blocker)

### Step 4: Quality Verification

Governor spot-checks specialist work for quality:

**For code/technical work:**
- Is code clean, tested, documented? (spot check a few pieces)
- Are there obvious bugs or issues?
- Does it follow the review standard specified in handoff?

**For design/product work:**
- Does it match the spec?
- Is it polished and premium (or acceptable for this phase)?
- Does it meet the review standard?

**For documentation/guides:**
- Is it accurate?
- Is it clear and useful?
- Are examples correct?

Governor provides feedback:
- "This meets quality standard. Good work."
- "This has issues that need fixing before we proceed. Here's what:"

If quality issues exist, Governor determines:
- Are they blockers for Phase 2? (fix now)
- Are they nice-to-have fixes? (can iterate in Phase 2)

### Step 5: Specialist Review

Governor may request specialist feedback on other specialists' work (cross-functional review):

**Example:**

- Backend asks Frontend: "Does our API work for you? Any issues?"
- Frontend says: "API works, but X behavior is unclear. Can you clarify?"

Governor resolves cross-functional concerns.

### Step 6: Gate Decision

Governor decides:

**Option A: Pass Gate**

All exit criteria are met, success criteria are achieved, quality is acceptable, and no blockers remain.

Decision: "Phase 1 passes. Ready for Phase 2 planning."

**Option B: Conditional Pass**

Minor issues exist, but they don't block Phase 2. Document known issues.

Decision: "Phase 1 conditionally passes. Known issues: [list]. Document in DECISIONS.md. Phase 2 can proceed with awareness of these items."

**Option C: Rework Required**

Exit or success criteria are not met. Phase 1 needs rework.

Decision: "Phase 1 does not pass. Required rework: [list]. Specialists, please rework [items]. Governor will re-review."

Specialists return to rework (workflow 07).

**Option D: Escalate**

Phase 1 has fundamental issues that need operator decision.

Decision: "Phase 1 has blocker X. Escalating to operator for decision: proceed as-is, rework, or cancel."

Governor escalates to operator (workflow 08).

### Step 7: Documentation Update

Governor updates project files:

**Update STATUS.md:**

```
## Project Status

**Project:** [name]
**Status:** 🟡 Reviewing Phase 1 Gate
**Phase:** Review Gate — Phase 1

**Gate Review Date:** [date]

**Exit Criteria Assessment:**
- [Criterion 1]: ✅ Met / ❌ Not Met / ⚠️ Partial
- [Criterion 2]: [etc.]

**Success Criteria Assessment:**
- [Criterion 1]: ✅ Met / ❌ Not Met
- [Criterion 2]: [etc.]

**Quality Assessment:**
- [Overall quality]: ✅ Meets standard / ⚠️ Minor issues / ❌ Significant issues

**Gate Decision:** ✅ PASS / ⚠️ CONDITIONAL PASS / ❌ REWORK REQUIRED / ⚠️ ESCALATE

**Known Issues (if applicable):**
- [Issue 1]: [Impact and workaround]

**Next Steps:**
- [Proceed to Phase 2 planning] OR [Return to rework] OR [Escalated to operator]
```

**Update DECISIONS.md:**

```
### Decision: Phase 1 Gate Review

**Date:** [date]
**Owner:** Governor
**Context:** Phase 1 is complete. Conducting gate review to determine readiness for Phase 2.
**Decision:** [PASS / CONDITIONAL PASS / REWORK / ESCALATE]
**Rationale:** [Summary of why gate passed or didn't]
**Known Issues:** [If conditional, what issues remain?]
```

### Step 8: Operator Notification

Governor notifies operator of gate result:

**If PASS or CONDITIONAL PASS:**

"Phase 1 review gate complete. Result: [PASS / CONDITIONAL PASS]. Ready to proceed to Phase 2 planning."

Operator acknowledges.

**If REWORK REQUIRED:**

"Phase 1 review gate: REWORK REQUIRED. Required rework: [list]. Specialists are working on fixes. Will re-review [date]."

Operator acknowledges.

**If ESCALATE:**

"Phase 1 review gate requires your decision. Issue: [blocker]. Options: [list]. Recommendation: [what Governor recommends]. Your decision?"

Operator decides.

---

## Decision Points

**All deliverables complete?**
- If yes → Proceed to exit criteria review
- If no → Return to execution for completion

**Exit criteria met?**
- If yes → Proceed to quality review
- If no → Determine rework vs escalation

**Success criteria achieved?**
- If yes → Proceed to quality check
- If no → Determine impact and escalation path

**Quality acceptable?**
- If yes → Gate decision (pass or conditional)
- If no → Determine if blockers or nice-to-have

**Any blockers?**
- If yes → Escalate to operator or return to rework
- If no → Make gate decision

---

## Outputs / Deliverables

1. **Gate Review Report** — Assessment of exit criteria, success criteria, quality
2. **Gate Decision** — PASS / CONDITIONAL PASS / REWORK / ESCALATE
3. **Updated STATUS.md** — Gate result documented
4. **Updated DECISIONS.md** — Gate decision recorded
5. **Known Issues List** — If conditional pass, documented

---

## Failure Modes

**Deliverables Incomplete:** Specialist says they're done, but deliverable is missing.
- **Response:** Return to execution. Specialist completes deliverable. Governor rechecks.

**Criteria Are Vague:** Exit criteria from execution plan are ambiguous.
- **Response:** Governor clarifies with Product/Architect/relevant specialist. Then assess.

**Quality Issues Discovered:** Work doesn't meet review standard.
- **Response:** Governor determines: blocker (rework now) or acceptable (iterate in Phase 2). Escalate if needed.

**Specialist Disagrees with Gate Decision:** Specialist says work is complete, Governor says it's not.
- **Response:** Governor is the authority. Governor explains specifically what's needed. If specialist disagrees fundamentally, escalate to operator.

**Timeline Impact:** Rework will delay Phase 2.
- **Response:** Governor escalates to operator. Decide: extend timeline, do Phase 2 in parallel, or reduce Phase 2 scope.

---

## Escalation Path

**To Operator:**
- Blocker discovered that affects Phase 2 readiness
- Fundamental conflict on quality standard
- Timeline impact from rework
- Specialist performance issues

**To Architect/Product/Relevant Specialist:**
- Clarification on acceptance criteria
- Technical assessment of quality issues

---

## Done Criteria

Phase 1 review gate is **complete** when:

- [ ] All deliverables are verified to exist
- [ ] Exit criteria are assessed
- [ ] Success criteria are evaluated
- [ ] Quality is spot-checked
- [ ] Gate decision is made (PASS / CONDITIONAL PASS / REWORK / ESCALATE)
- [ ] STATUS.md is updated
- [ ] DECISIONS.md is updated
- [ ] Operator is notified

Review gate is **not done** until all above are true.

---

## Handoff to Next Workflow

**If PASS or CONDITIONAL PASS:**

Governor triggers **03-SCOPING-PLANNING** (for Phase 2) or **09-COMPLETION-HANDOFF** if Phase 1 is final.

**If REWORK REQUIRED:**

Governor triggers **07-REVISION-LOOPS** for rework iteration.

**If ESCALATE:**

Governor triggers **08-BLOCKERS-ESCALATION** and waits for operator decision before proceeding.

No automatic progression without explicit decision.
