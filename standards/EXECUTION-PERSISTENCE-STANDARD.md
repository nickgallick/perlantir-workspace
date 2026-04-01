# EXECUTION-PERSISTENCE-STANDARD.md

## Purpose and Core Principle

Governor MUST maintain durable on-disk execution state during all active project work. Live chat memory is volatile and MUST NOT be relied upon for execution continuity. If a session crashes, freezes, restarts, or loses thread context, execution state must be fully recoverable from disk alone.

The live execution ledger is `workspace/projects/[project]/CHECKPOINT.md`. It is written continuously at mandatory trigger points — not summarized at session end.

### Template vs. Live File

```
workspace/projects/.template/CHECKPOINT.md
  = seed template only
  = never written during execution
  = never read by Bootstrap Stage 2.5
  = never treated as a project's execution state

workspace/projects/[project]/CHECKPOINT.md
  = live execution ledger for that specific project
  = sole authoritative source of execution state for recovery
  = Bootstrap Stage 2.5 scans workspace/projects/[project]/ paths only
  = MUST NOT scan or load the .template/ directory
```

---

## Section 1: Source-of-Truth Rule

```
CHECKPOINT.md = authoritative live execution state during active work
STATUS.md     = human-readable project status for reporting and review
DECISIONS.md  = decision log; not authoritative for live execution state
```

### Divergence Protocol

If CHECKPOINT.md and STATUS.md conflict on any field (phase, status, completed work, blockers):

1. Report discrepancy explicitly in Recovery Summary
2. Treat CHECKPOINT.md as governing for all recovery decisions
3. Flag STATUS.md as potentially stale
4. Offer to sync STATUS.md after operator confirms CHECKPOINT state
5. Never silently reconcile; always surface the divergence

---

## Section 2: CHECKPOINT.md Schema

Every live CHECKPOINT.md MUST contain all fields below. No omissions.

### 2.1 — Schema and Provenance Block

```
schema-version      : [semver — e.g., 1.0.0]
checkpoint-id       : [UUID or monotonic counter — unique per write]
prior-checkpoint-id : [ID of previous write, or "GENESIS" if first]
last-writer         : [Governor | SpecialistName]
last-updated        : [YYYY-MM-DD HH:MM:SS UTC]
active-owner        : [Governor | SpecialistName currently responsible]
lock-status         : [UNLOCKED | LOCKED-BY: name | CONFLICT]
```

### 2.2 — Project and Phase Block

```
project             : [project name]
phase               : [current approved phase name and number]
approval-category   : [0 | 1 | 2 | 3]
approval-phrase     : "[exact verbatim approval phrase]"
approval-timestamp  : [YYYY-MM-DD HH:MM:SS UTC]
approved-scope      : [one-line exact scope summary]
approval-freshness  : [FRESH <24h | AGING 24–72h | STALE >72h | EXPIRED: reason]
lifecycle           : [CREATED | ACTIVE | FROZEN | ARCHIVED | IGNORED]
status              : [IN-PROGRESS | BLOCKED | AWAITING-APPROVAL | COMPLETE]
session-termination : [CLEAN | INTERRUPTED | UNKNOWN]
recovery-mode       : [NORMAL | RECOVERY | DEGRADED | BLOCKED]
```

### 2.2a — Lock Enforcement

**If lock-status = UNLOCKED**:
Governor may proceed normally.

**If lock-status = LOCKED-BY: [OtherAgent]**:
- Governor MUST NOT write to CHECKPOINT.md
- Governor MUST NOT execute any work on this project
- Governor MUST report: "Project [name] is locked by [OtherAgent]. Awaiting release."
- Governor MAY check if lock is stale (see below)
- Governor MUST escalate to operator if lock cannot be resolved automatically

**Stale lock detection**:
If lock-status = LOCKED-BY: [agent] AND last-updated > 30 minutes ago:
- Governor MAY classify lock as stale
- Governor MUST report: "Lock by [agent] appears stale (last updated [N] min ago)."
- Governor MUST NOT clear the lock unilaterally
- Governor MUST ask operator: "Authorize lock release for [project]?"
- Only after explicit operator authorization: clear lock, set lock-status = UNLOCKED, log to Human Override Log with timestamp and authorization text

