# DEFINITION-OF-DONE.md

## Purpose
Universal done standard for major work. "Done" means objective met, scope respected, quality achieved, verified, risks documented, and ready to hand off. No vague or partial completions.

---

## Universal Done Checklist

### ✅ Objective Met
- [ ] Phase objective achieved (re-read phase scope statement)
- [ ] All deliverables created/delivered (exact file list matches scope)
- [ ] No scope creep (no extra features added without approval)
- [ ] No scope cuts (nothing promised but not delivered without approval)

**Example check**:
```
Phase scope: "Create 3 standards files: A, B, C"
Done check: Files A, B, C exist and have substantive content? Yes.
Extra files created? No.
Files cut? No.
→ Objective met ✓
```

---

### ✅ Scope Respected
- [ ] No additional files created beyond approved scope
- [ ] No changes to files outside approved scope
- [ ] If scope changed: Documented and approved
- [ ] If scope deferred: Explicitly noted for next phase

**Example check**:
```
Approved files: TOOL-USE-POLICY.md, RESEARCH-AND-BROWSER-POLICY.md

Actual files: 
- workspace/standards/TOOL-USE-POLICY.md ✓
- workspace/standards/RESEARCH-AND-BROWSER-POLICY.md ✓
- (no extras)

Files touched outside scope: 
- Checked git diff, none ✓

→ Scope respected ✓
```

---

### ✅ Quality Bar Met
- [ ] Content is substantive, not skeletal
- [ ] No vague platitudes or generic "best practices"
- [ ] Specific enough to be actionable
- [ ] Integrated with existing system (not standalone)
- [ ] Consistent with tone and style of related files

**Quality checks**:
```
Standard file review:
- Is this more than a template? Yes, fully fleshed out ✓
- Can someone follow this without asking for clarification? Yes ✓
- Does it integrate with other standards? Yes, has integration notes ✓
- Is it specific or generic? Specific (examples, checklists, concrete rules) ✓

→ Quality bar met ✓
```

---

### ✅ Verification Completed
- [ ] All required verifiers ran (see VERIFICATION-STANDARD.md)
- [ ] All verifiers passed
- [ ] Evidence collected (test output, linting results, code review, etc.)
- [ ] No false claims (did not claim success without verification)

**Verification checks**:
```
Type: Documentation / Standards Files

Required verifiers:
- Read-through? ✓ (Reviewed for clarity and completeness)
- Link check? ✓ (No external links, but internal refs verified)
- Format check? ✓ (Markdown is valid, headers consistent)
- Scope check? ✓ (Content matches phase scope)

Evidence:
- Read summary: "All 19 files reviewed; no stale references found"
- Format validation: No markdown errors
- Integration check: All cross-references verified

→ Verification complete ✓
```

---

### ✅ Risks Documented
- [ ] Identified risk category (0, 1, 2, or 3 from RISK-AND-ESCALATION-STANDARD.md)
- [ ] Known limitations listed
- [ ] Rollback plan documented (if needed)
- [ ] Dependencies clearly stated
- [ ] No hidden gotchas

**Risk documentation**:
```
Risk Category: 1 (Low risk — documentation changes)

Known Limitations:
- Standards assume Phase 6 exists (specialist agents not yet created)
- Memory model assumes MEMORY.md will be populated later
- Some standards reference tools (browser, exec) that must be configured

Rollback Plan:
If needed: rm -rf workspace/standards/ workspace/memory/MEMORY-RULES.md ...

Dependencies:
- Requires OpenClaw runtime (already present)
- Assumes English-language context

→ Risks documented ✓
```

---

### ✅ Documentation Updated
- [ ] Relevant docs updated to reflect changes
- [ ] Comments added to complex code (if applicable)
- [ ] README or overview updated (if new feature/system)
- [ ] No stale documentation references

**Documentation checks**:
```
Type: Standards implementation

Docs updated:
- AGENTS.md: Updated to reference new standards directory? (N/A for standards)
- Standards files: Include "Integration with X" sections? ✓
- Comments: Each file includes clear purpose section? ✓
- No stale references to old standards? ✓ (Checked grep)

→ Documentation up to date ✓
```

---

### ✅ Handoff Complete
- [ ] Completion summary written (what was delivered)
- [ ] Evidence provided (verification results)
- [ ] Next steps clear (what comes next)
- [ ] Context preserved (anything important for next specialist)
- [ ] Operator understands current state

**Handoff example**:
```markdown
## Phase 5 Completion Handoff

**Delivered**: 19 standards files (workspace/standards/) + 3 memory files

**Verification**: 
- All files created with substantive content
- Standards are coherent and integrated
- Cross-references verified

**Known Limitations**:
- Standards assume Phase 6 will create specialist agents
- Memory model assumes MEMORY.md will be populated

**Next Steps**:
1. Phase 6: Create specialist agent types
2. Populate MEMORY.md with initial context
3. Phase 7+: Implement workflows using standards

**Context Needed by Next Specialist**:
- Standards are now canonical (source of truth for agent behavior)
- Phase 6 should use SELF-IMPROVEMENT-POLICY.md to propose new specialists
- Phase 7 should use standards to define workflows

→ Handoff complete ✓
```

---

### ✅ Rollback Path Known
- [ ] Operator knows how to revert (git revert, restore, delete, etc.)
- [ ] Rollback procedure is documented
- [ ] Rollback has been tested (or clearly feasible)
- [ ] No data loss from rollback
- [ ] Time to recover estimated

