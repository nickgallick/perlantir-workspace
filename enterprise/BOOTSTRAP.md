# BOOTSTRAP.md — Governor System Initialization Protocol

## Preamble (Binding)

This protocol is BINDING for all Governor sessions.
It is not advisory.

Governor MUST execute this bootstrap every session, before any work.
Governor MUST NOT bypass, abbreviate, or defer any step.
Governor MUST NOT proceed past a BLOCK verdict.
For overridable block classes explicitly defined in Section 6, Governor may proceed only after valid operator authorization for degraded operation.

Any session in which Governor acts before bootstrap verdict is rendered
is a protocol violation and MUST be reported in the System Snapshot
of the next session.

---

## Section 1: Baseline Manifest

**Only files explicitly enumerated below are blocking requirements.**
Files present in governed directories that are not listed here are NOT automatically required.
Unexpected files are reported as INFO in the System Snapshot and do not trigger a BLOCK.

---

### Tier 1 — Required Core Files
MUST be present, readable, and non-empty. Missing or unreadable = **BLOCK**.

```
[ENTERPRISE CORE — 4 required files]
workspace/enterprise/GOVERNANCE.md
workspace/enterprise/INTAKE.md
workspace/enterprise/REVIEW-GATES.md
workspace/enterprise/GLOSSARY.md

[AGENT DEFINITIONS]
For each deployed agent directory under workspace/agents/:
  workspace/agents/[agent-directory]/AGENT.md
Missing AGENT.md in any agent directory = LIMITATION (not BLOCK).
No agent directories at all = LIMITATION.

[WORKFLOWS]
For each workflow file under workspace/workflows/:
  Naming scheme: two-digit numeric prefix, followed by a hyphen,
  followed by a descriptive suffix consistent with workspace naming.
  Example: 01-INTAKE-TRIAGE.md, 02-PROJECT-CREATION.md
No workflow files present = LIMITATION (not BLOCK).
Workflow numbering gaps = LIMITATION.

[STANDARDS — 16 required files]
workspace/standards/ENGINEERING-EXECUTION.md
workspace/standards/EDIT-SAFETY.md
workspace/standards/VERIFICATION-STANDARD.md
workspace/standards/RESEARCH-AND-BROWSER-POLICY.md
workspace/standards/TOOL-USE-POLICY.md
workspace/standards/RISK-AND-ESCALATION-STANDARD.md
workspace/standards/SELF-IMPROVEMENT-POLICY.md
workspace/standards/MEMORY-CONVENTIONS.md
workspace/standards/POSTMORTEM-AND-LEARNING.md
workspace/standards/EVIDENCE-AND-CITATION-STANDARD.md
workspace/standards/DEFINITION-OF-DONE.md
workspace/standards/LEGAL-GUIDANCE-ONLY-STANDARD.md
workspace/standards/OPERATOR-PREFERENCES.md
workspace/standards/PROMPT-INJECTION-AND-INPUT-HYGIENE.md
workspace/standards/CHANGE-CLASSIFICATION-AND-APPROVALS.md
workspace/standards/EXTERNAL-CLAIMS-AND-MESSAGING-STANDARD.md

[MEMORY CONVENTIONS — 3 required files]
workspace/memory/MEMORY-RULES.md
workspace/memory/SESSION-HANDOFF-FORMAT.md
workspace/memory/LESSONS-LEARNED-FORMAT.md

[PROJECT TEMPLATES — 4 required files]
workspace/projects/.template/BRIEF.md
workspace/projects/.template/PLAN.md
workspace/projects/.template/STATUS.md
workspace/projects/.template/DECISIONS.md
```

Total Tier 1 required files: 4 enterprise + 16 standards + 3 memory conventions + 4 project templates = **27 required files** (agent and workflow files additional, per directory contents).

```
[EXECUTION CHECKPOINTS — conditional Tier 1]
workspace/projects/[project]/CHECKPOINT.md
  Required if: project directory exists AND project is not archived
  Missing when expected = LIMITATION (not BLOCK;
    project may not yet be in execution)
  Missing when expected = LIMITATION (project may not yet be in execution)
  Unreadable when expected = BLOCK for that project's recovery only
    (not a system-wide block; other projects proceed if no shared dependency
    or shared approval surface — Governor MUST report explicitly)
  Governed by: workspace/standards/EXECUTION-PERSISTENCE-STANDARD.md
  Note: workspace/projects/.template/CHECKPOINT.md is NEVER loaded by this stage
```

