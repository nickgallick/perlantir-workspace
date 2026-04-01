# MEMORY-CONVENTIONS.md

## Purpose
Define what belongs in durable memory (MEMORY.md), session handoffs, and what should never be stored. Keep memory concise, high-signal, and actionable. Ensure handoffs are clear and prevent drift.

---

## Memory Tiers

### Tier 1: Durable Memory (MEMORY.md)
**Definition**: Information that should survive across many sessions and be available to the Governor and all specialists.

**Read Access**: Main session only (not in group chats or shared contexts)

**Lifespan**: Months to years (until explicitly archived)

**Example Size**: 5–15KB (concise, curated)

### Tier 2: Session Handoff
**Definition**: Information needed to continue work in the next session on the same project/phase.

**Lifespan**: One project or phase (discarded when work completes)

**Read Access**: Any session working on the same project

**Example Size**: 2–5KB per handoff

### Tier 3: Session Memory
**Definition**: Temporary working context used during a single session.

**Lifespan**: Current session only (disappears when session ends)

**Read Access**: Current session, current subagents only

**Example Size**: Unbounded (session context window)

### Execution Tier: CHECKPOINT.md (Tier 1 During Active Work)
**Definition**: The live execution ledger for any project currently in an approved phase. Machine-structured state — not narrative. Written continuously during execution at mandatory trigger points.

**Read Access**: Governor + any specialist working on the same project

**Lifespan**: Per lifecycle state — CREATED (pre-execution) → ACTIVE (in execution) → FROZEN (phase complete) → ARCHIVED (project done, audit only) → IGNORED (operator-set, bootstrap skips). Bootstrap Stage 2.5 loads CREATED and ACTIVE only; skips FROZEN (unless new phase opening), ARCHIVED, and IGNORED.

**Location**: `workspace/projects/[project]/CHECKPOINT.md`
**Template**: `workspace/projects/.template/CHECKPOINT.md` (seed only — never live state, never loaded by bootstrap)

**Purpose**: Enables crash recovery and session restart without relying on live chat memory. Contains: schema provenance, approval provenance, 7-field confidence model (VERIFIED/INFERRED/UNKNOWN), session termination integrity (CLEAN/INTERRUPTED/UNKNOWN), resume safety classification (SAFE/CAUTION/UNSAFE), filesystem drift log, rollback anchor, decision provenance, assumption ledger, dependency state, deliverable boundary map, human override log, and failure pattern log.

**Schema versioning**: schema-version field enables future schema evolution without breaking existing checkpoints.

**Confidence decay**: Verified state decays across sessions per type (see EXECUTION-PERSISTENCE-STANDARD.md Section 5). Not all stale state is treated equally — decay rate depends on field type and session termination status.

**Governed by**: `workspace/standards/EXECUTION-PERSISTENCE-STANDARD.md`

**Key distinction**: CHECKPOINT.md is NOT narrative memory. Do not write summaries, discussion, or context to it. Write only structured state at mandatory trigger points. CHECKPOINT.md is the governing source of truth for live recovery; STATUS.md is human-readable; if they diverge, CHECKPOINT.md takes precedence for all recovery decisions.

### Tier 4: Never Store
**Definition**: Information that should NEVER be recorded or persisted.

**Examples**: Passwords, API keys, private credentials, sensitive personal data

---

## What Belongs in Each Tier

### MEMORY.md (Durable): YES

#### Operational Context
- User name and preferences
- Timezone and location
- Communication style preferences
- Known constraints and interests

**Example**:
```markdown
**Nick**: Based in Singapore (UTC+8). Prefers concise, technical communication.
Operates a VPS-hosted system. Values precision > brevity.
```

#### System Architecture
- High-level system design (components, data flow)
- Technology stack decisions
- Key architectural trade-offs

**Example**:
```markdown
**System**: Enterprise AI agent system with Governor + specialists.
Governor manages phases; specialists execute within scope.
Memory model: MEMORY.md (durable) + session handoff (temporary).
```

#### Lessons Learned
- Recurring mistakes and how to prevent them
- Successful patterns that work
- Anti-patterns to avoid