**If lock-status = CONFLICT**:
- Governor MUST NOT proceed with any execution on this project
- Governor MUST report: "CHECKPOINT conflict detected for [project]. Manual resolution required."
- Governor MUST present both competing lock claims if identifiable
- Governor MUST NOT auto-resolve
- Governor MUST set project recovery-mode = BLOCKED
- Operator must resolve conflict before Governor may proceed

### 2.3 — Objective and State Fields

Each of the 7 critical fields carries its own confidence classification:

```markdown
## Objective
[One sentence: what this phase is trying to accomplish]
confidence      : [VERIFIED | INFERRED | UNKNOWN]
evidence-source : [file path, approval phrase, or "none"]
last-verified   : [YYYY-MM-DD HH:MM:SS UTC | "never"]

## Completed Work
- [x] [Deliverable] — [YYYY-MM-DD HH:MM:SS UTC]
  evidence-source     : [file path | test output | review]
  files-touched       : [list]
  verification-class  : [docs | code | config | infra | external-claims | legal-guidance]
  verification-status : [VERIFIED | PARTIAL | UNVERIFIED]
  last-verified       : [YYYY-MM-DD HH:MM:SS UTC]
confidence      : [VERIFIED | INFERRED | UNKNOWN]

## In-Progress Work
[Current task: what is done, what remains]
confidence      : [VERIFIED | INFERRED | UNKNOWN]
evidence-source : [basis for this claim]
last-verified   : [YYYY-MM-DD HH:MM:SS UTC]

## Next Exact Action
[Single specific next step — sufficient detail to execute without asking]
confidence      : [VERIFIED | INFERRED | UNKNOWN]
evidence-source : [basis]
last-verified   : [YYYY-MM-DD HH:MM:SS UTC]

## Blockers
[Blocker | impact | options | waiting-on | status]
confidence      : [VERIFIED | INFERRED | UNKNOWN]
evidence-source : [basis]
last-verified   : [YYYY-MM-DD HH:MM:SS UTC]

## Pending Approvals
[What is pending | proposed-since | exact proposal summary]
confidence      : [VERIFIED | INFERRED | UNKNOWN]
evidence-source : [basis]
last-verified   : [YYYY-MM-DD HH:MM:SS UTC]
```

### Field Confidence Definitions

**VERIFIED**: Field value was explicitly written by Governor at a mandatory write trigger. Evidence is in the checkpoint (timestamp, approval phrase, or deliverable marker). Governor MAY act on VERIFIED fields without re-confirmation.

**INFERRED**: Field value was not written directly but can be reconstructed from completed work log, file timestamps, or adjacent fields. Governor MUST label as inferred in all output and MUST NOT act without operator confirmation.

**UNKNOWN**: Field is missing, contradicted by drift, corrupted, or last written with incomplete evidence. Governor MUST ask operator to confirm before resuming.

**INITIALIZATION NOTE**: Template placeholders (e.g., `[project name]`, `[phase]`) are NOT the same as UNKNOWN confidence. UNKNOWN is a runtime recovery classification meaning the field value cannot be determined from available persisted evidence. A freshly instantiated CHECKPOINT.md before phase-open (Trigger 0) has no confidence classifications at all — the schema exists but no state has been written. After Trigger 0, all fields are set to VERIFIED with the phase-open data. If a field is later found unresolvable during recovery, Governor sets it to UNKNOWN at that point based on evidence, not because the field was blank in the template.

### Session Termination Status

**CLEAN**: Governor wrote an explicit session-end update (Trigger 6) before closing. All fields written at session close are VERIFIED.

**INTERRUPTED**: Last write was mid-execution. No session-end write is present or session-termination field was never set to CLEAN.

**UNKNOWN**: CHECKPOINT.md exists but session-termination field is missing or malformed. Cannot determine whether prior session ended cleanly.

### 2.4 — Files Touched This Phase

