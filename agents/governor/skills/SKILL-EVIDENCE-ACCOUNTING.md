# SKILL-EVIDENCE-ACCOUNTING.md

**Purpose**: Hard rules for what counts as evidence and what does not. Prevents inflated rubric claims.

**When to Use**: Before declaring any evidence collected. When tempted to count "soft evidence" or partial credit. When reporting status. Always when dealing with success rubrics.

---

## The Law

**EVIDENCE MUST BE LIVE-SYSTEM BACKED.**

Any evidence claim without live-system proof is not evidence. It is planning, design, aspiration, or theater.

### Evidence Categories

#### ✅ REAL EVIDENCE (Counts)

**Simulated Compile Call**
- What: Real HTTP request to `/api/compile` or SDK `compileForAgent()` call
- Proof: Server response includes decision list, scores, formatted context
- Counts for: A-1 (specialist received compiled context)
- Does not count for: having designed what compile should do

**Persisted Decision**
- What: createDecision() call executes, server returns decision ID, decision queryable in database
- Proof: SELECT from decisions table returns the exact row with correct fields and timestamp
- Counts for: A-2 (real decision from live work)
- Does not count for: having written a decision in markdown

**Supersede Edge Persisted**
- What: Edge created with type="supersedes", stored in edges table, query-able
- Proof: SELECT from edges table returns edge with from_decision_id and to_decision_id
- Counts for: part of A-3
- Does not count for: having designed that supersede would happen

**Score Change Observable**
- What: Call compile() before and after supersede, parse scores from both outputs, scores differ
- Proof: Actual JSON response from compile endpoint, before score != after score, difference matches algorithm prediction
- Counts for: A-3 (supersede changes compiled context)
- Does not count for: "the algorithm says it should work"

**Specialist Used Real Context**
- What: Specialist received output from real compile() call, specialist executed task mentioning decisions from that context output
- Proof: Task output references decision IDs/titles from the compile response
- Counts for: A-1 (specialist task executed with compiled context)
- Does not count for: "the specialist was given a context package"

**Operator Judgment Recorded**
- What: Operator writes 1-2 sentences: "Nexus did X" or "Nexus did not do Y" or "Conditional on Z"
- Proof: Text in project state file with operator name/date
- Counts for: A-4
- Does not count for: asking "did it work?" without a response

---

#### ❌ FAKE EVIDENCE (Does Not Count)

**Markdown Decision Log**
- What: I write a file listing decisions with context
- Why it doesn't count: Not persisted in Nexus. No decision ID. No database entry. No persistence layer exercised.
- What you might be tempted to say: "5 decisions created"
- What's actually true: "5 decisions designed and documented in markdown"

**Simulated Context Package**
- What: I manually assemble a text document claiming to be "compiled context"
- Why it doesn't count: Never executed `compile()`. Scoring algorithm never ran. Context was not role-differentiated by the system. Not real output.
- What you might be tempted to say: "Architect received compiled context"
- What's actually true: "I created a context package and gave it to the specialist I was roleplaying"

**Design Document**
- What: Protocol specifies that compile will be called before dispatch
- Why it doesn't count: Design is not execution. Spec is not proof. "Should happen" is not "happened".
- What you might be tempted to say: "Integration points defined, therefore A-1 is on track"
- What's actually true: "Integration points designed. A-1 requires actual execution to be proven."

**Specialist Roleplay as Execution**
- What: I act as the Architect specialist and produce "task output"
- Why it doesn't count: Not a real specialist. No real dispatch. No real compilation of context for that specialist. Theater.
- What you might be tempted to say: "Task 1 executed, specialist received context"
- What's actually true: "Task 1 was designed and roleplay-executed"

**Partial Credit Claims**
- What: "Well, we have the protocol designed and we have context package, so A-1 is 50% done"
- Why it doesn't count: A-1 is binary (task executed with real context OR it didn't). No partial credit.
- What's actually true: "Protocol exists. A-1 is 0% done. Blockers prevent execution."

---

## Hard Rules for Phase A Evidence

### A-1: ≥2 Specialist Tasks with Compiled Context

**WHAT COUNTS**:
- Specialist receives output from real `compile()` call to live Nexus server
- Specialist executes assigned task using that context
- Specialist output references decisions from the compiled context
- Governor logs: compile request, context returned, specialist received, specialist task outcome
- Repeatable: another session could verify the same flow

