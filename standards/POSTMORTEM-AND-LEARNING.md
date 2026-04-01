# POSTMORTEM-AND-LEARNING.md

## Purpose
Define a real improvement loop. When work fails, breaks, or produces unexpected results, capture the learning systematically. Drive improvements to workflows, standards, and agent behavior.

---

## Incident Definition

**What is an Incident?**
- Tests failed and we had to debug
- Work had to be rolled back
- A standard or process was violated
- A mistake was repeated
- Verification caught a problem
- Escalation was required
- A phase had to be extended significantly
- A lesson could be extracted for future prevention

---

## Postmortem Structure

### Header
```markdown
## Incident Postmortem: [Title]

**Date**: [Date occurred]
**Phase**: [Phase number and name]
**Severity**: [S1 = production impact, S2 = significant wasted time, S3 = learning opportunity]
**Status**: [Resolved / Ongoing]
```

### 1. What Happened? (Timeline)
Describe the incident chronologically. What did the agent do? What went wrong?

**Example**:
```
Timeline:
- 14:00 UTC: Phase 7 started, task was to refactor config system
- 14:15 UTC: Agent edited config.js without re-reading first
- 14:20 UTC: Tests ran, 3 tests failed with "config undefined" errors
- 14:30 UTC: Agent noticed tests failed but continued with other changes
- 15:00 UTC: Agent claimed phase complete despite test failures
- 15:05 UTC: Operator reviewed, found tests failing, escalated
```

### 2. Root Cause (Why?)

**Not**: "Agent made a mistake"

**Real Root Causes**:
- Agent didn't follow re-read discipline (why?)
- Standard wasn't clear enough (why?)
- Verification wasn't automated (why?)
- No immediate feedback loop (why?)

**dig for cause**:
- What condition allowed the mistake?
- What process failed?
- What was the agent's mental model?

**Example**:
```
Root Cause: Agent edited file without re-reading first.

Why? Because agent's context was stale; file had been modified by
another specialist in the previous turn. Agent didn't realize state
had changed.

Why not caught? Because verification happens after other work;
agent continued and claimed completion before tests were run.

Why not escalated? Because agent wasn't checking test output before
claiming done.
```

### 3. Contributing Factors (What Made It Worse?)

List conditions that made the incident worse or harder to catch.

**Example**:
```
Contributing Factors:
1. Re-read discipline was in standard but not enforced (no checklist)
2. Test output wasn't immediately visible (tests run later)
3. Phase scope was vague ("refactor config system") — no specific verification step
4. Agent wasn't familiar with stale-context protocol yet (new standard)
```

### 4. Missed Signals (What Should We Have Caught?)

What did we miss before things got bad?

**Example**:
```
Missed Signals:
1. File modification time was newer than context arrival time (not checked)
2. Tests were failing (not reviewed before claiming complete)
3. No checklist enforcement (re-read was in standard but optional-looking)
4. Verification evidence not required (tests could fail without being reported)
```

### 5. Resolution

What was done to fix it?

**Example**:
```
Resolution:
1. Fixed the three failing tests by reverting to last good version
2. Agent re-read file and made correct edit
3. Tests re-run, passed
4. Phase mark as complete after verification
```

### 6. Prevention Rules (How Do We Prevent This?)

Specific, concrete rules to prevent recurrence.

**Example**:
```
Prevention Rules:

1. Re-read discipline is now MANDATORY (not optional):
   - Added checklist item to EDIT-SAFETY.md
   - Checked before every edit
   - Exception only if file written <2 min ago in same turn

2. Verification is now a gate:
   - Cannot claim done without test evidence
   - Added to VERIFICATION-STANDARD.md
   - Specific evidence format required

3. Stale-context awareness protocol:
   - Added to ENGINEERING-EXECUTION.md
   - If context >30 min old, re-read shared state
   - If subagent switched, assume state may have changed
```

### 7. Should Any Standard, Workflow, or Prompt Change?

**Questions**:
- Did a standard fail? Should it be rewritten?
- Did a workflow cause this? Should phases be reorganized?
- Did agent behavior allow this? Should prompts be updated?
- Should this be a new specialist responsibility?

**Examples**:
```
Standard Changes:
- Update EDIT-SAFETY.md: Add re-read checklist (was vague, now mandatory)
- Update VERIFICATION-STANDARD.md: Add evidence requirement
- Update ENGINEERING-EXECUTION.md: Add stale-context awareness section

Workflow Changes:
- Add verification checkpoint DURING phase (not just at end)
- Run tests immediately after major edits (not batched later)

No prompt changes needed (this is procedural, not agent decision-making)
```

---

## Postmortem Template

```markdown
## Incident Postmortem: [Title]

**Date**: [Date]
**Phase**: [Phase]
**Severity**: [S1/S2/S3]
**Status**: [Resolved/Ongoing]

### What Happened?
[Timeline: What occurred step-by-step]

### Root Cause
[Dig deep: What condition allowed this? Why did it happen?]

### Contributing Factors
1. [Factor 1]
2. [Factor 2]
3. [Factor 3]

### Missed Signals
1. [Signal 1: What should we have caught?]
2. [Signal 2]

### Resolution
[What was done to fix it?]

### Prevention Rules
1. [Specific rule to prevent recurrence]
2. [Specific rule]

### Standard/Workflow Changes
**Standards**: [Which files changed?]
**Workflows**: [Any process changes?]
**Agent Prompts**: [Any guidance updates?]

### Lessons for Memory
[What should be captured in MEMORY.md?]

### Open Questions
[Anything still unclear? Follow-ups needed?]
```