```
| File | Change | Verification Class | Verified? | Timestamp UTC |
|------|---------|--------------------|-----------|---------------|
| [path] | [created/edited/deleted] | [docs|code|config|infra|external-claims|legal-guidance] | [yes/partial/no] | [timestamp] |
```

### 2.5 — Rollback Anchor

```
last-clean-boundary       : [checkpoint-id of last SAFE state]
last-clean-timestamp      : [YYYY-MM-DD HH:MM:SS UTC]
files-touched-since-clean : [list]
rollback-recommendation   : [SAFE-TO-ROLLBACK | CAUTION: reason | UNSAFE: reason]
```

### 2.6 — Decision Provenance Log

```
| Decision-ID | Summary | Made-By | Timestamp UTC | Why | Alternatives-Rejected | Affected-Files |
```

### 2.7 — Assumption Ledger

```
| Assumption | Confidence | Invalidation-Condition | Confirmation-Required |
```

### 2.8 — Dependency State

```
Upstream:
  [dependency | type | verified-status | last-checked]
Downstream:
  [dependent | type | impact-if-blocked]
Blocked-by:
  [blocker | blocking-since | resolution-path]
```

### 2.9 — Deliverable Boundary Map

```
Completed deliverables:
  [deliverable | verified | safe-resume-point: YES/NO]
Partial deliverables:
  [deliverable | what-is-done | what-remains | resume-safe: YES/CAUTION/NO]
Forbidden partial states:
  [description: why this state must never be left incomplete]
Safe resume points:
  [exact description of state from which Governor may resume cold]
```

### 2.10 — Field Confidence Summary

```
| Field              | Confidence | Evidence Source        | Last Verified UTC    |
|--------------------|------------|------------------------|----------------------|
| phase              |            |                        |                      |
| objective          |            |                        |                      |
| completed-work     |            |                        |                      |
| in-progress-work   |            |                        |                      |
| next-exact-action  |            |                        |                      |
| blockers           |            |                        |                      |
| pending-approvals  |            |                        |                      |
```

### 2.11 — Resume Safety Classification

```
resume-safety : [SAFE | CAUTION | UNSAFE]
basis         : [specific reason]
```

```
SAFE    = all 7 fields VERIFIED
          AND session-termination = CLEAN
          AND no filesystem drift detected
          AND approval-freshness ≠ STALE or EXPIRED

CAUTION = ≥1 field INFERRED (none UNKNOWN)
          OR session-termination = INTERRUPTED with recoverable state
          OR minor drift (VERIFIED→INFERRED only)
          OR approval-freshness = AGING

UNSAFE  = any field UNKNOWN
          OR session-termination = UNKNOWN
          OR drift downgraded any field to UNKNOWN
          OR last-updated >72h with incomplete work
          OR forbidden partial state detected
          OR approval-freshness = STALE or EXPIRED
          OR scope breach detected
          OR lock-status = CONFLICT
```

### 2.12 — Filesystem Drift

```
| File | Checkpoint Timestamp | Actual Modified Time | Delta | Confidence Impact |
```
`"none detected"` if clean.

### 2.13 — Human Override Log

```
| Timestamp UTC | Operator Authorization (verbatim) | Reason | Accepted Consequences |
```
`"none"` if no overrides this phase.

### 2.14 — Failure Pattern Log

```
| Timestamp UTC | Failure Class | Description | Standards Upgrade Warranted? |
```
Failure classes: `crash | freeze | partial-write | stale-approval | checkpoint-drift | contradiction | scope-breach | unknown`

### 2.15 — Session Termination History

```
| Session Date UTC   | Termination Status  | Last Checkpoint ID | Last Action Written |
```

---

## Section 3: Artifact Verification Classes

Each file in the files-touched table MUST be tagged with its verification class. Different classes carry different verification requirements:

```
docs/prompts      — Read-through + scope check + link check
code              — Syntax + lint + type-check + tests + code review
config            — Parse/validate + reference check + example test
infra             — Dry-run + security scan + rollback verified
external-claims   — Source citation + date + authority classification
legal-guidance    — Scope limited to guidance-only; attorney confirmation noted
```

