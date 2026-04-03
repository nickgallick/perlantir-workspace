# GOVERNOR-EVIDENCE-STANDARD.md

**Purpose**: Hard rules for what counts as evidence. No inflation, no partial credit.

---

## Evidence Categories

### A: Real Evidence (Counts)

**Live API Call + Response**
- System API receives request (compile, createDecision, etc.)
- System returns response (200, 400, etc.)
- Response contains real data (decision ID, scores, context)
- Timestamps in response are recent
- Evidence: HTTP logs + response body

**State Persisted in Database**
- Decision created → queryable in decisions table
- Decision superseded → status="superseded" in DB
- Edge created → queryable in edges table
- Timestamps in DB match request timestamps
- Evidence: SELECT query result

**Downstream Effect Observable**
- State change affects next operation
- Example: decision recorded → next compile includes it with score
- Before/after outputs differ
- Difference is measurable (score, context size, decision count)
- Evidence: before/after output logs

**Specialist Used Real Context**
- Specialist received output from real compile() call
- Specialist task references decisions from that compile output
- Specialist output shows context was used (not generic)
- Evidence: task logs + context lineage

---

### B: Not Evidence (Does Not Count)

**Design Document**
- Protocol specification
- Plan
- Specification
- Why it does NOT count: design is not execution

**Markdown Log**
- Decision log (not persisted in DB)
- Context package (manually assembled, not from compile())
- Why it does NOT count: markdown is not persistence

**Roleplay**
- Governor acting as specialist
- Governor simulating system behavior
- Why it does NOT count: not real dispatch, not real system

**Partial Progress**
- "5 of 8 decisions planned" (only 0 are persisted)
- "50% complete" (evidence is 0% or 100%)
- Why it does NOT count: evidence is binary

---

## For Phase A Evidence Rubric

### A-1: ≥2 Specialist Tasks with Compiled Context

**Counts as evidence**:
- Specialist receives output from real compile() call to live Nexus
- Specialist executes assigned task
- Specialist output shows decisions from compile were used
- Governor logs: compile call + response + specialist dispatch + task outcome

**Does not count**:
- Governor acts as specialist
- Simulated context package
- Design of dispatch flow
- Markdown log of decisions

**Current Truth**: 0/2 (blocked on environment)

---

### A-2: ≥1 Real Decision from Live Work

**Counts as evidence**:
- createDecision() executes against live Nexus
- Server returns decision ID
- Decision queryable in DB (SELECT confirms)
- Decision has all required fields (title, created_at, tags, etc.)
- Record persists across sessions

**Does not count**:
- Markdown decision log
- Designed decision (in planning artifact)
- Simulated decision

**Current Truth**: 0/1 (blocked on environment)

---

### A-3: ≥1 Supersede Event Changes Compiled Context

**Counts as evidence**:
- Decision A created + persisted
- Decision B created + persisted
- Edge: A → B, type="supersedes"
- A.status = "superseded" in DB
- compile() called before supersede: returns decision A with score S1
- compile() called after supersede: returns decision A with score S2
- S1 ≠ S2 (score penalty applied)
- Log before/after outputs as evidence

**Does not count**:
- Protocol specifies supersede will work
- Algorithm says it should work
- Designed the flow

**Current Truth**: 0/1 (blocked on environment)

---

### A-4: Operator Judgment

**Counts as evidence**:
- Operator writes: "Nexus reduced friction" OR "added friction" OR "conditional on X"
- Statement is explicit, unambiguous
- Recorded in project state

**Does not count**:
- Implicit approval
- "Sounds good"
- Assumed judgment

**Current Truth**: 0/1 (not started)

---

## Evidence Status Words

**Use only these**:
- NOT STARTED (not attempted)
- BLOCKED (attempted but environment blocker prevents progress)
- IN PROGRESS (live execution happening now)
- REAL EVIDENCE COLLECTED (live-system-backed proof exists, repeatable)
- SOFT EVIDENCE (design/planning artifacts, supporting but not primary)

**Never use**:
- "Partial" (evidence is 0% or 100%)
- "On track" (say blocked or executing)
- "Soft complete" (completion is binary)
- "Will work when" (say blocked on X)
- Percentages in evidence claims (0 or 100 only)

---

**END GOVERNOR-EVIDENCE-STANDARD**
