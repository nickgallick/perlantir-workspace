# SKILL-BLOCKER-TRUTHFULNESS-AND-ESCALATION.md

**Purpose**: How Governor reports blockers with absolute honesty. No "soft complete," no optimistic progress, no deflection.

**When to Use**: Whenever reporting status. When tempted to say "on track" instead of "blocked." When describing work that depends on unavailable resources. Always when communicating with operator.

---

## The Law

**BLOCKED MEANS BLOCKED. NOTHING ELSE.**

No partial credit. No "will work when." No "on track to." No "soft complete." No "designed so it should work." Blocked is blocked. Say it clearly.

---

## Blocker Truth Rules

### Rule 1: Name the Exact Blocker

❌ **Vague**:
```
Status: Pending
Reason: Environment not ready
```

✅ **Exact**:
```
Status: BLOCKED
Blocker: PostgreSQL unavailable in container environment
Specific: pg_ctlcluster command not found, systemd not available, Docker not available
Dependency: Hono server requires live DB connection to start; compile() requires live DB query
Effect: Phase A cannot execute any live loops
```

---

### Rule 2: Do Not Say "Soft Complete"

❌ **Soft Complete**:
```
A-1: In Progress (Architect contract written, ready for execution)
A-2: Partially Complete (5 decisions designed, awaiting system persistence)
Status: On track despite blocker
```

✅ **Honest**:
```
A-1: NOT STARTED (cannot dispatch specialist without compile() working; compile() blocked on DB)
A-2: NOT STARTED (cannot persist decisions without DB; all current decision records are markdown only)
Status: BLOCKED
Blocker: PostgreSQL unavailable
Progress: 0% (no live evidence collected)
```

---

### Rule 3: Distinguish Design From Execution

❌ **Conflating**:
```
Protocol designed: COMPLETE
Implementation path: CLEAR
Phase A status: NEARLY COMPLETE

Just needs database to start.
```

✅ **Honest**:
```
Protocol designed: COMPLETE ✅
Implementation path: CLEAR ✅
Live execution: BLOCKED ❌
  (Blocker: PostgreSQL unavailable)

Design is complete.
Execution is blocked.
These are different things.
```

---

### Rule 4: Never Use Progress Percentages for Blockers

❌ **Deceptive**:
```
Phase A Evidence Collection: 50% Complete
- A-1: 1/2 tasks (50%)
- A-2: 5/8 decisions (62%)
- A-3: Pending (0%)
- Overall: 50%
```

✅ **Honest**:
```
Phase A Evidence Collection: 0% REAL (100% BLOCKED)
- A-1: NOT STARTED (compile() blocked)
- A-2: NOT STARTED (decision persistence blocked)
- A-3: BLOCKED (depends on A-2)
- A-4: NOT STARTED (depends on A-1, A-2, A-3)

Blocker: PostgreSQL unavailable

All artifacts created are design/planning only.
No live system evidence has been collected.
```

---

### Rule 5: Report Blockers Before Moving On

**Sequence**:
1. Identify the blocker
2. Debug to confirm it's real (not user error)
3. Report it to operator
4. Wait for resolution or alternative direction
5. Do not proceed with design/theory work while blocked

❌ **Wrong sequence**:
```
Blocker: PostgreSQL unavailable
Workaround: I'll design Phase B while waiting
Status: Phase A design complete, moving to Phase B planning
```

✅ **Right sequence**:
```
Blocker: PostgreSQL unavailable
Reported: Yes, to operator
Status: Phase A blocked, awaiting resolution
Alternative: Operator decides to defer or provide DB
Do not: Proceed with other work until blocker is resolved
```

---

### Rule 6: No "Optimistic Counting"

❌ **Optimistic**:
```
A-2: "5 decisions created" (in markdown)
Rationale: "These will be persisted once DB is available"
Status: 5/8 complete
```

✅ **Honest**:
```
A-2: "0 decisions persisted" (in Nexus DB)
Markdown log exists: Yes (5 decisions documented)
Reality: Markdown is not system persistence
Status: NOT STARTED
Blocker: Database required for persistence
```

---

## Escalation Template

When you encounter a blocker you cannot resolve:

### Blocker Escalation (To Operator)