Governor MUST apply the verification bar appropriate to the class before marking a deliverable as VERIFIED.

---

## Section 4: Mandatory Write Triggers

These are mandatory writes. Missing a write trigger is a protocol violation.

### Trigger 0 — Phase Open
**When**: Immediately after operator issues approval phrase for a new phase.
**Write**: Full schema and provenance block; verbatim approval phrase; objective; empty state fields; all field confidences = VERIFIED (clean start); session-termination = UNKNOWN; lifecycle = ACTIVE; initialize deliverable boundary map.
**Constraint**: No execution work may begin before Trigger 0 is written and re-read verified.

### Trigger 1 — Before Any Risky Change (Category 2 or 3)
**When**: Before touching any file in a Category 2 or 3 risk operation.
**Write**: Full current-state snapshot. Update rollback anchor to this checkpoint-id.

### Trigger 2 — After Each Deliverable Completed
**When**: After each file created, each task finished, each section complete.
**Write**: Move deliverable from in-progress → completed (with timestamp). Include evidence source, verification class, verification status. Update next-exact-action. Run scope-breach check (Section 9a). Update rollback anchor if state is clean.

### Trigger 3 — After Any Blocker Detected
**When**: Immediately upon identifying a blocker.
**Write**: Blocker with full detail. Set blockers confidence = VERIFIED.

### Trigger 4 — After Files Are Touched
**When**: After any write or edit to workspace files.
**Write**: Append to files-touched table with change type, verification class, verification status, timestamp.

### Trigger 5 — After Pending Approval Created
**When**: When Governor issues a proposal or requests approval.
**Write**: Pending approval with verbatim proposal summary and proposed-since timestamp. Set pending-approvals confidence = VERIFIED.

### Trigger 6 — Before Ending Session
**When**: Before any clean session end.
**Write**: Final state snapshot. All field confidences updated. Deliverable boundary map updated. Set session-termination = CLEAN. Append to Session Termination History.

### Trigger 7 — Phase Close
**When**: Immediately after all deliverables for a phase are verified complete.
**Write**: Phase COMPLETE. All completed deliverables listed with evidence. Verification evidence noted. In-progress cleared. Status = COMPLETE. Set lifecycle = FROZEN. Freeze rollback anchor.

**Phase-close sync check** (mandatory at Trigger 7):
After writing COMPLETE, Governor MUST check:
1. **STATUS.md**: If last-modified timestamp predates phase-open timestamp → Report: "STATUS.md appears stale relative to this phase. Recommend sync before opening next phase."
2. **DECISIONS.md**: If any decision in the Decision Provenance Log has no corresponding entry in DECISIONS.md → Report: "DECISIONS.md may be missing [N] decisions from this phase. Recommend sync before opening next phase."

These are recommendations, not blocks, unless operator has configured either file as a hard gate. Include sync recommendations in phase-close summary.

### Trigger 8 — After Crash Recovery
**When**: After Governor recovers from INTERRUPTED or UNKNOWN state and operator has confirmed fields.
**Write**: Recovery summary. All confirmed vs. inferred vs. unknown fields. Operator confirmations verbatim with timestamps. Failure class in Failure Pattern Log. Updated confidence levels. Session Termination History updated.

### Trigger 9 — After Human Override
**When**: When operator authorizes degraded operation or resume under limitation.
**Write**: Human Override Log entry: timestamp, exact authorization text (verbatim), reason, accepted consequences.

### Atomic Write Discipline
Every write MUST be a complete coherent state. After writing, Governor MUST re-read the written section to verify it was applied correctly. Governor MUST NOT leave partial checkpoint state unverified. A partial write that is detected must be immediately reported and completed before execution continues.

---

## Section 5: Confidence Decay

Verified state does not remain verified indefinitely. Decay rules by state type:

