# MEMORY-RULES.md

## Purpose
Durable memory conventions and rules. How memory works across sessions. What to store, what to discard, how to stay accurate.

---

## Memory Tiers (Quick Reference)

See MEMORY-CONVENTIONS.md for full details.

### Tier 1: MEMORY.md (Durable, Long-Term)
- Operator context and preferences
- System architecture
- Lessons learned
- Project milestones
- Key decisions
- **Lifespan**: Months to years
- **Size**: 5–15KB (concise, curated)
- **Access**: Main session only

### Tier 2: Session Handoff (Project/Phase Scope)
- Completion summary
- Verification evidence
- Known limitations
- Next steps
- **Lifespan**: One project or phase
- **Size**: 2–5KB
- **Access**: Any session on same project

### Tier 3: Session Memory (Temporary)
- Working context
- Tool outputs
- Drafts and exploration
- **Lifespan**: Current session only
- **Size**: Unbounded (session context)
- **Access**: Current session + subagents

### Tier 4: Never Store
- Passwords, API keys, secrets
- Private credentials
- Sensitive personal data
- Anything that shouldn't survive session

---

## What Goes in MEMORY.md?

### YES: Store in MEMORY.md

**Operator Context**
```markdown
**Nick**:
- Based in Singapore (UTC+8)
- Prefers concise, technical communication
- Values precision over brevity
- Expects state-of-the-art work, no generic output
```

**System Architecture** (high-level understanding)
```markdown
**System**: Enterprise AI agent system
- Governor manages phases and approval gates
- Specialists execute within approved scope
- Memory model: MEMORY.md (durable) + session handoff (temporary)
```

**Lessons Learned** (recurring patterns)
```markdown
**Lesson**: Always re-read files before editing
- Incident: Stale context caused wrong edits twice
- Prevention: Now mandatory (EDIT-SAFETY.md)
- Impact: Prevented editing errors
```

**Project Milestones** (major completions)
```markdown
**Phase 5 Complete (April 1, 2026)**:
- Created 19 standards files
- System now has explicit operating rules
- Ready for Phase 6 (specialists)
```

**Key Decisions** (why we chose this path)
```markdown
**Decision**: Use standards-based governance instead of prompt-only
- Rationale: More reliable, more auditable, easier to evolve
- Date: Phase 5
- Impact: Foundation for all future agent behavior
```

**Preferences** (how the user wants work done)
```markdown
**Quality Bar**: Premium (no generic work, all specific to context)
**Approval**: Explicit for Category 2+ work
**Communication**: Direct, sharp, no filler
```

---

### NO: Don't Store in MEMORY.md

**Session-Specific Context**
```markdown
❌ "Today Nick asked about Phase 6 timeline"
(Session-specific; not worth remembering after session ends)
```

**Temporary Working Notes**
```markdown
❌ "Currently trying approach X, will update if it fails"
(Exploration; store in session memory, not durable)
```

**Raw Tool Output**
```markdown
❌ "npm test output: PASS test.js (24/24 passed)"
(Log reference belongs in session, not durable memory)
```

**Detailed Implementation Notes**
```markdown
❌ "Fixed bug by checking for null in line 45"
(Code detail; belongs in comments, not durable memory)
```

**Private Data**
```markdown
❌ API keys, passwords, credentials, personal info
(NEVER store secrets in memory)
```

---

## Memory Accuracy Rules

### Before Citing Memory
1. Re-read the memory entry
2. Verify it's still accurate
3. If unsure: Say so ("I remember X, but I'm not 100% certain")

### Updating Memory
- If facts change: Update immediately
- If lesson is outdated: Archive or update
- If decision reversed: Note the new decision

### Correcting Memory
- If memory is wrong: Fix it
- If memory is conflicted: Note both versions
- If memory is vague: Clarify with operator

---

## Memory Maintenance Schedule

### During Session
- After important decision: Note it for later consolidation
- After discovering lesson: Flag it
- Keep MEMORY.md available for reference

### End of Session
- Session handoff (if work ongoing)
- Note any new lessons in session memory

### Weekly (Optional)
- Review session notes from past week
- Consolidate lessons worth keeping
- Update MEMORY.md with new wisdom

### Monthly (Recommended)
- Review entries in MEMORY.md
- Remove outdated information
- Consolidate related lessons
- Keep <20KB, <30 items

---

## Size Guidelines

### MEMORY.md Target: 5–15KB
- One operator context (name, prefs): ~200 bytes
- System architecture overview: ~500 bytes
- 3–5 key lessons: ~2–3KB
- 2–3 project milestones: ~1KB
- 1–2 key decisions: ~500 bytes
- Preferences and guidance: ~1KB

**Total: Roughly 6–8KB**

If MEMORY.md exceeds 20KB:
- Archive old lessons (move to dated file)
- Remove outdated entries
- Consolidate related items
- Prioritize what's actively useful

---

## Memory Consistency

### Preventing Drift
1. MEMORY.md is the source of truth
2. Session handoffs reference MEMORY.md
3. Each new session reads MEMORY.md first
4. Don't repeat context (reference MEMORY.md instead)

### Updating Memory Consistently
- All major decisions logged with date
- Lessons captured with context (incident + prevention)
- Milestones recorded when complete
- No duplicates across entries

---

## Privacy and Security

### Read Access Control
- **MEMORY.md**: Main session only (not group chats)
- **Session Handoff**: Shared within project only
- **Session Memory**: Current session + subagents only

### Secret Protection
- Never store API keys, passwords, credentials
- If discovered: Flag, don't store
- Recommend operator secure it separately

### Context Sensitivity
- Don't infer private information from memory
- Don't share operator preferences in group contexts
- Treat memory as confidential

---

## Memory Rules Checklist

### When Reading Memory
- [ ] Re-reading established fact? Trust it
- [ ] Citing established fact? Verify it's accurate
- [ ] Finding contradictory info? Ask operator

### When Updating Memory
- [ ] Adding new lesson? Include incident + prevention
- [ ] Updating fact? Record date of update
- [ ] Removing entry? Make sure it's truly obsolete

### When Ending Session
- [ ] New lessons captured (even if not yet in MEMORY.md)?
- [ ] Project state clear (for next session)?
- [ ] No secrets in handoff?

### Monthly Maintenance
- [ ] MEMORY.md <20KB?
- [ ] All entries still relevant?
- [ ] Old lessons archived if needed?
- [ ] Most important context highlighted?

---

## Integration with Other Memory Files

This file defines the rules. See:
- **MEMORY-CONVENTIONS.md**: Full guidance on what belongs where
- **SESSION-HANDOFF-FORMAT.md**: How to structure project continuity
- **LESSONS-LEARNED-FORMAT.md**: How to capture and format lessons

See MEMORY.md for actual long-term memory content.

---

## Key Principle

**MEMORY.md is how you persist across sessions. Treat it carefully.**

- Durable entries only (lessons, decisions, context)
- Accurate and kept current
- Private and protected
- Concise and high-signal

Non-negotiable: Memory is continuity. Get it right.
