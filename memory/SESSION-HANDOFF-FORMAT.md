# SESSION-HANDOFF-FORMAT.md

## Purpose
Standard format for handing off work between sessions. Enable continuity, prevent context loss, keep next specialist informed.

---

## When to Create a Handoff

### Create Handoff If:
- Work is incomplete (spans multiple sessions)
- Project continues in next phase
- Another specialist will take over
- Context is needed for future reference

### Don't Need Handoff If:
- Phase is complete and fully done
- No future work needed
- Work is archived and won't continue

---

## Handoff Template

```markdown
# [Project/Phase Name] — Session Handoff

## Current State Summary
[1–3 sentence overview of where things stand right now]

## What Was Completed This Session
- [Deliverable 1]: Status
- [Deliverable 2]: Status
- [Deliverable 3]: Status

## What's In Progress
- [Task 1]: Current status, % complete
- [Task 2]: Current status, % complete

## What's Still To Do
- [Task 1]: What's needed
- [Task 2]: What's needed
- Priority order

## Key Files Modified
| File | Change | Verified? |
|------|--------|-----------|
| src/example.js | Added function X | ✅ |
| test/example.test.js | Added 5 tests | ✅ |

## Known Issues / Blockers
- [Issue 1]: Impact, workaround if any
- [Issue 2]: Impact, workaround if any

## Decisions Made
- [Decision 1]: Why this choice
- [Decision 2]: Why this choice

## Context for Next Session
- [Important context 1]
- [Important context 2]
- [Any gotchas to watch]

## Verification Evidence
- Tests: [Status] (e.g., "18/18 passing")
- Linting: [Status] (e.g., "0 errors")
- Code Review: [Status] (e.g., "Completed, approved")

## Rollback Plan
If work needs to be reverted:
```
git reset HEAD~[N] --hard
```
Or:
[Other revert steps]

## Next Steps
1. [What should happen next]
2. [What comes after that]
3. [Final completion criteria]

## Questions for Operator
- [Open question 1]
- [Open question 2]

## Metrics/Timeline
- Hours spent this session: [N]
- Estimated time remaining: [N]
- Next planned session: [Date/time if known]
```

---

## Handoff Sections Explained

### Current State Summary
**Purpose**: Quick snapshot of where things are.

**Good Example**:
```
Feature X is 80% complete. Core functionality works; 
edge cases need testing. No blockers; on track for completion next session.
```

**Bad Example**:
```
Stuff is being worked on.
(Too vague; next session won't know what to do)
```

---

### What Was Completed
**Purpose**: Track progress; know what's done and won't be revisited.

**Good Example**:
```
- API endpoint /users/{id}: Fully implemented and tested ✅
- User authentication: Implemented, needs integration test ⚠️
- Database schema: Created and migrations tested ✅
```

**Bad Example**:
```
- Did some work
- Fixed things
- Updated code
(Too vague; no clarity on what's actually done)
```

---

### What's In Progress
**Purpose**: Know what's partially done.

**Good Example**:
```
- User dashboard UI: 60% complete
  - Layout done, styling in progress
  - Missing: Real data integration, performance optimization

- Caching layer: 40% complete
  - Redis connection working
  - Still needed: Cache invalidation logic, monitoring
```

**Bad Example**:
```
- Stuff in progress
(No detail on status or what's needed)
```

---

### What's Still To Do
**Purpose**: Clear roadmap for next session.

**Good Example**:
```
Priority order:
1. Write integration tests for /users endpoint (4h)
2. Optimize dashboard rendering (2h)
3. Add cache invalidation (3h)
4. Performance test (2h)
```

**Bad Example**:
```
Lots of things left.
(No priority, no estimate; next person won't know where to start)
```

---

### Key Files Modified
**Purpose**: Quick reference for what changed.