```
Approval phrase         → FRESH <24h; AGING 24–72h; STALE >72h
                          STALE treated as INFERRED for recovery decisions
Completed deliverables  → VERIFIED until filesystem drift detected; then INFERRED
In-progress work        → VERIFIED for current session only;
                          INFERRED after CLEAN restart;
                          UNKNOWN after INTERRUPTED or UNKNOWN termination
Next exact action       → VERIFIED for current session;
                          INFERRED after CLEAN restart;
                          UNKNOWN after INTERRUPTED or >24h without update
Blockers               → VERIFIED until explicitly resolved or >72h without update
Pending approvals      → VERIFIED until received or expired;
                          INFERRED if >72h without acknowledgment
Active assumptions     → VERIFIED when confirmed by operator;
                          decay to INFERRED after conditions change
Dependencies           → VERIFIED when explicitly checked;
                          decay to INFERRED after >48h without re-check
```

---

## Section 6: Filesystem Drift Detection

After loading CHECKPOINT.md, Governor MUST:

1. Note `last-updated` timestamp
2. Scan all files in files-touched table: compare actual last-modified to `last-updated`
3. Scan project directory for untracked files not in files-touched table

### Drift Classification

```
File modified after last-updated     → VERIFIED → INFERRED; INFERRED → UNKNOWN
Untracked core project file found    → Downgrade completed-work confidence one level
Untracked non-core file found        → INFO only; no confidence impact
File marked complete in checkpoint   → File now missing → CONTRADICTION (Section 8)
File marked untouched in checkpoint  → File modified → Drift report + confidence downgrade
```

All drift findings written to Filesystem Drift section at Trigger 8. Reported in Recovery Summary.

---

## Section 7: CHECKPOINT.md Instantiation Rule (Binding)

As soon as any project enters approved execution — immediately after operator issues a valid approval phrase — Governor MUST:

1. Check whether `workspace/projects/[project]/CHECKPOINT.md` exists
2. **If it does NOT exist**:
   - Copy `workspace/projects/.template/CHECKPOINT.md` to `workspace/projects/[project]/CHECKPOINT.md`
   - Do NOT execute any work before this copy is complete and verified
   - Verify the file was created (re-read it)
3. **If it DOES exist with lifecycle = FROZEN** (prior phase complete):
   - Retain the file; update schema for new phase at Trigger 0
   - Do NOT overwrite prior phase history
4. Fire Trigger 0 (Phase Open) immediately after instantiation is confirmed
5. Only after Trigger 0 is written and verified may execution begin

**Violation**: Executing any work before CHECKPOINT.md is instantiated and Trigger 0 is written is a protocol violation. Governor must detect and report this violation during recovery if it occurs.

---

## Section 8: Recovery Protocol

### Step 1 — Bootstrap Completes
Full standard bootstrap runs per BOOTSTRAP.md. Recovery begins at Stage 2.5.

### Step 2 — Checkpoint Scan (Bootstrap Stage 2.5)
Scan `workspace/projects/[project]/CHECKPOINT.md` for each project directory.
**MUST NOT scan `workspace/projects/.template/`.**

For each found with lifecycle ≠ ARCHIVED and lifecycle ≠ IGNORED and status ≠ COMPLETE:
- Load fully
- Check lock-status (apply lock enforcement per Section 2.2a before any further processing)
- Read session-termination field
- Run filesystem drift detection (Section 6)
- Apply confidence decay rules (Section 5)
- Classify all 7 fields
- Detect contradictions (Section 9)
- Check non-resumable conditions (Section 10)
- Derive resume safety classification
- Determine recovery mode
- Queue for Recovery Summary

**Project-level blocking scope**:

An unreadable or invalid CHECKPOINT.md blocks recovery for THAT PROJECT ONLY.

Governor MAY proceed with other active projects if and only if:
- No shared dependency exists between the blocked project and the proceeding project (check dependency state sections)
- No shared approval surface exists (both projects not under same phase approval)
- Governor has explicitly reported the blocked project in Recovery Summary

Governor MUST report: `"Project [X] is BLOCKED. Proceeding with [Y] — no shared dependency or approval surface confirmed."`

If shared dependency or shared approval surface exists: Governor MUST NOT proceed with any project until the blocked project is resolved. Governor MUST report which dependency or approval creates the coupling.

