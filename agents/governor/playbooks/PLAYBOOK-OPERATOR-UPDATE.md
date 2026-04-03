# PLAYBOOK-OPERATOR-UPDATE.md

**Purpose**: How Governor communicates status to operator. Clear, factual, actionable.

**When to Use**: At phase boundaries, when blockers appear, when decisions are needed.

---

## Status Update Template (Phase Complete)

```
Phase [N] Complete

Deliverables:
  - [list with locations/links]

Evidence:
  - A-1: [status]
  - A-2: [count or status]
  - A-3: [status]
  - A-4: [status]

Blocker (if any):
  - [exact blocker]
  - [root cause]
  - [resolution needed]

Next Phase: [Phase N+1 description]

Decision: [what do you want to do?]
  Option 1: [proceed to Phase N+1]
  Option 2: [address blocker first]
  Option 3: [defer and skip to different phase]

Awaiting: Your approval
```

---

## Status Update Template (Blocked)

```
Phase [N] Blocked

Attempted: [operation]
Blocker: [exact blocker]

Debugging:
  Layer 1: [result]
  Layer 2: [result]
  Layer 3: [result]

Root Cause: [why it's blocked]

Examples:
  $ [command run]
  → [output showing failure]

Blocking:
  - [what cannot proceed]
  - [downstream impact]

Options:
  1. [fix the blocker]
  2. [provide alternative]
  3. [defer]

Recommendation: [Governor's suggestion]

Decision: [what do you want to do?]

Awaiting: Your approval
```

---

## Decision Update Template

```
Decision Needed

Situation: [what happened]

Options:
  1. [option A + pros/cons]
  2. [option B + pros/cons]
  3. [option C + pros/cons]

Recommendation: [Governor's preference + why]

Decision: [what direction should we take?]

Awaiting: Your choice
```

---

## Evidence Update Template

```
Evidence Status

A-1 (≥2 specialist tasks with compiled context):
  Status: [NOT STARTED | BLOCKED | IN PROGRESS | COLLECTED]
  Progress: [X/2]
  Details: [what's been collected]

A-2 (≥1 real decision from live work):
  Status: [NOT STARTED | BLOCKED | IN PROGRESS | COLLECTED]
  Progress: [X/1+]
  Details: [decision count, IDs if available]

A-3 (≥1 supersede event):
  Status: [NOT STARTED | BLOCKED | IN PROGRESS | COLLECTED]
  Progress: [X/1]
  Details: [before/after scores if collected]

A-4 (Operator judgment):
  Status: [NOT STARTED | PENDING YOUR INPUT]
  Needed: [your statement on friction reduction]

Overall: [X/4 evidence rubric items collected]

Blocker (if any): [exact]
```

---

## What NOT To Send

❌ Summaries of previous updates
❌ Recovered notes or context packages
❌ Long explanations of design work
❌ Soft language ("on track", "mostly complete", "will work when")
❌ Multiple status updates on the same topic

---

## Key Rules

1. **Be factual**: State only what is true
2. **Be exact**: Name exact blockers, exact options
3. **Be brief**: One update per decision point
4. **Be actionable**: Include "what do you decide?" clearly
5. **No soft language**: Blocked means blocked, not "delayed"

---

**END PLAYBOOK-OPERATOR-UPDATE**
