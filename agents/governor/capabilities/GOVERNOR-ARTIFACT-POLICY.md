# GOVERNOR-ARTIFACT-POLICY.md

**Purpose**: Hard rules on what artifacts to create. Default to zero, justify any creation.

---

## Artifact Tiers

### Tier 1: Always Create (Required)

**State Files** (when work persists across sessions or needs recovery):
- `STATUS.md` — evidence progress, task status, risks
- `CHECKPOINT.md` — recovery point for multi-session continuation
- `MEMORY.md` (update only if long-term memory changed)

**Specialist Contracts** (only when dispatching a task):
- One file per specialist
- 5 required elements: objective, constraints, deliverables, success criteria, timeline
- 1 page maximum
- Created immediately before dispatch, deleted/archived after completion if not needed for record

**Specifications** (only if >1 specialist will implement against it):
- Example: protocol spec that multiple engineers follow
- Not needed for single-specialist tasks

---

### Tier 2: Create Only If Explicitly Needed

**Capability Files** (for Governor behavior changes):
- Like GOVERNOR-OPERATING-MODEL.md
- Create only when introducing new foundational capability
- Reference in AGENT.md

**Skill Files** (for specific techniques):
- Like SKILL-LIVE-LOOP-VALIDATION.md
- Create only when skill is reusable across projects
- Reference in AGENT.md

**Playbooks** (for multi-step workflows):
- Like PLAYBOOK-FIRST-LIVE-LOOP.md
- Create only for workflows that repeat or are complex
- Reference in AGENT.md

**Checklists** (for verification gates):
- Like CHECKLIST-EVIDENCE-VALIDITY.md
- Create only if gates happen repeatedly
- Reference in AGENT.md

---

### Tier 3: Never Create

**❌ Completion Reports** — Information goes in STATUS.md
**❌ Execution Summaries** — Information goes in STATUS.md
**❌ Planning Completion Documents** — Information goes in STATUS.md
**❌ Index/Navigation Files** — If you need an index, delete 80% of artifacts
**❌ Context Packages** — Only real system output counts
**❌ Decision Logs** — Decisions live in DB, not markdown
**❌ State Preservation Reports** — State should speak for itself
**❌ Preservation Verification Documents** — If state is preserved, it's verifiable without a report
**❌ Summaries of Other Files** — Readers can read the original

---

## Artifact Decision Tree

Before creating any document:

```
1. Is this required by Governor standards or operating rules?
   → YES: Create it (Tier 1)
   → NO: Continue

2. Will another session need this to resume work?
   → YES: Create it (Tier 1 state file)
   → NO: Continue

3. Is this output of work, or a document about work?
   → Output (code, spec, decision): Create it
   → About work (summary, report, review): Do not create, put in STATUS.md instead
   → NO: Continue

4. Does this document serve execution or describe execution?
   → Serves (specs, contracts, skills): Consider creating (Tier 2)
   → Describes (reports, summaries, overviews): Do not create

5. If I don't create this, will someone understand current state from STATUS.md?
   → YES: Do not create
   → NO: Re-evaluate if it's actually Tier 1 or Tier 2

If still uncertain: do not create.
```

---

## Artifact Lifecycle

**Creation**:
- Create only when required
- Name clearly (use FUNCTION or PROJECT in filename)
- Add to appropriate tier directory

**Update**:
- Update only when state changes
- Update STATUS.md with summary of change
- No unnecessary maintenance burden

**Archival/Deletion**:
- Governor v1 artifacts → `ARCHIVE-GOVERNOR-V1-NOTES.md`
- Ceremony artifacts (reports, summaries, indexes) → delete
- Specialist contracts after phase → archive or delete
- Obsolete skills/playbooks → delete

---

## Examples

### ✅ Correct: Minimal Artifacts

```
agents/governor/
  AGENT.md (rewritten, concise)
  capabilities/
    GOVERNOR-OPERATING-MODEL.md (required foundation)
    GOVERNOR-EVIDENCE-STANDARD.md (required standard)
    ...
  skills/
    SKILL-LIVE-LOOP-VALIDATION.md (reusable technique)
    ...
  playbooks/
    PLAYBOOK-FIRST-LIVE-LOOP.md (multi-step workflow)
    ...
  checklists/
    CHECKLIST-EVIDENCE-VALIDITY.md (verification gate)
    ...

projects/nexus-v1/
  STATUS.md (evidence + state)
  CHECKPOINT.md (recovery point)
  PHASE-A-INTEGRATION-PROTOCOL.md (spec for implementation)
  PHASE-A-LIVE-LOOP-PLAN.md (execution procedure)
  PHASE-A-BACKEND-CONTRACT.md (specialist contract, when dispatching)
```

**Total: ~25 files**

### ❌ Wrong: Ceremony and Bloat

```
[Above], plus:
  PHASE-A-EXECUTION-SUMMARY.md (describes work, not needed)
  PHASE-A-INDEX.md (navigation guide, not needed)
  PHASE-A-STATE-PRESERVATION-REPORT.md (state should speak for itself)
  PHASE-A-PLANNING-COMPLETION-REPORT.md (summary in STATUS.md)
  PHASE-A-ARCHITECT-CONTEXT-PACKAGE.md (fake evidence)
  PHASE-A-DECISIONS-CREATED.md (markdown log, not DB)
  And 10 more...
```

**Total: 35+ files (40% bloat)**

---

**END GOVERNOR-ARTIFACT-POLICY**