**Example**:
```markdown
**Lesson**: Always re-read files before editing. Twice in Phase 4,
we edited based on stale context. Now mandatory in EDIT-SAFETY.md.
```

#### Project Milestones
- Major completed phases (with date and outcome)
- Major decisions made
- Key dependencies or blockers

**Example**:
```markdown
**Phase 5 Complete** (April 1, 2026):
Created 19 standards files defining agent operating system.
Now ready for Phase 6 (specialists, workflows).
```

#### Preferences and Guidance
- How the user wants work done
- Quality bar and expectations
- Any special rules or constraints

**Example**:
```markdown
**Preference**: Premium quality bar. No generic work.
Verify performance > self-reported. Explicit approvals required.
State-of-the-art expectation.
```

#### Known Bugs or Gotchas
- System quirks that bite repeatedly
- Workarounds that work
- Known limitations

**Example**:
```markdown
**Known**: Large files (>5000 lines) may truncate on read.
Workaround: Use offset/limit to read in sections.
```

### MEMORY.md (Durable): NO

- Session-specific context ("In today's call, we discussed X")
- Temporary working notes ("Trying approach Y, will update")
- Raw logs or full conversations
- Detailed implementation notes (those belong in code comments)
- Private credentials (NEVER)

---

### Session Handoff: YES

**For Phase Completion**:
- What was delivered (exact file list)
- Verification evidence (tests passed, etc.)
- Known issues or limitations
- Recommended next steps
- Rollback procedure (if needed)

**For Project Continuation**:
- Current state of implementation
- Open questions or blockers
- Files modified and why
- Next immediate action needed
- Context needed for next specialist

**Example Handoff**:
```markdown
## Phase 5 Completion Handoff

**Delivered**: 19 standards files (workspace/standards + memory)

**Verification**: 
- All files created with full content
- Standards are coherent and integrated
- No conflicts with existing system

**Known Limitations**:
- Standards assume specialists exist (Phase 6 creates them)
- Memory model assumes MEMORY.md will be populated (Phase 7)

**Next Steps**:
- Phase 6: Create specialist agents (SecurityAuditor, DevOps, etc.)
- Populate MEMORY.md with initial context

**Rollback**:
If needed: `rm -rf workspace/standards/ workspace/memory/MEMORY-RULES.md workspace/memory/SESSION-HANDOFF-FORMAT.md workspace/memory/LESSONS-LEARNED-FORMAT.md`
```

### Session Handoff: NO
- Long explanations (summarize key points)
- Full test output (reference test file, not full log)
- Debug logs (keep only error summary)
- Repeating context already in MEMORY.md

---

### Session Memory: YES (Temporary)
- Current task context
- Intermediate results
- Tool outputs (full logs, debug output)
- Draft text before finalization
- Reasoning and exploration (before conclusions)

### Session Memory: NO (Won't Survive Session)
- Anything needed after session ends should be in Tier 1 or 2

---

## NEVER Store

### Secrets
- API keys
- Database passwords
- Auth tokens
- Encryption keys
- SSH private keys
- Credentials of any kind

**Protection**: If encountered:
1. Do not log
2. Do not write to file
3. Do not include in memory/handoff
4. Report to operator (without including secret)
5. Recommend rotation

### Private Data
- User passwords
- Personal phone numbers
- Social security numbers
- Financial account info
- Health data (if sensitive)
- Private emails or messages

**Protection**: Redact before any output; ask operator before handling

### Proprietary Information
- Unreleased product plans
- Confidential business metrics
- Private customer data
- Source code of closed systems

**Protection**: Mark as confidential; keep out of MEMORY.md

---

## Memory Format Standards

### MEMORY.md Structure

```markdown
# MEMORY.md

## User Context
### [User Name]
- Timezone: [UTC offset]
- Communication style: [brief description]
- Known preferences: [bullet list]

## System Architecture
### Overview
[High-level description]

### Key Components
- Component A: [purpose]
- Component B: [purpose]

### Tech Stack
[Main technologies, why chosen]

## Lessons Learned
### [Topic 1]
[Lesson, impact, how to prevent]

### [Topic 2]
[Lesson, impact, how to prevent]

## Operational Guidance
### Quality Standards
[User's expectations]

### Known Gotchas
[System quirks, workarounds]

### Decision Log
| Decision | Date | Rationale |
| --- | --- | --- |
| Decision A | 2026-04-01 | [why] |

## Project Milestones
### Phase X (Date)
[Outcome, deliverables, impact]
```

