<!--
  TEMPLATE SEED — NOT A LIVE CHECKPOINT
  ======================================
  This file is a structural template only.
  Do not use this file to represent any project's execution state.
  Do not write execution state to this file.
  Do not read this file during recovery (Bootstrap Stage 2.5 must skip .template/).

  Live state always lives at: workspace/projects/[project]/CHECKPOINT.md

  To instantiate: copy this file to workspace/projects/[project]/CHECKPOINT.md
  immediately after operator issues approval phrase, before any execution begins.
  Then fire Trigger 0 (Phase Open) per EXECUTION-PERSISTENCE-STANDARD.md Section 7.

  Template placeholders are NOT confidence classifications.
  UNKNOWN is a runtime recovery state, not an uninitialized field.
  All confidence fields are set to VERIFIED at Trigger 0 with phase-open data.
-->

# CHECKPOINT — [Project Name]

---

## Schema and Provenance

```
schema-version      : 1.0.0
checkpoint-id       : [UUID or monotonic counter — unique per write]
prior-checkpoint-id : GENESIS
last-writer         : [Governor | SpecialistName]
last-updated        : [YYYY-MM-DD HH:MM:SS UTC]
active-owner        : [Governor | SpecialistName]
lock-status         : UNLOCKED
```

<!-- Update checkpoint-id and prior-checkpoint-id on every write (atomic). -->
<!-- Update last-writer, last-updated, active-owner on every write. -->
<!-- lock-status: UNLOCKED | LOCKED-BY: name | CONFLICT -->

---

## Project and Phase

```
project             : [project name]
phase               : [current approved phase name and number]
approval-category   : [0 | 1 | 2 | 3]
approval-phrase     : "[exact verbatim approval phrase — copy precisely]"
approval-timestamp  : [YYYY-MM-DD HH:MM:SS UTC]
approved-scope      : [one-line exact scope summary]
approval-freshness  : [FRESH | AGING | STALE | EXPIRED: reason]
lifecycle           : CREATED
status              : AWAITING-APPROVAL
session-termination : UNKNOWN
recovery-mode       : NORMAL
```

<!-- Set lifecycle = ACTIVE at Trigger 0 (Phase Open). -->
<!-- Set session-termination = CLEAN at Trigger 6 (Session End). -->
<!-- Set session-termination = UNKNOWN at Trigger 0 (new phase open). -->
<!-- Set lifecycle = FROZEN at Trigger 7 (Phase Close). -->

---

## Current Objective

[One sentence: what this phase is trying to accomplish]

```
confidence      : [VERIFIED | INFERRED | UNKNOWN]
evidence-source : [file path, approval phrase, or "none"]
last-verified   : [YYYY-MM-DD HH:MM:SS UTC]
```

<!-- Write at Trigger 0. Update if objective changes mid-phase (requires re-approval). -->

---

## Completed Work

<!-- Format: - [x] [Deliverable description] — YYYY-MM-DD HH:MM:SS UTC -->
<!-- Each item must include evidence-source, files-touched, verification-class, status. -->

```
confidence : [VERIFIED | INFERRED | UNKNOWN]
```

| Deliverable | Timestamp UTC | Evidence Source | Files Touched | Verification Class | Verification Status |
|-------------|---------------|-----------------|---------------|--------------------|---------------------|
| | | | | | |

<!-- Verification classes: docs | code | config | infra | external-claims | legal-guidance -->
<!-- Verification status: VERIFIED | PARTIAL | UNVERIFIED -->

---

## In-Progress Work

[Current task: what is done, what remains]

```
confidence      : [VERIFIED | INFERRED | UNKNOWN]
evidence-source : [basis for this claim]
last-verified   : [YYYY-MM-DD HH:MM:SS UTC]
```

<!-- Update at Trigger 2 (deliverable complete) and Trigger 6 (session end). -->

---

## Next Exact Action

[Single specific next step — sufficient detail to execute without asking or inferring]

```
confidence      : [VERIFIED | INFERRED | UNKNOWN]
evidence-source : [basis]
last-verified   : [YYYY-MM-DD HH:MM:SS UTC]
```

<!-- Must be specific enough to resume cold without context. -->
<!-- Update at every Trigger 2 and Trigger 6. -->

---

## Files Touched This Phase

| File | Change | Verification Class | Verified? | Timestamp UTC |
|------|---------|--------------------|-----------|---------------|
| | | | | |

<!-- Append a row at every Trigger 4 (file touched). -->
<!-- Change: created | edited | deleted -->
<!-- Verification class: docs | code | config | infra | external-claims | legal-guidance -->
<!-- Verified: yes | partial | no -->

---

## Blockers

<!-- Format per EXECUTION-PERSISTENCE-STANDARD.md Template 3 -->