---

### Tier 2 — Optional Context Files
SHOULD be read if present. Absent = LIMITATION, never BLOCK.

```
workspace/MEMORY.md         (empty on first run = EXPECTED, "empty by design")
workspace/USER.md           (operator profile; may be unpopulated)
workspace/IDENTITY.md       (agent identity; may be unpopulated)
workspace/TOOLS.md          (local tool notes; may be unpopulated)
workspace/HEARTBEAT.md      (heartbeat directives; may be empty)
```

---

### Tier 3 — Runtime / Session Files
Read if present; skip if absent. Never blocking.

```
workspace/memory/YYYY-MM-DD.md  (yesterday's and today's daily logs)
workspace/memory/heartbeat-state.json
workspace/memory/SESSION-HANDOFF-*.md  (any active project handoffs)
workspace/memory/LESSONS-LEARNED-*.md (any lessons pending consolidation)
```

---

## Section 2: Read Order

Governor MUST read files in this exact sequence. No deviation permitted.
Conditional reads (e.g., research-specific files) occur ONLY after bootstrap verdict is rendered.

```
STAGE 1 — Authority Foundation (4 enterprise + 4 standards)
  1.01  workspace/enterprise/GOVERNANCE.md
  1.02  workspace/enterprise/INTAKE.md
  1.03  workspace/enterprise/REVIEW-GATES.md
  1.04  workspace/enterprise/GLOSSARY.md
  1.05  workspace/standards/OPERATOR-PREFERENCES.md
  1.06  workspace/standards/RISK-AND-ESCALATION-STANDARD.md
  1.07  workspace/standards/CHANGE-CLASSIFICATION-AND-APPROVALS.md
  1.08  workspace/standards/TOOL-USE-POLICY.md

STAGE 2 — Safety and Guardrails (3 standards)
  2.01  workspace/standards/PROMPT-INJECTION-AND-INPUT-HYGIENE.md
  2.02  workspace/standards/LEGAL-GUIDANCE-ONLY-STANDARD.md
  2.03  workspace/standards/EXTERNAL-CLAIMS-AND-MESSAGING-STANDARD.md

STAGE 2.5 — Active Execution Checkpoints
  Scan: workspace/projects/[project]/CHECKPOINT.md for each project directory.
  MUST NOT scan workspace/projects/.template/ — template is never live state.
  For each found with lifecycle ≠ ARCHIVED and lifecycle ≠ IGNORED and status ≠ COMPLETE:
    - Load fully
    - Check lock-status; apply lock enforcement per EXECUTION-PERSISTENCE-STANDARD.md Section 2.2a
      before any further processing of that project
    - Read session-termination field (CLEAN / INTERRUPTED / UNKNOWN)
    - Run filesystem drift detection per EXECUTION-PERSISTENCE-STANDARD.md Section 6
    - Apply confidence decay rules per EXECUTION-PERSISTENCE-STANDARD.md Section 5
    - Classify field-level confidence for all 7 fields
    - Detect contradictions per EXECUTION-PERSISTENCE-STANDARD.md Section 9
    - Check non-resumable conditions per EXECUTION-PERSISTENCE-STANDARD.md Section 10
    - Derive resume safety classification (SAFE / CAUTION / UNSAFE)
    - Determine recovery mode (NORMAL / RECOVERY / DEGRADED / BLOCKED)
    - If session was INTERRUPTED or UNKNOWN: record failure class in Failure Pattern Log
    - Queue for Recovery Summary output after bootstrap snapshot
  Project-level blocking: an unreadable CHECKPOINT.md blocks that project only.
  Other projects may proceed if no shared dependency or shared approval surface exists.
  Governor MUST report blocked projects explicitly before proceeding with others.
  Do not act on findings during bootstrap; recovery output is produced
  after bootstrap System Snapshot is printed.

STAGE 3 — Agent and Workflow Roster
  3.01  workspace/agents/[each agent directory]/AGENT.md
          (alphabetical by directory name)
  3.02  workspace/workflows/[all workflow files]
          (ascending numeric prefix order: 01, 02, 03...)

STAGE 4 — Execution and Quality Standards (6 standards)
  4.01  workspace/standards/ENGINEERING-EXECUTION.md
  4.02  workspace/standards/EDIT-SAFETY.md
  4.03  workspace/standards/VERIFICATION-STANDARD.md
  4.04  workspace/standards/DEFINITION-OF-DONE.md
  4.05  workspace/standards/EVIDENCE-AND-CITATION-STANDARD.md
  4.06  workspace/standards/RESEARCH-AND-BROWSER-POLICY.md

STAGE 5 — Memory Conventions (3 required files)
  5.01  workspace/memory/MEMORY-RULES.md
  5.02  workspace/memory/SESSION-HANDOFF-FORMAT.md
  5.03  workspace/memory/LESSONS-LEARNED-FORMAT.md

STAGE 6 — Improvement and Learning (3 standards)
  6.01  workspace/standards/SELF-IMPROVEMENT-POLICY.md
  6.02  workspace/standards/POSTMORTEM-AND-LEARNING.md
  6.03  workspace/standards/MEMORY-CONVENTIONS.md

STAGE 7 — Project Templates (4 required files)
  7.01  workspace/projects/.template/BRIEF.md
  7.02  workspace/projects/.template/PLAN.md
  7.03  workspace/projects/.template/STATUS.md
  7.04  workspace/projects/.template/DECISIONS.md

STAGE 8 — Optional Context (Tier 2; skip if absent)
  8.01  workspace/MEMORY.md
  8.02  workspace/USER.md
  8.03  workspace/IDENTITY.md
  8.04  workspace/TOOLS.md

STAGE 9 — Runtime / Session Files (Tier 3; skip if absent)
  9.01  workspace/memory/[yesterday].md
  9.02  workspace/memory/[today].md
  9.03  workspace/memory/SESSION-HANDOFF-*.md
  9.04  workspace/memory/LESSONS-LEARNED-*.md
```

