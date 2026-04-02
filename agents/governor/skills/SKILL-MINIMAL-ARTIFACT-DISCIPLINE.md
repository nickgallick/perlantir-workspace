# SKILL-MINIMAL-ARTIFACT-DISCIPLINE.md

**Purpose**: How Governor avoids bureaucracy and ceremony. Maximum execution, minimum documentation theater.

**When to Use**: Before creating any document. When tempted to create "completion reports," "summaries," "indexes," "navigation guides," or "state preservation reports." Always question: is this artifact actually needed?

---

## The Law

**Default to zero artifacts. Only create what execution requires.**

Every artifact must earn its existence. If it doesn't support execution or provide durable state required for multi-session continuation, it doesn't exist.

---

## Artifact Types & Rules

### Tier 1: Required (Always Create These)

**1. State Files** (when work ends)
- `STATUS.md` — evidence progress, task status, risks
- `CHECKPOINT.md` — recovery point for next session
- Updated `MEMORY.md` if changes to long-term memory
- `SESSION-HANDOFF-YYYY-MM-DD.md` if multi-session work in progress
- Purpose: Multi-session continuation + state preservation
- Rule: Create only if work spans sessions or state must persist
- Size: Minimal, no summaries or ceremony

**2. Specialist Contracts** (only before dispatch)
- One file per specialist task (not one per phase)
- Contents: objective, constraints, deliverables, success criteria, timeline
- No extras: no planning summaries, no context packages, no introduction letters
- Rule: Create only when dispatching. One file, one specialist.
- Size: 1–2 pages max

**3. Decision Logs** (after decisions are recorded)
- One file that lists decisions made during the work
- Contents: decision ID, title, creator, rationale, edges
- Only if decisions are persisted in system
- Rule: Create only if actual decisions were made and recorded
- Size: Minimal, one row per decision

**4. Planning Artifacts** (only if >2 phases)
- One file: task breakdown, phases, dependencies
- No extras: no indexes, no summaries, no detailed explanations
- Rule: Create only if work is >2 phases
- Size: <10 KB

---

### Tier 2: Optional (Create Only If Explicitly Needed)

**1. Skill Files** (only for Governor behavior changes)
- Example: SKILL-LIVE-LOOP-VALIDATION.md (behavior correction requires it)
- Rule: Create only when introducing new capability to Governor
- Do not create: generic how-to docs, best-practices guides, tutorials

**2. Integration Specs** (only if >1 specialist implements against it)
- Example: PHASE-A-INTEGRATION-PROTOCOL.md (multiple specialists need it)
- Rule: Create only when spec is shared reference
- Do not create: one-off design documents, workflow diagrams

**3. Completion Reports** (NEVER)
- DO NOT CREATE: "Task 1 Completion Report"
- DO NOT CREATE: "Execution Summary"
- DO NOT CREATE: "Planning Completion Report"
- DO NOT CREATE: "State Preservation Report"
- WHY: All this information goes in STATUS.md or CHECKPOINT.md
- If you feel like creating a completion report: stop and update STATUS.md instead

**4. Index/Navigation Files** (NEVER)
- DO NOT CREATE: "Phase A Index"
- DO NOT CREATE: "PHASE-A-NAVIGATION-GUIDE"
- DO NOT CREATE: "Document Roadmap"
- WHY: Complex enough to need an index means too many artifacts (violates minimal rule)
- If you feel like creating an index: delete 80% of the artifacts instead

**5. Context Packages** (NEVER, except live system output)
- DO NOT CREATE: markdown files claiming to be "compiled context"
- DO NOT CREATE: manually assembled context documents
- ONLY CREATE: if output is from real compile() call on live system
- These are simulated evidence, not real evidence

**6. Preservation Reports** (NEVER)
- DO NOT CREATE: "State Preservation Verification Report"
- DO NOT CREATE: "Synchronization Report"
- WHY: If state is actually preserved, it speaks for itself in the files
- If you need a report to prove state was preserved, state was not preserved

**7. Summary/Overview Documents** (NEVER)
- DO NOT CREATE: "Execution Overview"
- DO NOT CREATE: "What Happened Today"
- DO NOT CREATE: summaries of other files
- WHY: Anyone can read STATUS.md and CHECKPOINT.md directly
- Summarizing introduces distortion and extra maintenance burden

---

## The Minimal Artifact Checklist

Before creating any document, ask:

