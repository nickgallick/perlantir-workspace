# LESSONS-LEARNED-FORMAT.md

## Purpose
How to capture lessons learned from work. Convert incidents and discoveries into durable improvements. Standard format for logging what we learned and how to prevent recurrence.

---

## When to Capture a Lesson

### Capture If:
- Something went wrong and we fixed it
- We made the same mistake twice
- We discovered a gap in our system
- A process slowed us down significantly
- A standard/tool/workflow saved us time
- We learned something about our system

### Don't Capture If:
- Normal expected behavior
- One-off issue that won't repeat
- Too vague to extract a rule from

---

## Lesson Format

```markdown
## [Lesson Title]

### What Happened (Incident)
[Describe the situation. What went wrong? What did we discover?]

### Root Cause
[Why did it happen? What underlying condition allowed it?]

### Impact
[What was the consequence? Time lost? Bugs introduced? Rework needed?]

### Prevention Rule
[How do we prevent this going forward? Specific, actionable rule.]

### Where This Applies
[Which standards/workflows/prompts should be updated?]

### Effectiveness
[If implemented: Has this rule actually prevented recurrence?]

### Status
[ ] New (just discovered)
[ ] Proposed (rule drafted, awaiting approval)
[ ] Adopted (rule in place, in use)
[ ] Effective (rule prevented recurrence)

### Date Captured
[When this lesson was captured]
```

---

## Lesson Examples

### Example 1: Stale Context Edit

```markdown
## Lesson: Re-read Discipline Prevents Stale-Context Edits

### What Happened
In Phase 7, agent edited a file without re-reading it first.
The file had been modified by another specialist in the previous turn.
Agent edited based on outdated context, causing 2 tests to fail.

### Root Cause
Standard existed (EDIT-SAFETY.md) but wasn't enforced.
Agent followed old pattern (assume context is current) instead of new discipline.

### Impact
Tests failed; required debugging and corrective edit (15 min lost).
Could have been caught with simple re-read before edit.

### Prevention Rule
Added to EDIT-SAFETY.md:
- Re-read target file immediately before editing (not earlier)
- Exception only if file written <2 min ago in same turn
- Re-read must include context around target lines
- After edit: Re-read again to verify change applied

Added to ENGINEERING-EXECUTION.md:
- "Re-Read-Before-Edit Discipline" section
- Made it non-negotiable (not optional)

### Where This Applies
- EDIT-SAFETY.md: Added checklist item
- ENGINEERING-EXECUTION.md: Added to discipline section
- Agent behavior: All file edits must follow this

### Effectiveness
Implemented after Phase 7. In Phase 8+, no stale-context edits.
Rule is working.

### Status
[X] Adopted (now in standards)
[X] Effective (prevented subsequent issues)

### Date Captured
April 1, 2026
```

---

### Example 2: Missing Verification Evidence

```markdown
## Lesson: Verification Evidence Must Be Explicit

### What Happened
Agent claimed "Phase complete, tests pass" but didn't show test output.
Operator reviewed and found tests were actually failing.
Agent had not run tests before claiming completion.

### Root Cause
VERIFICATION-STANDARD.md existed but didn't require evidence format.
Agent assumed passing = true without verifying.
Operator caught it before deployment; could have shipped broken code.

### Impact
High-risk issue: False completion claim could have broken production.
Forced operator to double-check all agent claims.
Reduced trust in agent work quality.

### Prevention Rule
Updated VERIFICATION-STANDARD.md:
- Verification REQUIRES evidence (test output, linting results, code review)
- Specific evidence format: Copy/paste actual tool output
- Never: Claim success without evidence
- Check: EVIDENCE-AND-CITATION-STANDARD.md for format

Added to DEFINITION-OF-DONE.md:
- "Verification Evidence" section
- Required before claiming any work complete

### Where This Applies
- VERIFICATION-STANDARD.md: Added evidence requirement
- DEFINITION-OF-DONE.md: Added to universal checklist
- EVIDENCE-AND-CITATION-STANDARD.md: New standard for evidence format
- Agent behavior: All completions must provide evidence

### Effectiveness
After implementation: All completion claims include evidence.
Operator trust increased.
No more false completion claims.

### Status
[X] Adopted (now in standards)
[X] Effective (prevented false claims)

### Date Captured
April 1, 2026
```

---

### Example 3: Avoided Mistake (Good Pattern)