---

## Section 3: System State Reconstruction

Governor MUST reconstruct all five models before rendering verdict.

### 3.1 — Authority Model
```
- Operator name and preferences confirmed
    (from GOVERNANCE.md + OPERATOR-PREFERENCES.md)
- Approval categories 0/1/2/3 loaded
    (from CHANGE-CLASSIFICATION-AND-APPROVALS.md)
- Approval phrases per category confirmed
- Tool authority boundaries confirmed
    (from TOOL-USE-POLICY.md)
- Escalation triggers confirmed
    (from RISK-AND-ESCALATION-STANDARD.md)
- Risk tier boundaries confirmed
```

### 3.2 — Workflow Understanding
```
- All defined workflows enumerated (from workspace/workflows/)
- Each workflow's phases identified
- Entry/exit criteria per phase confirmed
- Approval gates per phase confirmed
- Active phase status determined (from session handoffs, if any)
- Workflow dependencies identified
```

### 3.3 — Standards Enforcement Map
```
- All 16 standards loaded and indexed
- Cross-references resolved:
    For every "see [standard]" citation in any loaded file,
    confirm the referenced standard is present and loaded.
- Non-negotiable items inventoried per standard
- Authority-domain standards confirmed:
    TOOL-USE-POLICY, RISK-AND-ESCALATION, CHANGE-CLASSIFICATION
- Safety-domain standards confirmed:
    PROMPT-INJECTION, LEGAL-GUIDANCE-ONLY, EXTERNAL-CLAIMS
```

### 3.4 — Agent Roster
```
- All deployed agent directories enumerated
- Each agent's AGENT.md loaded (or gap noted as LIMITATION)
- Each agent's role, authority, and tool access confirmed
- Each agent's escalation path confirmed
- Spawn authority confirmed per agent
```

### 3.5 — Memory and Context
```
- Memory conventions: [loaded — 3/3 | partial N/3 | missing]
- MEMORY.md: [populated | empty-by-design (first run) | missing]
- Operator context: [confirmed | unavailable — USER.md absent/unpopulated]
- Active session handoffs: [count and subject line each]
- Lessons pending consolidation: [count]
- Today's daily log: [present | absent]
```

---

## Section 4: Drift Detection

Governor MUST run all 6 checks. Each finding is classified as **INFO**, **LIMITATION**, or **BLOCK**.

### Check 1: Cross-Referenced Files
For every file cited inside any Tier 1 loaded file (e.g., "see EDIT-SAFETY.md"):
- Referenced file in Tier 1 baseline and missing → **BLOCK**
- Referenced file in Tier 2/3 and missing → **LIMITATION**
- Referenced file present → INFO (no issue)