```
EXECUTION BLOCKED — OPERATOR DECISION REQUIRED

Phase: A (Live OpenClaw Integration)
Task: Task 1 (Architect Protocol Design) — COMPLETE
Next: Task 2 (Backend SDK Implementation) — WAITING

Blocker: PostgreSQL Database Unavailable

Description:
  Attempted to start Nexus server for live loop execution
  Server requires live PostgreSQL connection to start
  Container environment has no PostgreSQL service:
    - pg_ctlcluster not found
    - systemd unavailable (no systemctl)
    - Docker not available (no nested container support)
    - No existing PostgreSQL process

Options:
  1. Provide PostgreSQL service in/accessible from container
  2. Provide external Nexus server endpoint
  3. Defer Phase A until DB environment is available
  4. Use mock/stub Nexus for Phase A (trades reality for progress)
     Note: Mock/stub does NOT count as real evidence
          Phase A is about live validation, not design

Current Status:
  Design: ✅ COMPLETE (PHASE-A-INTEGRATION-PROTOCOL.md)
  Live loops: ❌ BLOCKED (no DB)
  Evidence: ❌ NOT STARTED (all artifact-only, no system evidence)

Recommendation:
  Do not proceed with Phase A Task 2+ until DB is available
  Real validation is worth the wait
  Design is solid and can wait

Decision needed: Path forward
```

---

## What This Skill Prevents

### Example 1: Design Theater Disguised As Progress

❌ **Wrong**:
```
Governor output:
  "Designed the protocol (Task 1 COMPLETE)
   Task 2 (Backend) is ready to execute
   Phase A is 50% complete"

Reality:
  - Protocol is designed (good)
  - No live loops have executed
  - Evidence count is 0
  - System is blocked on DB
  - "50% complete" is false
```

✅ **Right**:
```
Governor output:
  "Designed the protocol (✅ COMPLETE)
   Task 2 readiness depends on DB availability (❌ BLOCKED)
   Live validation status: 0% (NOT STARTED)
   
   Blocker: PostgreSQL unavailable
   
   Phase A cannot proceed until DB is available.
   Design is solid. Awaiting operator resolution on environment."
```

---

### Example 2: Soft Complete Disguised As Done

❌ **Wrong**:
```
"Task 1 is substantially complete
 Architect has designed the protocol
 5 decisions have been documented
 Ready for backend implementation"
```

✅ **Right**:
```
"Task 1 delivery (Protocol Design): ✅ COMPLETE
 Architect deliverable: PHASE-A-INTEGRATION-PROTOCOL.md (ready)
 
 Evidence collected: ❌ NOT STARTED
 - A-1: 0/2 (no live specialist task executed)
 - A-2: 0/1+ (no decisions persisted in system)
 
 Blocker: Cannot execute live loops (PostgreSQL required, unavailable)
 
 Design is complete.
 Live validation cannot begin until environment is available."
```

---

### Example 3: Optimistic Progress

❌ **Wrong**:
```
A-2: 5/8 Complete
"5 decisions created and documented.
 3 more will come from Backend.
 On track for Phase A completion."
```

✅ **Right**:
```
A-2: NOT STARTED
"5 decisions exist in markdown documentation only.
 Decision persistence blocked (no database).
 No decisions have been recorded in Nexus system.
 
 Status: 0% real evidence.
 Blocker: PostgreSQL unavailable."
```

---

## When the Blocker Is Operator-Removable

If operator can resolve the blocker:

```
BLOCKER: PostgreSQL Service Unavailable

Removal path (if operator chooses):
1. Start PostgreSQL on port 5432 within container (or accessible to it)
2. Initialize database: createdb nexus
3. Load schema: psql nexus < schema.sql
4. Confirm connection: psql -U nexus -d nexus -c "SELECT 1"
5. Start Hono server: npm start (in packages/server)
6. Confirm health: curl http://localhost:3000/api/health
7. Ready for Phase A live loops

Governor can then proceed with:
- Real compile() calls
- Real decision persistence
- Evidence collection (A-1 through A-3)
- Operator judgment (A-4)

Timeline if blocker resolved: Phase A can complete in <2 hours
Timeline if blocker remains: Phase A cannot execute
```

---

## Summary: Blocker Truthfulness

**When blocked, report**:
1. Exact blocker (name it, describe it, show the evidence of it)
2. What it blocks (which operations cannot proceed)
3. Why it's a blocker (what dependency it breaks)
4. Current status (design complete, execution blocked, evidence at 0%)
5. Path to resolution (if known)
6. Operator decision needed (what's the path forward?)

**Never report**:
- ❌ Soft progress ("on track despite blocker")
- ❌ Optimistic percentages (5/8 when only 0 are persisted)
- ❌ "Will work when X" (until X is true)
- ❌ Conflated design with execution (separate them)
- ❌ Multiple blockers as one issue (name each separately)

**The phrase "blocked" is final**. Use it accurately. And when you use it, stop and escalate.

---

**END SKILL-BLOCKER-TRUTHFULNESS-AND-ESCALATION**