```
confidence      : [VERIFIED | INFERRED | UNKNOWN]
evidence-source : [basis]
last-verified   : [YYYY-MM-DD HH:MM:SS UTC]
```

none

<!-- Write at Trigger 3 (blocker detected). -->

---

## Open Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| | | |

<!-- Severity: LOW | MEDIUM | HIGH -->

---

## Pending Approvals

```
confidence      : [VERIFIED | INFERRED | UNKNOWN]
evidence-source : [basis]
last-verified   : [YYYY-MM-DD HH:MM:SS UTC]
```

none

<!-- Write at Trigger 5 (pending approval created). -->
<!-- Include: what is pending | proposed-since | exact proposal summary -->

---

## Field Confidence Summary

<!-- Update at every write trigger. -->

| Field              | Confidence | Evidence Source | Last Verified UTC |
|--------------------|------------|-----------------|-------------------|
| phase              | —          | not yet written | —                 |
| objective          | —          | not yet written | —                 |
| completed-work     | —          | not yet written | —                 |
| in-progress-work   | —          | not yet written | —                 |
| next-exact-action  | —          | not yet written | —                 |
| blockers           | —          | not yet written | —                 |
| pending-approvals  | —          | not yet written | —                 |

<!-- At Trigger 0: set all fields to VERIFIED with phase-open data. -->

---

## Resume Safety Classification

```
resume-safety : UNSAFE
basis         : New checkpoint — Trigger 0 not yet fired. No execution state written.
```

<!-- Recalculate after each write trigger per EXECUTION-PERSISTENCE-STANDARD.md Section 2.11 -->
<!-- SAFE = all 7 VERIFIED + CLEAN termination + no drift + approval FRESH/AGING -->
<!-- CAUTION = ≥1 INFERRED / INTERRUPTED / minor drift / approval AGING -->
<!-- UNSAFE = any UNKNOWN / UNKNOWN termination / major drift / STALE approval / scope breach / CONFLICT -->

---

## Rollback Anchor

```
last-clean-boundary       : GENESIS
last-clean-timestamp      : [YYYY-MM-DD HH:MM:SS UTC — set at Trigger 0]
files-touched-since-clean : none
rollback-recommendation   : SAFE-TO-ROLLBACK
```

<!-- Update at Trigger 1 (before risky change) and Trigger 2 (deliverable complete, if clean). -->

---

## Filesystem Drift

none detected

<!-- Populated during Bootstrap Stage 2.5 and Trigger 8 (crash recovery). -->
<!-- Format: file | checkpoint-timestamp | actual-modified | delta | confidence-impact -->

---

## Decision Provenance Log

| Decision-ID | Summary | Made-By | Timestamp UTC | Why | Alternatives Rejected | Affected Files |
|-------------|---------|---------|---------------|-----|-----------------------|----------------|
| | | | | | | |

<!-- Log meaningful decisions at the time they are made. -->

---

## Assumption Ledger

| Assumption | Confidence | Invalidation Condition | Confirmation Required |
|------------|------------|------------------------|----------------------|
| | | | |

---

## Dependency State

**Upstream dependencies:**

| Dependency | Type | Verified Status | Last Checked UTC |
|------------|------|-----------------|------------------|
| | | | |

**Downstream dependencies:**

| Dependent | Type | Impact if Blocked |
|-----------|------|-------------------|
| | | |

**Blocked-by:**

| Blocker | Blocking Since | Resolution Path |
|---------|----------------|-----------------|
| | | |

none

---

## Deliverable Boundary Map

**Completed deliverables:**

| Deliverable | Verified | Safe Resume Point |
|-------------|----------|-------------------|
| | | |

**Partial deliverables:**

| Deliverable | What is Done | What Remains | Resume Safe |
|-------------|--------------|--------------|-------------|
| | | | |

**Forbidden partial states:**
none defined

**Safe resume points:**
none defined yet — set at Trigger 0

---

## Human Override Log

| Timestamp UTC | Operator Authorization (verbatim) | Reason | Accepted Consequences |
|---------------|-----------------------------------|--------|-----------------------|
| | | | |

none

<!-- Write at Trigger 9 (human override). Always include verbatim authorization text. -->

---

## Failure Pattern Log

| Timestamp UTC | Failure Class | Description | Standards Upgrade Warranted? |
|---------------|---------------|-------------|------------------------------|
| | | | |

<!-- Failure classes: crash | freeze | partial-write | stale-approval | checkpoint-drift | contradiction | scope-breach | unknown -->

---

## Session Termination History

| Session Date UTC | Termination Status | Last Checkpoint ID | Last Action Written |
|------------------|--------------------|--------------------|---------------------|
| [initialized]    | UNKNOWN            | GENESIS            | Template instantiated |

<!-- Append at Trigger 6 (session end) and Trigger 8 (crash recovery). -->
<!-- Set session-termination in Project and Phase block = CLEAN at each clean session end. -->