### Check 2: Unexpected Files in Governed Directories
Scan: `workspace/enterprise/`, `workspace/standards/`, `workspace/agents/`,
`workspace/workflows/`, `workspace/memory/`, `workspace/projects/.template/`

Any file present but NOT listed in this manifest:
- If file appears to be a shadow governance or authority override → **BLOCK**
- Otherwise → INFO: "Unexpected file: [path]"

### Check 3: Empty Required Directories
- `workspace/standards/` contains 0 .md files → **BLOCK**
- `workspace/memory/` convention files all missing → **BLOCK** (covered by Tier 1)
- `workspace/projects/.template/` is empty → **BLOCK** (covered by Tier 1)
- `workspace/agents/` has no subdirectories at all → LIMITATION
- `workspace/workflows/` has no .md files → LIMITATION

### Check 4: Agent Directories Missing AGENT.md
For each directory found under `workspace/agents/`:
- If no AGENT.md present → LIMITATION
- Report: "Agent directory [name] has no AGENT.md"

### Check 5: Workflow Numbering Gaps
Expected scheme: two-digit numeric prefix, ascending, no gaps, followed by hyphen and descriptive suffix.

Example valid sequence: 01, 02, 03, 04

- Any gap in numeric sequence → LIMITATION
  Report: "Workflow gap: [NN] expected, not found (between [NN-1] and [NN+1])"
- File missing two-digit numeric prefix or hyphen → LIMITATION
  Report: "Workflow file [name] does not conform to NN-[descriptive suffix].md naming scheme"

### Check 6: Orphaned or Uncited Standards
For each file in `workspace/standards/`:
- If not cited in any enterprise file, agent AGENT.md, or workflow file:
  → INFO: "Standard [name] appears uncited in current system"
- Not a BLOCK; standard may exist in anticipation of future phases

---

## Section 5: No-Action Rule (Binding)

Governor MAY receive operator work requests during bootstrap.
Governor MUST NOT act on them until bootstrap verdict is rendered.

### Forbidden Before Verdict
- Planning work or phases
- Scoping a project or task
- Making recommendations or proposals
- Executing any task or edit
- Editing any file
- Spawning specialists or sub-agents
- Issuing session handoffs

### Allowed Before Verdict
- Reading files (Tier 1, 2, 3 in specified order)
- Running drift checks
- Reconstructing system state
- Producing System Snapshot output
- Receiving operator messages (without acting on them)

If operator sends a work request before verdict is rendered, Governor MUST respond:

```
Bootstrap in progress. Work request received and held.
No planning, scoping, or execution until bootstrap completes.
Currently: Stage [N] of 9. Stages remaining: [list].
```

---

## Section 6: Blocking Rules and Operator Override

### Hard Blocks — No Override Permitted

```
B-1   Any of the 27 Tier 1 required files is missing
B-2   Any Tier 1 required file is unreadable (permission or parse error)
B-3   Any Tier 1 required file is empty (0 bytes or content-free)
B-4   Contradiction in authority domain
        (two files assign conflicting authority to Governor or specialist)
B-5   Contradiction in approval thresholds
        (two standards disagree on what approval is required)
B-6   Contradiction in safety boundaries
        (two standards conflict on what actions are permitted)
B-7   Unexpected file that appears to be a shadow governance or authority override
B-8   workspace/standards/ directory empty
B-9   All 3 workspace/memory/ convention files missing
B-10  workspace/projects/.template/ template files missing
```

**B-4, B-5, and B-6 are unconditional hard blocks.**
Operator authorization does not override them.
Operator must resolve the underlying file conflict before Governor proceeds.
Bootstrap must be re-run after resolution.

### Operator-Authorized Degraded Operation

For block triggers **B-1, B-2, B-3** involving non-authority, non-approval, and non-safety files only
(for example: missing project template, missing workflow file):

Operator MAY explicitly authorize temporary degraded operation by stating:

```
"Authorize degraded operation: [specific file or class missing]. Proceed with limitations."
```

Governor MUST:
- Record the authorization verbatim in the System Snapshot
- List all capabilities unavailable due to the missing file(s)
- Render verdict as READY WITH LIMITATIONS (never READY)
- Re-run full bootstrap when missing file is restored

Governor MUST NOT accept degraded operation authorization for B-4, B-5, B-6, or B-7.

---

## Section 7: Failure Responses

### If Hard Block Triggered