### Step 3 — Active Work Determination

- **ACTIVE**: CHECKPOINT.md exists, status ≠ COMPLETE, phase not empty
- **STALE**: last-updated >72h and IN-PROGRESS → all fields decay per Section 5
- **RECOVERING**: session-termination = INTERRUPTED or UNKNOWN → CAUTION or UNSAFE minimum; never SAFE

### Step 4 — State Classification
Per Section 2, field by field. Apply drift downgrades first, then decay rules. Derive resume safety.

### Step 5 — Recovery Mode Assignment

```
NORMAL    = resume-safety SAFE; no unknowns; no drift; CLEAN prior session
RECOVERY  = resume-safety CAUTION; some INFERRED fields; INTERRUPTED prior session
DEGRADED  = some fields UNKNOWN; operator confirmation in progress
BLOCKED   = resume-safety UNSAFE; non-resumable condition detected; rollback or operator decision required
```

Governor behavior changes by mode:
- **NORMAL**: Proceed directly to next exact action
- **RECOVERY**: Ask minimum targeted questions (Section 11); await confirmation; then proceed
- **DEGRADED**: Ask targeted questions; await confirmation; reassess; may proceed or escalate
- **BLOCKED**: Do not proceed. Present rollback anchor and operator options only.

### Step 6 — Recovery Summary
Print Recovery Summary (Section 12, Template 2) before any other output. Recovery mode MUST be stated at the top.

### Step 7 — Re-Approval Gate

**Re-approval REQUIRED if**:
- Resume safety = UNSAFE
- Approval-freshness = STALE or EXPIRED
- Approval phrase UNKNOWN or missing
- Operator explicitly requests re-confirmation

**Re-approval NOT required if**:
- Resume safety = SAFE
- Resume safety = CAUTION with INFERRED-only fields confirmed by operator
- Phase is at a clean deliverable boundary

### Step 8 — Resume
Only after all UNKNOWN fields confirmed or waived by operator. Resume from `next-exact-action`. Do not re-execute completed work. Do not re-propose VERIFIED pending approvals.

---

## Section 9: Contradiction Handling

### Contradiction 1 — Checkpoint says complete; file missing
```
Downgrade completed-work: VERIFIED → UNKNOWN
Report: "Deliverable [X] marked complete but file not found at [path]"
Action: Require operator to confirm — re-create, skip, or rollback
MUST NOT: Claim deliverable is done
```

### Contradiction 2 — Checkpoint says untouched; file changed
```
Downgrade relevant field confidence
Report: "File [X] modified after last checkpoint. Checkpoint expected no change."
Action: Present actual vs. expected state; require confirmation before proceeding
MUST NOT: Ignore the discrepancy
```

### Contradiction 3 — Checkpoint says pending approval; deliverable already exists
```
Report: "Pending approval for [X] but deliverable already exists at [path]"
Action: Ask operator whether approval was given outside recorded channels
Options: A) Record retroactive approval; B) Treat deliverable as unauthorized
MUST NOT: Auto-resolve; operator decision required
```

---

## Section 9a: Scope Breach Detection

At every Trigger 2 (deliverable complete) and Trigger 7 (phase close), Governor MUST compare:
- `approved-scope` field in CHECKPOINT.md
- Actual `files-touched` table

**If files-touched contains files or directories outside approved scope**:

Governor MUST:
1. Halt further execution immediately
2. Report: `"Scope breach detected. Files touched beyond approved scope: [list]"`
3. Record breach in Failure Pattern Log with class = `scope-breach`
4. Set status = BLOCKED, recovery-mode = BLOCKED

Governor MUST NOT:
- Continue execution and report the breach later
- Assume scope implicitly covered out-of-scope files
- Self-authorize scope expansion

**Operator resolution options**:
- A) Ratify scope expansion retroactively (counts as new approval; logged with timestamp and verbatim authorization)
- B) Roll back out-of-scope files to last clean boundary
- C) Redefine scope for new phase and start fresh

---

## Section 10: Non-Resumable State Detection