**WHAT DOES NOT COUNT**:
- ❌ A context package created in markdown
- ❌ A specialist roleplay where I act as both Governor and specialist
- ❌ Design of the dispatch flow (even if complete and correct)
- ❌ Partial credit ("50% complete because protocol is designed")

**Current Status (Truth)**: A-1 = NOT STARTED (no specialist dispatch with real context executed)

---

### A-2: ≥1 Real Decision from Live Work

**WHAT COUNTS**:
- createDecision() executes against live Nexus server
- Server validates input, generates UUID, persists to decisions table
- Decision ID is returned from server
- Decision is queryable in the database
- Decision has all required fields (title, made_by, status, tags, created_at, etc.)
- Repeatable: another session could query that decision back

**WHAT DOES NOT COUNT**:
- ❌ A decision listed in a markdown file
- ❌ "5 decisions designed and documented"
- ❌ "Decisions will be created during Task 2"
- ❌ Partial credit ("5 decisions planned, so A-2 is 5/8 complete")

**Current Status (Truth)**: A-2 = NOT STARTED (no decision persisted in Nexus)

---

### A-3: ≥1 Supersede Event Changes Compiled Context

**WHAT COUNTS**:
- Decision A created (persisted in DB)
- Decision B created that supersedes A (edge persisted, A.status = "superseded")
- compile() called for a role that includes A in its context (score returned for A)
- First compile output shows A with full score (e.g., 0.8)
- Second compile output shows A with penalty (0.4 = superseded)
- Score difference is observable and matches algorithm prediction
- Before/after outputs are logged as evidence

**WHAT DOES NOT COUNT**:
- ❌ "The protocol specifies supersede will work"
- ❌ "The scoring algorithm says superseded decisions get 0.4"
- ❌ "I designed the supersede scenario"
- ❌ Partial credit ("Backend will create supersede, so A-3 is pending")

**Current Status (Truth)**: A-3 = BLOCKED (cannot persist decisions or run compile without DB)

---

### A-4: Operator Judgment

**WHAT COUNTS**:
- Nick writes: "Nexus reduced friction" OR "Nexus added friction" OR "Conditional on X"
- Statement is explicit and unambiguous
- Statement is recorded in project state file

**WHAT DOES NOT COUNT**:
- ❌ "Probably reduced friction based on design"
- ❌ "I assume it will work as designed"
- ❌ Partial credit ("3/4 evidence collected, so operator will probably approve")

**Current Status (Truth)**: A-4 = NOT STARTED (depends on A-1, A-2, A-3 actually being proven)

---

## Inflation Prevention Rules

**You cannot claim evidence for**:
- Design work (even if excellent)
- Planning artifacts (even if complete)
- Specialist contracts (even if detailed)
- Context packages (even if well-formatted)
- Markdown decision logs (even if well-structured)
- Roleplay execution (even if thorough)

**You can only claim evidence for**:
- Actual system calls to live services
- Actual state changes in databases
- Actual responses from APIs
- Actual downstream effects observed
- Repeatable, verifiable proof

---

## Status Reporting Honesty

**DO THIS**: When reporting status, use only these terms:

- **NOT STARTED**: Evidence has not been collected. Blocker or not yet executed.
- **BLOCKED**: Execution attempted but system blocker prevents progress. (Always name the blocker.)
- **IN PROGRESS**: Live execution is happening; evidence is being collected in real-time.
- **REAL EVIDENCE COLLECTED**: Live-system-backed proof exists. Repeatable. Verifiable.

**DO NOT USE**: 
- ❌ "Partial progress" (evidence is binary)
- ❌ "On track" (not a status, vague)
- ❌ "Mostly complete" (evidence is binary)
- ❌ "Soft complete" (not evidence)
- ❌ Percentages in evidence rubric (0% or 100%, nothing in between)

---

## Examples of Honest Status Reporting

### Bad (Inflation)
```
A-1: 1/2 (Architect received context package, Backend task ready to dispatch)
A-2: 5/8 (5 decisions documented in markdown)
```

### Honest (Truth)
```
A-1: NOT STARTED (compile() not executed, specialist dispatch not attempted)
A-2: NOT STARTED (no decision persisted in Nexus)
A-3: BLOCKED (requires A-2 first, and PostgreSQL unavailable)
A-4: NOT STARTED (depends on A-1, A-2, A-3)

Blocker: PostgreSQL unavailable in container environment.
```

---

**END SKILL-EVIDENCE-ACCOUNTING**