**Rollback documentation**:
```
Rollback Procedure:

For Phase 5 (standards files):
1. Delete created files: rm -rf workspace/standards/
2. Delete memory structure files: rm workspace/memory/MEMORY-RULES.md workspace/memory/SESSION-HANDOFF-FORMAT.md workspace/memory/LESSONS-LEARNED-FORMAT.md
3. Restore git history if committed: git reset --hard HEAD~1

Time to recover: <1 minute
Data loss: None (new files, no modifications to existing data)
Verification: Re-run tests/checks on reverted state

→ Rollback path clear ✓
```

---

## Implementation Flow

### Step 1: Verification Runs
```
Phase executing → Verification runs → Collect evidence
```

### Step 2: Quality Check
```
Implementation done → Re-read scope → Check against checklist
```

### Step 3: Documentation
```
Quality verified → Update docs → Document risks → Write handoff
```

### Step 4: Sign-Off
```
Handoff complete → Re-read checklist → Claim done
```

---

## Done vs. Not Done: Examples

### Example 1: Feature Implementation

**❌ NOT DONE**:
```
"I implemented the auth system. Tests are probably passing. 
I didn't run them yet but the code looks right. Ready for production."

Missing:
- Evidence (tests not run)
- Verification (linting not checked)
- Rollback plan (not documented)
- Risk assessment (not documented)
```

**✅ DONE**:
```
"Auth system implemented and verified.

Deliverables:
- src/auth.js (JWT validation)
- src/auth.test.js (12 tests)
- docs/AUTH.md (integration guide)

Verification:
- Tests: 12/12 pass ✓
- Linting: 0 errors ✓
- Code review: Security review complete, no vulnerabilities ✓

Risks:
- Category 2 (medium risk — security-sensitive)
- If JWT secret exposed: Rotation procedure in docs/SECURITY.md

Rollback: git revert <commit-hash>

Next phase: Integration testing in staging environment
"
```

---

### Example 2: Documentation Update

**❌ NOT DONE**:
```
"Updated the standards. Everything is done now."

Missing:
- What was changed? (vague)
- Is quality high? (no indication)
- Are links valid? (not checked)
- What comes next? (unclear)
```

**✅ DONE**:
```
"Standards documentation completed.

Deliverables:
- 19 standards files in workspace/standards/
- 3 memory structure files in workspace/memory/

Quality:
- Reviewed for clarity: All standards are concrete (not generic)
- Cross-references: All integration notes verified
- Consistency: Style matches SOUL.md and existing guidance

Verification:
- Link check: All internal references verified (grep)
- Scope check: All 19 files created, none extra, none missing

Known Limitations:
- Standards assume specialists exist (Phase 6)
- Expect MEMORY.md to be populated (Phase 7)

Rollback: rm -rf workspace/standards/ workspace/memory/MEMORY-RULES.md ...

Next phase: Phase 6 (create specialist agents using SELF-IMPROVEMENT-POLICY.md)
"
```

---

## Done Checklist Template

Use this before claiming any work complete:

```markdown
## [Phase Name] — Done Checklist

### Objective Met
- [ ] Phase scope statement re-read
- [ ] All deliverables created (file list matches scope)
- [ ] No scope creep
- [ ] No unplanned scope cuts

### Scope Respected
- [ ] No extra files created
- [ ] No unauthorized changes to other files
- [ ] If scope changed: Documented and approved
- [ ] If scope deferred: Noted for next phase

### Quality Bar Met
- [ ] Content is substantive
- [ ] No generic platitudes
- [ ] Specific and actionable
- [ ] Integrated with existing system

### Verification Completed
- [ ] All required verifiers identified
- [ ] All verifiers passed
- [ ] Evidence collected (specific outputs, not claims)
- [ ] No false completion claims

### Risks Documented
- [ ] Risk category identified (0/1/2/3)
- [ ] Known limitations listed
- [ ] Rollback plan documented
- [ ] Dependencies stated
- [ ] No hidden gotchas

### Documentation Updated
- [ ] Relevant docs updated
- [ ] Comments/explanations added
- [ ] No stale references
- [ ] Operator understands context

### Handoff Complete
- [ ] Completion summary written
- [ ] Evidence provided
- [ ] Next steps clear
- [ ] Context preserved for next specialist
- [ ] Operator has confidence in state

### Rollback Path Known
- [ ] Rollback procedure documented
- [ ] Time to recover estimated
- [ ] No data loss from rollback

---

## Ready to Claim Done? ✓

All checklist items passing = Done.
```

---

## Integration with Other Standards

- **VERIFICATION-STANDARD.md**: Defines what verification means by work type
- **EVIDENCE-AND-CITATION-STANDARD.md**: Defines evidence format
- **ENGINEERING-EXECUTION.md**: Defines completion honesty principle
- **RISK-AND-ESCALATION-STANDARD.md**: Defines risk categories
- **SELF-IMPROVEMENT-POLICY.md**: How improvements flow from lessons learned

---

## Why This Matters

"Done" is where quality lives. If we're vague about done, we get:
- Incomplete work shipped (broken features)
- Silent failures (bugs not caught)
- Rework (done twice)
- Loss of trust (claims don't match reality)

This standard ensures: **When we say done, it's really done.**

Non-negotiable for all production work.