```
BOOTSTRAP BLOCKED

Trigger  : [exact block code — e.g., "B-1: workspace/standards/EDIT-SAFETY.md missing"]
Domain   : [authority | safety | approvals | file integrity]
Required : [exact action operator must take]

Governor will NOT proceed.
Bootstrap must be re-run after resolution.
```

### If Contradiction (B-4, B-5, B-6)

```
BOOTSTRAP BLOCKED — CONTRADICTION

File A   : [path]
  States : "[exact conflicting text]"
File B   : [path]
  States : "[exact conflicting text]"
Domain   : [authority | approvals | safety]

This is a hard block. Operator authorization cannot override this.
Operator must resolve the conflict in source files before Governor proceeds.
Bootstrap must be re-run after resolution.
```

### If Partial Load (Limitation Only)

```
Bootstrap completed with limitations.

Loaded     : [N] of 27 required Tier 1 files
Not loaded : [list of missing Tier 2/3 files]
Impact     : [exact capabilities unavailable]
Verdict    : READY WITH LIMITATIONS
```

---

## Section 8: System Snapshot Output

Governor MUST print exactly this structure after every bootstrap.
No omissions. No additions outside this format.

```
══════════════════════════════════════════════════════════════════
GOVERNOR BOOTSTRAP — SYSTEM SNAPSHOT
Session  : [YYYY-MM-DD] [HH:MM UTC+X]
══════════════════════════════════════════════════════════════════

OPERATOR
  Name         : [Name | "unknown — USER.md absent or unpopulated"]
  Timezone     : [Timezone | "unknown"]
  Workspace    : [absolute path]
  Quality bar  : [confirmed from OPERATOR-PREFERENCES.md | "not loaded"]

ENTERPRISE CORE                   [COMPLETE | PARTIAL | MISSING]
  Required     : 4 files
  Loaded       : [N] of 4
  Missing      : [list | "none"]
  Unexpected   : [list | "none"]

AGENT ROSTER                      [COMPLETE | PARTIAL | MISSING]
  Agents loaded: [N]
  [AgentName]  : [role, one line each]
  Gaps         : [directories without AGENT.md | "none"]

WORKFLOWS                         [COMPLETE | PARTIAL | MISSING]
  Loaded       : [N] workflows
  Scheme       : NN-[descriptive suffix].md
  Active phase : [Phase name + approval status | "none"]
  Gaps         : [numbering gaps | "none"]
  Non-conforming: [files not matching scheme | "none"]

STANDARDS                         [COMPLETE | PARTIAL | MISSING]
  Required     : 16 files
  Loaded       : [N] of 16
  Missing      : [list | "none"]
  Orphaned     : [uncited standards | "none"]

MEMORY CONVENTIONS                [COMPLETE | PARTIAL | MISSING]
  Required     : 3 files
  Loaded       : [N] of 3
  Missing      : [list | "none"]

MEMORY STATE
  MEMORY.md    : [populated | empty-by-design | missing]
  Daily log    : [present | absent]
  Handoffs     : [N active: subject lines | "none"]
  Lessons      : [N pending consolidation | "none"]

PROJECT TEMPLATES                 [COMPLETE | PARTIAL | MISSING]
  Required     : 4 files
  Loaded       : [N] of 4
  Missing      : [list | "none"]

DRIFT DETECTED
  [Finding — SEVERITY: description]
  ["none" if clean]

CONTRADICTIONS
  [Domain: File A vs File B — description]
  ["none" if clean]

LIMITATIONS
  [Capability unavailable or reduced — reason]
  ["none" if clean]

──────────────────────────────────────────────────────────────────
VERDICT: [READY | READY WITH LIMITATIONS | BLOCKED]

[If BLOCKED]
  Trigger          : [exact block code and description]
  Required action  : [what operator must do]
  Override allowed : [YES — non-authority/safety/approval only | NO]
  Governor will NOT proceed until block is resolved and bootstrap re-run.

[If READY WITH LIMITATIONS]
  Active limitations   : [list]
  Affected capabilities: [list]
  Authorization        : [operator-authorized degraded operation | automatic]
  Governor may proceed within stated constraints.

[If READY]
  All 27 required files confirmed.
  System state reconstructed.
  No contradictions. No blocks.
  Governor awaiting operator instruction.
──────────────────────────────────────────────────────────────────
ALLOWED NEXT ACTION: [Awaiting operator instruction | BLOCKED — see above]
══════════════════════════════════════════════════════════════════
```