Governor MUST NOT resume and MUST enter BLOCKED mode if any of the following:

```
NR-1: Any field confidence = UNKNOWN AND operator has not confirmed it
NR-2: resume-safety = UNSAFE AND no rollback anchor available
NR-3: Forbidden partial state detected (defined in deliverable boundary map)
NR-4: Contradiction detected that operator has not resolved
NR-5: Approval phrase UNKNOWN or EXPIRED and work is Category 2+
NR-6: Filesystem drift downgraded ≥3 fields to UNKNOWN
NR-7: last-clean-boundary > 72h ago with no CLEAN session termination since
NR-8: Scope breach detected and not yet resolved by operator
NR-9: lock-status = CONFLICT
```

When BLOCKED:
- Present rollback anchor: last-clean-boundary checkpoint-id + rollback-recommendation
- Present operator options: rollback to clean boundary / re-run phase / provide context to resolve
- Do not execute. Do not propose. Await operator decision.

---

## Section 11: Recovery Questioning Discipline

Governor MUST:
1. Ask the **minimum number** of targeted questions to resume
2. Prioritize **highest-leverage questions first** (unknowns that block the most next actions)
3. Never ask a question whose answer is already VERIFIED in checkpoint or workspace files
4. Group related questions into a single structured ask, not individual messages
5. For each question, specify exactly what it unblocks

**Format**:
```
Confirmation required before resuming:

Q1: [Specific question — unlocks: field X, field Y]
Q2: [Specific question — unlocks: field Z]

These are the only unknowns blocking clean resumption.
```

---

## Section 12: Output Templates

### Template 1: CHECKPOINT.md
See Section 2 for the full schema. Instantiated from `workspace/projects/.template/CHECKPOINT.md`.

---

### Template 2: Recovery Summary

```
══════════════════════════════════════════════════════════════════
GOVERNOR RECOVERY SUMMARY
Session       : [YYYY-MM-DD HH:MM UTC+X]
Recovery Mode : [NORMAL | RECOVERY | DEGRADED | BLOCKED]
══════════════════════════════════════════════════════════════════

PROJECT: [Name]
  Prior session     : [CLEAN | INTERRUPTED | UNKNOWN]
  Checkpoint age    : [FRESH <1h | RECENT <24h | STALE <72h | EXPIRED >72h]
  Lifecycle         : [ACTIVE | FROZEN | ARCHIVED]
  Status            : [IN-PROGRESS | BLOCKED | AWAITING-APPROVAL]
  Approval          : "[verbatim phrase]" — [FRESH | AGING | STALE | EXPIRED]
  Lock status       : [UNLOCKED | LOCKED-BY: name | CONFLICT | stale lock: details]

  FIELD CONFIDENCE:
    phase              : [VERIFIED | INFERRED | UNKNOWN] — [evidence source]
    objective          : [VERIFIED | INFERRED | UNKNOWN] — [evidence source]
    completed-work     : [VERIFIED | INFERRED | UNKNOWN] — [evidence source]
    in-progress-work   : [VERIFIED | INFERRED | UNKNOWN] — [evidence source]
    next-exact-action  : [VERIFIED | INFERRED | UNKNOWN] — [evidence source]
    blockers           : [VERIFIED | INFERRED | UNKNOWN] — [evidence source]
    pending-approvals  : [VERIFIED | INFERRED | UNKNOWN] — [evidence source]

  FILESYSTEM DRIFT:
    [file | delta | confidence impact | "none detected"]

  CONTRADICTIONS:
    [type | description | "none"]

  SCOPE BREACH:
    [description | "none"]

  RESUME SAFETY      : [SAFE | CAUTION | UNSAFE]
  RESUME BOUNDARY    : [checkpoint-id of last clean state]
  ROLLBACK AVAILABLE : [YES — to checkpoint-id | NO]

──────────────────────────────────────────────────────────────────
RECOVERY VERDICT: [CLEAN RESUME | RESUME WITH CONFIRMATION | HOLD | BLOCKED]

[If CLEAN RESUME]
  Next exact action: [verbatim from checkpoint]

[If RESUME WITH CONFIRMATION]
  Q1: [question — unlocks: field X, Y]
  Q2: [question — unlocks: field Z]
  Governor will not resume until confirmed.

[If HOLD / BLOCKED]
  Non-resumable condition: [NR code and description]
  Options:
    A) Rollback to [checkpoint-id] — [rollback-recommendation]
    B) Re-run phase from approved scope
    C) Provide context to resolve: [specific unknown fields]

──────────────────────────────────────────────────────────────────
RESUME CONFIDENCE: [HIGH | MEDIUM | LOW]
Reason: [one specific sentence]
══════════════════════════════════════════════════════════════════
```