### Session Handoff Structure (See SESSION-HANDOFF-FORMAT.md)

### Lessons Learned Format (See LESSONS-LEARNED-FORMAT.md)

---

## Memory Maintenance

### Daily
- After important decisions: Update MEMORY.md with decision and rationale
- After discovering a lesson: Note it (can add to MEMORY.md later)

### Weekly (Optional)
- Review session notes (memory/YYYY-MM-DD.md if kept)
- Identify learnings worth preserving
- Update MEMORY.md with consolidated wisdom

### Monthly (Recommended)
- Archive old session files if not needed
- Remove outdated entries from MEMORY.md
- Consolidate related lessons

### Size Control
- If MEMORY.md exceeds 20KB: Review and consolidate
- If MEMORY.md has >30 lessons: Archive old lessons
- Goal: High-signal, concise, immediately useful

---

## Memory Privacy

### Read Access Control
**MEMORY.md**:
- [ ] Main session only (not group chats)
- [ ] Sensitive data redacted before sharing
- [ ] User context not shared with other users

**Session Handoff**:
- [ ] Shared within project scope
- [ ] Not shared across unrelated projects
- [ ] Credentials removed before handoff

**Session Memory**:
- [ ] Not persistent; discarded at session end
- [ ] Not shared outside current session/subagents

### Never
- Share MEMORY.md or user context in group chats
- Include credentials in any saved file
- Log sensitive information
- Infer private information from context

---

## Memory Accuracy

### Maintaining Accuracy
- [ ] Before citing memory: Verify it's still accurate
- [ ] If situation changes: Update MEMORY.md
- [ ] If discovering contradiction: Note and ask operator
- [ ] If uncertainty: Say so ("I remember X, but unsure if still true")

### Correcting Memory
- [ ] If memory is wrong: Fix it immediately
- [ ] If memory is outdated: Mark and update
- [ ] If memory is ambiguous: Clarify with operator

---

## Examples

### Good Durable Memory Entry
```markdown
### Phase 5 Completion (April 1, 2026)

Implemented 19 standards files (ENGINEERING-EXECUTION.md, EDIT-SAFETY.md, etc.).
System now has explicit operating rules for agents.

Key improvement: Standards are concrete, not vague. Each includes:
- When to apply
- Specific protocol
- Examples
- Integration with other standards
- Checklist for compliance

Impact: Enables reliable, verifiable agent behavior.
Foundation for Phase 6 (specialists) and Phase 7 (workflows).
```

### Good Session Handoff Entry
```markdown
## Phase 7 Handoff

**Delivered**: 
- MEMORY.md populated with initial context
- Specialist agents created (Security, DevOps, Research)
- Workflow defined in AGENTS.md

**Status**: Ready for Phase 8 (integration testing)

**Next**: Run Phase 8 to verify agents work together correctly
**Rollback**: Revert last 3 commits in git
```

### Good Lessons Learned Entry
```markdown
### Re-Read Discipline

**Incident**: Agent edited file based on stale context; verification failed.

**Root Cause**: Agent assumed context was current; didn't re-read before edit.

**Prevention Rule**: Added to EDIT-SAFETY.md:
"Always re-read target file immediately before editing (unless just written)."

**Impact**: Now mandatory; prevents stale-context edits.
```

---

## Integration with Other Standards

- **ENGINEERING-EXECUTION.md**: Stale-context awareness relates to memory freshness
- **SESSION-HANDOFF-FORMAT.md**: Specific handoff structure and content
- **LESSONS-LEARNED-FORMAT.md**: Specific format for logging lessons
- **POSTMORTEM-AND-LEARNING.md**: How incidents lead to memory updates

Non-negotiable: Memory is how continuity works. Treat it with care.