---

## How Postmortems Drive Improvements

### Example Incident → Fix Loop

**Incident**: "Agent claimed tests passed but they were actually failing"

**Postmortem findings**:
- Root cause: No verification evidence requirement
- Contributing: Tests run asynchronously; no immediate feedback
- Prevention rule: Verification must require evidence (test output, linting results, etc.)

**Improvement implementation**:
- **Proposal**: Add "Evidence Format" section to VERIFICATION-STANDARD.md
- **Approval**: Operator approves (Phase 6 scope)
- **Implementation**: Update VERIFICATION-STANDARD.md with required evidence
- **Result**: Future agents must provide test output; false claims impossible

**Memory update**:
```markdown
### Lesson: Verification Evidence is Non-Negotiable

Incident in Phase 7: Agent claimed tests passed without showing evidence.
Tests were actually failing.

Prevention: Updated VERIFICATION-STANDARD.md to require evidence.
Now all completions must show: test output, linting results, or code review.

Impact: Prevents false completion claims; increases trust in agent work.
```

---

## Severity Levels

### S1: Production Impact
- Work caused system outage or data loss
- Security was compromised
- User-facing feature is broken
- Customer impact

**Response**:
- Immediate escalation
- Full postmortem required
- Standard/workflow change very likely

**Example**: Agent deployed code without testing; broke API endpoint

### S2: Significant Wasted Time / Repeated Mistake
- Work had to be rolled back significantly
- Same mistake repeated 2+ times
- Verification caught critical problem
- Phase had to be extended >50%

**Response**:
- Postmortem required
- Standard/workflow change recommended
- New prevention rule defined

**Example**: Re-read discipline violated twice; wrong file edited

### S3: Learning Opportunity
- Mistake caught early
- First time we saw this pattern
- No significant impact, but lesson clear

**Response**:
- Postmortem optional but encouraged
- Update MEMORY.md with lesson
- Consider if standard change warranted

**Example**: New agent type tried inefficient approach; optimization found

---

## Postmortem Review Process

### Immediately After Incident
1. If S1: Escalate and write incident summary (short postmortem)
2. If S2: Schedule postmortem review in next session
3. If S3: Note lesson for later consolidation

### Postmortem Meeting (Operator + Agent)
1. Agent presents timeline and findings
2. Operator provides context (what they saw, what was expected)
3. Together: Identify root cause and contributing factors
4. Define prevention rules
5. Decide: Does standard/workflow change?

### Implementation
- If standard change: Create proposal, get approval, implement (follow SELF-IMPROVEMENT-POLICY.md)
- If workflow change: Discuss with Governor, implement in next phase
- Document in MEMORY.md for future reference

---

## Prevention Rule Types

### Type 1: Add/Clarify Standard
**Example**: "Re-read discipline was vague → Made it mandatory with checklist"

**Process**:
1. Update relevant standard file
2. Add checklist item if verification-related
3. All agents now follow updated standard

### Type 2: Add Automation
**Example**: "Tests weren't run immediately → Add auto-test-on-edit"

**Process**:
1. Propose automation
2. Implement in tool or workflow
3. Document in ENGINEERING-EXECUTION.md

### Type 3: Add Process Gate
**Example**: "No verification step before claiming done → Add verification gate to phase"

**Process**:
1. Update phase structure (AGENTS.md or governance)
2. Add required verification step
3. Make gate explicit in phase definition

### Type 4: Change Authority/Approval
**Example**: "Dangerous operation allowed → Now requires operator approval"

**Process**:
1. Update TOOL-USE-POLICY.md or RISK-AND-ESCALATION-STANDARD.md
2. Increase approval requirement
3. Document why authority changed

---

## Postmortem Checklist

- [ ] Incident captured with date and severity
- [ ] Timeline is clear and detailed
- [ ] Root cause identified (not "human error")
- [ ] Contributing factors listed
- [ ] Missed signals captured
- [ ] Resolution described
- [ ] Prevention rules are specific and testable
- [ ] Standard/workflow changes identified
- [ ] Changes captured in relevant files
- [ ] Lesson added to MEMORY.md
- [ ] Open questions resolved or escalated

---

## Integration with Other Standards

- **MEMORY-CONVENTIONS.md**: Lessons go into MEMORY.md
- **SELF-IMPROVEMENT-POLICY.md**: How improvements from postmortems are proposed
- **ENGINEERING-EXECUTION.md**: How stale context and verification mistakes are prevented
- **VERIFICATION-STANDARD.md**: How evidence requirements prevent false claims

**Key principle**: Every incident is a chance to learn. No incident goes to waste.

Non-negotiable: Postmortems drive system improvement. Take them seriously.