**Good Example**:
```
| File | Change | Verified? |
|------|--------|-----------|
| src/api/users.js | Added GET /users/{id} endpoint | ✅ Tests pass |
| test/api/users.test.js | Added 8 integration tests | ✅ All pass |
| src/db/schema.sql | Added users table, indexes | ✅ Migration OK |
```

**Bad Example**:
```
Changed a bunch of files
(No detail; next person doesn't know what to expect)
```

---

### Known Issues / Blockers
**Purpose**: Head off problems in next session.

**Good Example**:
```
- Race condition in caching layer:
  If two requests hit simultaneously, cache may have stale data.
  Workaround: Currently using mutex (slower but safe)
  Solution needed: Implement atomic cache update

- External API latency:
  Partner's API occasionally times out (>5s)
  Impact: User requests sometimes fail
  Workaround: Retry with exponential backoff (3 retries)
```

**Bad Example**:
```
Some stuff doesn't work yet.
(Vague; next person has to discover problems)
```

---

### Decisions Made
**Purpose**: Document why we chose this path (not that path).

**Good Example**:
```
Decision: Use Redis for caching (not Memcached)
Why: JSONB support for complex objects, better CLI tooling for debugging
Trade-off: Slightly higher memory footprint than Memcached
```

**Bad Example**:
```
Used Redis
(No reasoning; next person might second-guess the choice)
```

---

### Context for Next Session
**Purpose**: Weird system behavior, things that will bite.

**Good Example**:
```
- Database migrations: Must run in specific order (001, 002, 003)
  Running out of order may cause FK constraint failures
  
- Environment variable CACHE_TTL: In milliseconds (not seconds!)
  Easy to get wrong; double-check if tests fail
  
- Third-party API: Changes endpoint names between dev and prod
  Must use environment-specific configs
```

**Bad Example**:
```
Nothing special
(If there are gotchas, next person discovers them painfully)
```

---

### Verification Evidence
**Purpose**: Proof that what was done actually works.

**Good Example**:
```
Tests: 24/24 passing ✅
  - npm test passed 2:30 PM UTC
  - No flaky tests

Linting: 0 errors ✅
  - eslint src/ (strict mode)

Code review: Approved ✅
  - Reviewed by [reviewer]
  - Comments addressed
```

**Bad Example**:
```
Should be working
(No evidence; might be broken)
```

---

### Rollback Plan
**Purpose**: How to undo this if needed.

**Good Example**:
```
Simple rollback:
git reset HEAD~5 --hard
git push origin main -f

Full rollback:
1. git reset HEAD~5 --hard
2. docker-compose down
3. docker-compose up -d
4. Wait 2 minutes for DB migration to revert
5. Confirm with: curl localhost:3000/health
```

**Bad Example**:
```
Just revert the changes
(How? Which files? Testing what?)
```

---

### Next Steps
**Purpose**: Clear priority for next session.

**Good Example**:
```
1. Write integration tests (verify feature works end-to-end)
2. Performance profiling (check if caching helps)
3. Security review (auth is Category 3; needs review)
4. Merge to main and deploy to staging

Expected time: 6–8 hours
Completion criteria: All tests pass, performance targets met, security approved
```

**Bad Example**:
```
Keep working on it
(Vague; next person doesn't know what done means)
```

---

## Handoff Examples

### Example 1: Feature In Progress