```markdown
## Lesson: File Touch Limits Prevent Careless Refactors

### What Happened
In Phase 6, agent was assigned to refactor error handling.
Standard practice would be to touch 8+ files.
Instead, agent recognized high-touch risk and asked operator first.
Operator suggested narrower scope; 3 files instead of 8.

### Root Cause
N/A (this is a success; no mistake)

### Impact
Positive: Narrower scope = less risk, faster turnaround, easier review.
Standard prevented overambitious refactor.

### Prevention Rule
Confirmed existing rule in ENGINEERING-EXECUTION.md:
- 1–3 file touches: Free
- 4+ file touches: Flag and ask first

This limit prevented unnecessary scope creep.
Keep this rule; it works.

### Where This Applies
- ENGINEERING-EXECUTION.md: File Touch Limits section
- Keep as-is; don't change

### Effectiveness
Rule is working as intended.
Agents now ask before high-touch changes.

### Status
[X] Adopted (already in place)
[X] Effective (prevents scope creep)

### Date Captured
April 1, 2026
```

---

## How to Consolidate Lessons into MEMORY.md

### Process

1. **Capture**: Log lesson when discovered
2. **Wait**: Collect lessons over time (weekly or monthly)
3. **Review**: Read lessons to identify themes
4. **Consolidate**: Extract wisdom into MEMORY.md

### Example Consolidation

**Lessons captured during Phase 7–8**:
- Re-read discipline prevents stale edits
- Verification evidence is non-negotiable
- High-touch refactors need approval
- Web research must cite sources

**Consolidated into MEMORY.md**:
```markdown
## Lessons Learned

### Discipline and Verification (Phase 7–8)
Multiple incidents revealed:
1. Stale-context edits happen without re-read discipline
2. False completion claims happen without evidence requirement
3. Scope creep happens without file-touch limits

Prevention:
- Re-read files before editing (EDIT-SAFETY.md)
- Provide evidence for all claims (VERIFICATION-STANDARD.md)
- Flag work >3 file touches (ENGINEERING-EXECUTION.md)

Impact: System is now more reliable and verifiable.
```

---

## Lesson Capture Checklist

When discovering a lesson:

- [ ] What happened? (Incident described)
- [ ] Why did it happen? (Root cause identified)
- [ ] What was the impact? (Time, bugs, risk quantified)
- [ ] How do we prevent it? (Specific rule proposed)
- [ ] Where does this apply? (Standards identified)
- [ ] Who needs to know? (Standard updated)
- [ ] Is the rule working? (Monitored for effectiveness)

---

## From Lesson to Standard

### Proposal Process (see SELF-IMPROVEMENT-POLICY.md)

1. **Capture lesson**: Log incident and proposed rule
2. **Propose**: Create improvement proposal
3. **Get approval**: Operator reviews and approves
4. **Implement**: Update relevant standard
5. **Monitor**: Does rule work?
6. **Consolidate**: Add to MEMORY.md if it's a major learning

### Example: Lesson to Standard

**Lesson** (captured after Phase 7):
```
Stale context caused edit to wrong version of file
Prevention: Re-read file before editing
```

**Proposal** (Phase 7 postmortem):
```
Improvement Proposal: Add Re-Read-Before-Edit Checklist

Problem: Agent edited stale file version, tests failed
Solution: Mandatory re-read before every edit (checklist in standard)
```

**Approved**: Operator approves

**Implementation** (Phase 8):
```
Update EDIT-SAFETY.md:
- Add "Re-Read-Before-Edit" section
- Add checklist with exceptions
- Link from ENGINEERING-EXECUTION.md
```

**Result**: Rule now in standards; being followed; preventing issues

---

## Lessons Worth Archiving

Over time, some lessons become obsolete:
- "Don't use Y tool" → Tool is now deprecated, no longer relevant
- "Avoid approach X" → Problem is fixed in new version, no longer applies
- "Watch out for bug in Z" → Bug fixed, lesson no longer needed

**Archive Process**:
1. Move to `memory/ARCHIVED-LESSONS.md` (if keeping for history)
2. Or delete if truly no longer relevant
3. Keep MEMORY.md and active lessons current

---

## Integration with Other Standards

- **POSTMORTEM-AND-LEARNING.md**: How incidents generate lessons
- **MEMORY-CONVENTIONS.md**: How lessons fit in memory model
- **MEMORY-RULES.md**: Rules for memory storage
- **SELF-IMPROVEMENT-POLICY.md**: How lessons drive system improvements

---

## Key Principle

**Every mistake is a chance to learn. Every lesson improves the system.**

Capture specific lessons.
Consolidate into actionable rules.
Update standards.
Verify rules work.
Monitor and refine.

Non-negotiable: Turn experience into durable improvements.