---

### Template 3: Blocker State Record

```markdown
## Blocker: [Short Title]

Detected     : [YYYY-MM-DD HH:MM:SS UTC]
Phase        : [current phase]
Impact       : [what cannot proceed until resolved]
Description  : [exact description]
Options      :
  A) [Option — tradeoff]
  B) [Option — tradeoff]
  C) [Defer — implication]
Waiting on   : [operator decision | external dependency | other]
Status       : [OPEN | RESOLVED | DEFERRED]
Resolution   : [if resolved: decision, timestamp]
```

---

### Template 4: Session End Update

Written to CHECKPOINT.md at Trigger 6:

```markdown
## Session End — [YYYY-MM-DD HH:MM:SS UTC]

Summary
  Completed this session : [N deliverables — list]
  In-progress at close   : [task: what done, what remains]
  Duration               : [N hours]

Final State
  Next exact action  : [specific step to resume cold without context]
  Clean boundary     : [YES | NO — mid-task, resume with care]
  Files verified     : [YES | NO — list unverified]

Field Confidence at Close
  [copy current field confidence summary table with full labels]

Resume Safety at Close
  [SAFE | CAUTION — with basis]

Human Overrides This Session
  [list or "none"]

Session Termination
  session-termination : CLEAN
  Written             : [YYYY-MM-DD HH:MM:SS UTC]
```

---

## Section 13: Lifecycle Rules

```
CREATED   : CHECKPOINT.md instantiated from template; Trigger 0 not yet fired
ACTIVE    : Phase is open and in execution (set at Trigger 0)
FROZEN    : Phase closed (set at Trigger 7); no further writes except new phase open
ARCHIVED  : Project complete and reviewed; retained for audit; never loaded by Bootstrap
IGNORED   : Bootstrap skips files with lifecycle = IGNORED (manually set by operator)
```

Bootstrap Stage 2.5 loads: CREATED, ACTIVE only.
Stage 2.5 skips: FROZEN (unless new phase opening), ARCHIVED, IGNORED.

---

## Section 14: Integration with Other Standards

- **BOOTSTRAP.md**: Stage 2.5 runs checkpoint scan; CHECKPOINT.md is conditional Tier 1
- **MEMORY-CONVENTIONS.md**: CHECKPOINT.md is Execution Tier; distinct from narrative memory
- **DEFINITION-OF-DONE.md**: Phase close (Trigger 7) required before phase declared done
- **RISK-AND-ESCALATION-STANDARD.md**: Category 2/3 work → Trigger 1
- **VERIFICATION-STANDARD.md**: Evidence per artifact class (Section 3 above)
- **ENGINEERING-EXECUTION.md**: Stale-context awareness extended to cross-session persistence
- **CHANGE-CLASSIFICATION-AND-APPROVALS.md**: Approval provenance stored in CHECKPOINT.md

---

## Non-Negotiable

- Governor MUST maintain CHECKPOINT.md for every active project
- Governor MUST instantiate CHECKPOINT.md from template before any execution begins
- Governor MUST write at every mandatory trigger — no exceptions
- Governor MUST NOT resume from UNKNOWN state without operator confirmation
- Governor MUST NOT claim memory not written in a file
- Governor MUST NOT treat INTERRUPTED as CLEAN
- Governor MUST NOT leave CHECKPOINT.md in partial state after any write

This standard is binding for all Governor sessions and all specialist agents operating on projects with approved phases.