```markdown
# Feature X (User Dashboard) — Session Handoff

## Current State Summary
Dashboard UI is 75% complete. Core layout and styling done.
Real data integration started but not finished.
No blockers; on track for completion next session.

## What Was Completed This Session
- Dashboard layout: Fully designed and implemented ✅
- Styling: 90% done (dark mode still needed)
- Real data loading: Started (endpoint connected, styling pending)

## What's In Progress
- Real data display: 50% (data loads, layout in progress)
- Dark mode: Not started

## What's Still To Do
1. Complete real data display styling (2h)
2. Implement dark mode toggle (1h)
3. Performance optimization: Lazy load widgets (2h)
4. E2E testing: 8 scenarios (3h)

## Key Files Modified
| File | Change |
|------|--------|
| src/pages/Dashboard.jsx | New component |
| src/components/DashboardWidget.jsx | New component |
| test/pages/Dashboard.test.js | Added 12 tests |

## Known Issues
- Dark mode colors not finalized (waiting on design team)
  Workaround: Using default dark theme for now
  
- Widget performance: Page takes 3s to render 20 widgets
  Workaround: Only render visible widgets on initial load

## Context for Next Session
- Design team is providing dark mode colors Thursday
- Use React.lazy for widget lazy loading (example in notes/)
- Performance target: <1.5s load time (currently 3s)

## Verification Evidence
Tests: 12/12 passing ✅
Linting: 0 errors ✅
Manual test: Dashboard renders and loads data ✅

## Next Steps
1. Finalize real data display styling
2. Add dark mode (once design colors arrive)
3. Implement lazy loading for performance
4. Run E2E tests

## Questions for Operator
- Should we block release on dark mode, or ship without it?
- Performance target is 1.5s; should we optimize further?
```

---

### Example 2: Phase Complete

```markdown
# Phase 5 (Standards Implementation) — Handoff

## Current State Summary
Phase 5 is COMPLETE. All 19 standards files created with full content.
System now has explicit operating rules for all agents.

## What Was Completed This Session
- ENGINEERING-EXECUTION.md: Fully written ✅
- EDIT-SAFETY.md: Fully written ✅
- ... (15 other files) ✅
- EXTERNAL-CLAIMS-AND-MESSAGING-STANDARD.md: Fully written ✅

## What's In Progress
Nothing; phase complete.

## What's Still To Do
Phase 6 (Create specialist agents) is next priority.
Phase 5 is done and won't be revisited.

## Key Files Modified
Created workspace/standards/:
- 15 standards files (governance, execution, quality)
- 3 memory structure files (memory model)
Total: 19 new files, ~200KB content

## Known Issues
None; all standards reviewed and integrated.

## Decisions Made
Decision: Make standards comprehensive, not skeletal
Why: System maturity requires detailed guidance
Impact: Each standard is substantive (2–5KB); no platitudes

## Context for Next Session
- Standards are now canonical (source of truth)
- Phase 6 should create specialists per SELF-IMPROVEMENT-POLICY.md
- Standards assume specialists exist (will be created next)

## Verification Evidence
Content: All 19 files created, all substantive ✅
Integration: All cross-references verified ✅
Quality: No generic content, all specific to context ✅

## Rollback Plan
If needed:
rm -rf workspace/standards/ workspace/memory/MEMORY-RULES.md \
  workspace/memory/SESSION-HANDOFF-FORMAT.md \
  workspace/memory/LESSONS-LEARNED-FORMAT.md

## Next Steps
1. Phase 6: Create specialist agents (propose per SELF-IMPROVEMENT-POLICY.md)
2. Phase 7: Populate MEMORY.md with initial operator context
3. Phase 8+: Implement workflows using standards as foundation

## Questions
None; phase is complete.
```

---

## Handoff Checklist

Before marking session complete:

- [ ] Current state clearly summarized
- [ ] All completed work listed
- [ ] In-progress work status clear (% complete)
- [ ] Next steps prioritized
- [ ] Key files documented
- [ ] Blockers noted with workarounds
- [ ] Decisions documented with rationale
- [ ] Verification evidence provided
- [ ] Rollback plan documented
- [ ] Next specialist has enough context to continue

---

## Integration with Other Standards

- **MEMORY-CONVENTIONS.md**: Handoffs are Tier 2 memory
- **MEMORY-RULES.md**: Rules for handoff content
- **DEFINITION-OF-DONE.md**: Completion requires good handoff
- **LESSONS-LEARNED-FORMAT.md**: If handoff includes lessons, use that format

Non-negotiable: Good handoffs prevent context loss and rework.
