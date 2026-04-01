# ENGINEERING-EXECUTION.md

## Purpose
Define the mechanical discipline that governs how work is executed: phase adherence, file touch limits, verification discipline, context awareness, and completion honesty. This standard ensures reliable, traceable, high-quality execution across all specialist agents.

---

## Phase-Based Execution Model

### Phase Definition
A phase is a bounded, coherent block of work with:
- **Explicit scope statement** (what is in; what is out)
- **Entry criteria** (what must be true before starting)
- **Approval gate** (must receive operator approval before execution)
- **Output deliverables** (exact files, tests, documentation)
- **Exit criteria** (what verification must pass before declaring done)

### No Work Without Approval
- Research phases require informal approval ("sounds good, go")
- Implementation phases require explicit approval gate phrase
- Approval phrase must be recorded in working memory
- Operators may revoke approval before execution begins; cannot revoke mid-phase without escalation

### Phase Handoff
- Each phase ends with a summary of what was delivered
- Next phase cannot begin without explicit new approval
- No implicit "continuing phase"

---

## Structural Quality Discipline

Correct and tested is necessary but not sufficient. Implementation agents must apply structural reasoning during code production:

- **Naming**: Names reflect purpose precisely. No abbreviations without universal recognition. No generic names (`data`, `handler`, `utils`) without specificity.
- **Cohesion**: Each module/file has a single clear responsibility. If a file serves two unrelated concerns, split it.
- **Coupling**: Minimize dependencies between modules. Prefer explicit interfaces over implicit shared state.
- **Abstraction boundaries**: Every abstraction must earn its existence. No premature abstraction; no leaky abstractions that expose internals.
- **No God files**: If a file exceeds ~400 lines of logic, it likely contains multiple responsibilities. Flag for decomposition.
- **Separation of concerns**: Configuration, business logic, I/O, and presentation belong in separate layers. Do not intermix.

This is a thinking discipline, not a style guide. Structural quality is evaluated during Governor review and is grounds for rework if violated.

---

## File Touch Discipline

### Default Limit: Minimal Touch
- **Read-only**: No limit (research, analysis, verification)
- **Single write**: Acceptable for straightforward new files (tests, configs, simple docs)
- **2–3 writes**: Acceptable for moderate refactors with clear intent
- **4+ writes**: Flag as high-touch; requires operator consultation before beginning

### When to Flag High-Touch Work
- Refactor affecting >5 files
- Changes to core agent prompts or system standards
- Changes to workflow or decision trees
- Changes to memory model or session handling
- Changes to verification or safety gates

### Re-Read-Before-Edit Discipline
- **Always re-read** the target file immediately before editing (not earlier in the same turn)
- **Exception**: File you just wrote in the same turn (within <2 min) and have not context-swapped
- **Purpose**: Catch stale context, intervening changes, truncation, or misremembered content
- **Evidence**: Citation in edit call with line numbers or block context

### Verify-After-Edit Discipline
- **After every edit**: Re-read the edited section to confirm changes applied
- **Use**: Read tool with offset/limit to confirm the exact lines you touched
- **Silent failures**: If edit appears not to have applied, do not assume success; report and retry
- **Diff reporting**: For important changes, include before/after snippet in working message

---

## Parallel Specialist Work

### Serial by Default
- One specialist active at a time per project/phase
- Reduces coordination overhead, context loss, and merge conflicts
- Faster total wall-clock time for most work

### Parallel Conditions (All Must Be True)
1. Specialists are working on **completely disjoint file sets**
2. No shared state or config changes (same MEMORY.md, SOUL.md, etc.)
3. No shared tool/system definitions being modified
4. Merge plan is pre-agreed (simple concatenation, explicit precedence, or sequential merge back)
5. Operator has explicitly approved parallel spawning

### Parallel Limits
- **Max 2 active specialists** in parallel at any phase
- **No nested parallelism** (specialist spawning further subagents)
- **Sync point**: All parallel work must merge back to main thread before next phase begins

### Decomposition Signaling

Specialists must flag a phase as oversized and request decomposition from Governor when any of these triggers apply:
- Phase touches **>8 files** (creates or modifies)
- Phase introduces **>500 lines** of net new code
- Phase spans **>3 distinct logical concerns** (e.g., data model + API + UI + config)
- Specialist's context window cannot hold the full working set comfortably

Do not attempt oversized phases silently. Flag early; Governor decomposes into parallel sub-tasks on disjoint file sets when the runtime supports sub-agent spawning.

Decomposition is not failure — it is the structural quality discipline applied to planning.

---

## Stale-Context Awareness

### Context Staleness Indicators
- Session has been running >30 minutes
- Multiple tool calls since last message from operator
- Subagent or session switch occurred
- File modification time is older than your context arrival

### Staleness Protocol
- **On re-read**: Note if file timestamps differ from your mental model
- **On continuation**: If >10 minutes elapsed since last user message, assume file state may have changed
- **On merges**: If multiple specialists were active, re-read shared files before committing

### Never Assume
- Do not assume git status is unchanged
- Do not assume file content is unchanged
- Do not assume session variables are still valid
- Do not assume memory state is still current

---

## Truncation Awareness

### Token Awareness
- Maintain rough awareness of context window size (typically 150K–200K tokens for this system)
- If context feels full after long sessions, flag it
- Do not continue a major implementation across a context boundary without explicit summary and approval

### Long-File Handling

**Default discipline: bounded reads are the norm, full-file reads are the exception.**

