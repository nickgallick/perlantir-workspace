# GOVERNOR-BLOCKER-MODEL.md

**Purpose**: How Governor identifies, debugs, reports, and resolves blockers.

---

## Blocker Definition

**Blocker**: Any condition that prevents live execution of a planned operation.

Examples:
- Environment unavailable (DB down)
- Network path broken
- System crashed
- Required service not running
- Permissions missing
- External dependency missing

**Not a blocker** (can work around):
- Design unclear → ask for clarification
- Specialist on vacation → find another specialist
- Documentation missing → write it

---

## Blocker Debugging Sequence

### Layer 1: Network/Access
- Can you reach the service? (ping, curl)
- Is the port listening? (netstat, lsof)
- Is the service responding at all?

**If fails**: Blocker identified (network/access layer)

### Layer 2: Service Running
- Is the service process running? (ps, systemctl status)
- Is it accepting connections?
- Is it responding to health checks?

**If fails**: Blocker identified (service layer)

### Layer 3: Dependencies
- Does service have access to its dependencies? (DB, cache, etc.)
- Can service connect to DB? (psql test query)
- Are migrations applied? (SELECT from tables)

**If fails**: Blocker identified (dependency layer)

### Layer 4: Operational
- Does service respond to real API call?
- Does it return expected response structure?
- Does state persist when it should?

**If fails**: Blocker identified (operational layer)

---

## Blocker Report Format

**When blocked, Governor reports**:

```
BLOCKER REPORT

Attempted: [what operation was being attempted]
Status: BLOCKED
Layer: [which debugging layer failed]
Exact Error: [exact error message or symptom]
Root Cause: [why this layer failed]
Evidence: [command run + result]

Examples:
  $ pg_ctlcluster 17 main start
  → command not found

Next: [what is needed to resolve]
  - Option 1: Start PostgreSQL service
  - Option 2: Provide external DB endpoint
  - Option 3: Defer until environment available

Blocking: [what work is blocked by this]
  - Cannot start Hono server (depends on DB)
  - Cannot execute compile() (depends on server)
  - Phase A execution blocked
```

---

## No Soft Progress When Blocked

**❌ Wrong**:
- "On track despite blocker"
- "Will work when DB is available, so proceeding with design"
- "Blocker is environmental, moving forward with protocol design"

**✅ Right**:
- "BLOCKED on PostgreSQL unavailable"
- "Cannot proceed with live execution"
- "Design is complete; live execution blocked pending DB"
- "Awaiting operator to resolve environment blocker"

---

## Blocker Resolution Options

### Option 1: Fix the Blocker (Internal)
- Governor debugs and fixes (rarely applicable)
- Time: immediate to hours
- Result: Execution resumes

### Option 2: Escalate to Operator
- Report exact blocker, exact fix needed
- Operator decides: fix it, provide workaround, or defer
- Time: depends on operator
- Result: Blocker resolved or work deferred

### Option 3: Workaround (If Applicable)
- Use alternative environment
- Use mock/stub service
- Use different approach that doesn't depend on blocked resource
- **Note**: Workaround may change evidence validity (design vs execution)

### Option 4: Defer
- Accept blocker, pause work
- Wait for environment to become available
- Resume when blocker lifted
- Time: unknown
- Result: Clear commitment to resume

---

## Blocker Escalation Trigger

**When to escalate** (immediately):
- Layer 3 or deeper (dependencies, service availability)
- External to Governor (operator must provide resource)
- Unresolvable by Governor alone (need environment change)

**Escalation message**:
```
Blocked on [exact blocker]
Reason: [why it's blocking this work]
Fix required: [exact thing operator must do]
Work affected: [what can't proceed]
Timeline: [when this would be resolved if fixed]
```

---

## Phase A Example

```
Attempted: Start Nexus server for live loop
Status: BLOCKED

Layer 3 Failure: PostgreSQL Unavailable

Evidence:
  $ psql -U nexus -d nexus -c "SELECT 1"
  psql: error: could not translate host name "localhost" to address

Debugging:
  $ pg_ctlcluster 17 main start
  → command not found

  $ systemctl start postgresql
  → systemd not available (container environment)

Root Cause: Container environment has no PostgreSQL service, no systemd, no nested Docker capability.

Next: Operator must provide one of:
  1. PostgreSQL instance accessible from container
  2. External Nexus server endpoint
  3. Defer Phase A until different environment

Blocking:
  - Cannot start Hono server
  - Cannot execute compile()
  - Cannot persist decisions
  - Phase A live execution impossible
```

---

**END GOVERNOR-BLOCKER-MODEL**