1. **Is this required by Governor's operating loop or standards?**
   - Tier 1 files: YES (create it)
   - Tier 2+ files: NO (stop here)

2. **Is this a direct output of work, or a document about work?**
   - Direct output: decision logs, code, specs (create it)
   - Document about work: summaries, reports, reviews (stop here, put in STATUS.md instead)

3. **Will another session need this to resume?**
   - YES: Tier 1 state files (create it)
   - NO: Don't create it

4. **Does this document serve execution or just describe execution?**
   - Serves execution: specs, contracts, logs (create it)
   - Describes execution: reports, summaries, overviews (stop here, put in STATUS.md)

5. **If I don't create this, can someone understand the current state from STATUS.md?**
   - YES: Don't create it
   - NO: Create it as a Tier 1 file (is it actually Tier 1? Re-evaluate)

---

## What Governor Should Have Produced (Phase A, Corrected)

### Required Tier 1 (Create These)
- ✅ PHASE-A-INTEGRATION-PROTOCOL.md (spec that multiple specialists implement against)
- ✅ STATUS.md (evidence tracking, current state)
- ✅ CHECKPOINT.md (recovery point)
- ✅ MEMORY.md (updated with phase progress)

### Required Tier 2 (Create These Before Dispatch)
- ✅ PHASE-A-BACKEND-CONTRACT.md (specialist contract for Task 2, when dispatching)
- (Not needed yet: QA contract for Task 3, created before dispatching Task 3)

### Forbidden (Should Not Have Created)
- ❌ PHASE-A-EXECUTION-SUMMARY.md (summary, belongs in STATUS.md)
- ❌ PHASE-A-INDEX.md (navigation guide, violates minimal rule)
- ❌ PHASE-A-STATE-PRESERVATION-REPORT.md (report about state, state should speak for itself)
- ❌ PHASE-A-PLANNING-COMPLETION-REPORT.md (summary of planning, belongs in STATUS.md)
- ❌ PHASE-A-TASK-1-COMPLETION-REPORT.md (summary of task, belongs in STATUS.md)
- ❌ PHASE-A-ARCHITECT-CONTEXT-PACKAGE.md (not live system output, fake evidence)
- ❌ PHASE-A-DECISIONS-CREATED.md (markdown log of decisions that don't actually exist in system)
- ❌ Multiple planning artifacts, architect contracts, etc. (only one needed at a time)
- ❌ SESSION-HANDOFF (unless work spans sessions; Phase A didn't need it)

### Count
- **What I created**: 16 artifacts
- **What I should have created**: 4 artifacts
- **Excess**: 12 unnecessary artifacts (75% bloat)

---

## Minimal Phase A Redux

If Phase A is done right, it has:

```
projects/nexus-v1/
├── PHASE-A-INTEGRATION-PROTOCOL.md    (spec, required)
├── PHASE-A-BACKEND-CONTRACT.md        (contract, created before dispatch)
├── STATUS.md                          (evidence tracking)
├── CHECKPOINT.md                      (recovery point)
└── (no other Phase A-specific files)

workspace/
└── MEMORY.md                          (updated)
```

That's it. Everything else is noise.

---

## Artifact Debt Rules

**When artifacts exceed what execution requires**:

1. Governor recognizes the excess
2. Governor identifies which artifacts are theater
3. Governor marks them for deletion after Phase A completes
4. Governor does not create new artifacts until bloat is cleared
5. Governor learns the minimal discipline for next phase

**Current status**: Governor created 12 excess artifacts. After remediation, Governor will not repeat this.

---

## The Minimal Governor Dispatch

When dispatching a specialist:

**MINIMAL**:
```
Task: Phase A Task 2 (Backend)

Objective: Implement Governor SDK integration (compileForAgent, createDecision, updateDecisionStatus, listNotifications)

Constraints:
- No new Nexus features
- All existing tests must pass
- PostgreSQL required

Deliverables:
- SDK methods (4)
- Logging infrastructure (2 files)
- Tests (updated + new)
- 3 decisions logged

Timeline: Target 2026-04-04

Input: PHASE-A-INTEGRATION-PROTOCOL.md

Go.
```

**NOT MINIMAL** (what I did):
- Contract document with 8 sections
- Context package document
- Success criteria elaboration
- Review standards document
- Recovery instructions
- etc.

Minimal is better. Specialists can read a protocol. They don't need hand-holding.

---

**END SKILL-MINIMAL-ARTIFACT-DISCIPLINE**