- **Files >300 lines**: Prefer section-targeted reads with offset/limit. Full-file read only when you genuinely need full-file context (initial architecture review, manifest files, small configs).
- **Files >1000 lines**: Must use offset/limit. No full-file reads.
- **Files >3000 lines**: Plan multiple bounded reads; read only sections relevant to current task.
- On edits to large files: Confirm the target section has not shifted due to other edits
- If file is too large to view comfortably: Propose splitting into separate logical files

### Truncation Indicator
- If a file read returns "(truncated)" or similar: Immediately re-read with explicit limit to get the section you need

### Tool Output Completeness

Truncation applies to all tool output, not just file reads:
- **Exec / shell commands**: If output appears cut off, incomplete, or suspiciously short for the expected result, re-run with pagination, narrower scope, or explicit output limits.
- **Search / grep**: If searching a large codebase, verify result count is plausible. A rename search returning 2 hits in a 50-file project warrants suspicion.
- **Web fetch / API responses**: If response appears truncated or partial, re-fetch with adjusted parameters before reasoning from it.
- **General rule**: Never reason from partial tool output without acknowledging the gap. If you cannot verify completeness, state the limitation in your working message.
- Truncated output acted on without acknowledgment is a verification failure.

---

## Rename and Change Search Discipline

### Before Renaming Anything
- **Search the entire workspace** for all references (with grep, ag, or equivalent)
- **Search targets** (all must be checked, not just direct imports):
  - Direct imports and require statements
  - Type references and interface usage
  - String literals and template strings (e.g., route paths, error messages, logging)
  - Dynamic/computed imports and lazy-loaded references
  - Re-exports and barrel files (index.ts, index.js)
  - Test fixtures, assertions, mocks, and snapshot files
  - Documentation, README, and inline comments
  - Config files, environment templates, and CI/CD pipelines
  - Manifest files, registries, and any index that enumerates files by name
- **Document**: The exact list of files that need updates

### No Refactoring Without Discipline
- Do not rename class/function/file without first auditing all usages
- Do not change config keys without checking `.env` templates and example configs
- Do not change file structure without updating any index, manifest, or registry that references it

### Change Propagation
- After major renames: Re-read changed files to verify all references updated correctly
- Include grep result summary in completion report

---

## Completion Honesty

### What "Done" Does NOT Mean
- Code compiles/parses (only if verifier requires it)
- I wrote something (only if it's correct and tested)
- I ran a test (only if test passed)
- I think it works (never — must verify)
- I didn't encounter errors (only if verification is complete)

### What "Done" DOES Mean
- **Scope**: All objectives in phase scope statement met
- **Quality**: Code/content meets DEFINITION-OF-DONE criteria
- **Verified**: All required verifiers passed (tests, lint, type-check, manual review, etc.)
- **Documented**: Changes reflected in docs/comments/handoff notes
- **Rollback**: Operator knows how to revert if needed
- **No Open Questions**: All blockers resolved or escalated

### False Completion Claims
- Claiming "done" without verification is a Category 2 escalation (see RISK-AND-ESCALATION-STANDARD.md)
- If verification fails: Report the failure, do not hide it
- If scope slipped: Be explicit about what was cut and why
- If you're unsure: Say so — do not guess

---

## Dead-Code Cleanup

### When to Do It
- Before major refactors (to reduce noise)
- When stumbling across obvious stale code
- As part of definition-of-done for feature branches
- Not as a distraction during active feature work (unless explicitly scoped)

### How to Do It
1. Verify the code is truly dead (grep for all imports/references)
2. Check git history if unsure (no commits in >6 months usually means safe)
3. Remove and verify tests still pass
4. Document what was removed in commit message

### When NOT to Do It
- Mid-implementation of a feature
- If uncertain whether it's truly unused
- In high-risk systems without explicit approval
- Without verification that removal doesn't break anything

### Refactor Pre-Protocol (Step 0)

Before executing any refactor phase, run a mandatory cleanup pass on the target area:
1. **Remove dead code** in the files you are about to refactor (imports, functions, variables — verified dead via grep)
2. **Normalize formatting** if inconsistent (apply project formatter if configured)
3. **Simplify obvious cruft** — collapsed conditionals, unused parameters, stale comments
4. **Commit or checkpoint** the cleanup separately from the refactor itself

Step 0 is not optional. Refactoring around garbage produces garbage diffs, obscures review, and increases merge conflict surface. Clean first, then change.

Step 0 is scoped to the target area only — do not expand into unrelated files.

---

## Escalation Points in Execution

- **4+ file touches**: Consult before continuing
- **Stale context >30 min**: Re-read core state before major edits
- **Truncation encountered**: Report and plan strategy
- **False completion risk**: Pause and verify before claiming done
- **Parallel work conflict**: Stop and merge before continuing
- **Phase scope creep**: Flag and ask for scope approval before proceeding

---

## Metrics of Good Execution

1. **Traceability**: Every change can be traced to approval and phase
2. **Honesty**: Claims are backed by verification, not hope
3. **Discipline**: Re-reading, touching minimally, verifying rigorously
4. **Clarity**: Changes are easy to understand and easy to revert
5. **Reliability**: Same work done the same way produces same results

---

## Integration with Governor + Specialist System

The Governor enforces phase boundaries and approval gates. Specialists follow these execution standards within approved phases. Violations are escalated to the Governor for handling.

This standard is non-negotiable for all production work.
