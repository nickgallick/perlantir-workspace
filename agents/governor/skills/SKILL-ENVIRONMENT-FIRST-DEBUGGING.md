# SKILL-ENVIRONMENT-FIRST-DEBUGGING.md

**Purpose**: How Governor handles blocked execution. Never substitute design for environment unavailability. Always debug the actual blocker first.

**When to Use**: Whenever a live system call fails or execution is blocked. Before proceeding with alternative approaches. Before declaring something "will work when..."

---

## The Law

**ENVIRONMENT FIRST. NOT LATER.**

When execution is blocked, Governor must confirm the environment before doing anything else. Do not design around blockers. Do not substitute theory. Do not say "if X were available, it would work." Debug X.

---

## The Debugging Sequence

### Step 1: Confirm What You're Trying To Do

State the live operation clearly:

Example:
```
I am trying to: Execute compile() against live Nexus server
Expected output: HTTP 200 + context package with decisions
Blocked? Yes, describe the block.
```

### Step 2: Confirm Each Dependency Layer

Bottom-up. Stop at the first failure.

#### Layer 1: Network Path

**Question**: Can I reach the service?

```bash
# For local Hono server
curl -v http://localhost:3000/api/health

# For remote service
curl -v https://nexus.example.com/api/health
```

**Evidence**: HTTP response (any status), OR connection refused

**If blocked**:
- Service not running
- Port not listening
- Firewall blocking
- Network down
- Stop here. Escalate. Do not proceed to Layer 2.

**If passing**: Move to Layer 2

---

#### Layer 2: Service Running

**Question**: Is the service process running?

```bash
# For Hono server (Node.js)
ps aux | grep node
lsof -i :3000 (shows what's listening on port 3000)

# For PostgreSQL
ps aux | grep postgres
sudo systemctl status postgresql

# For Docker service
docker ps (shows running containers)
```

**Evidence**: Process output shows PID, memory, command line

**If blocked**:
- Service is not running
- Service crashed on startup
- Service is hanging (CPU 0%, no responses)
- Stop here. Debug startup. Do not proceed to Layer 3.

**If passing**: Move to Layer 3

---

#### Layer 3: Service Dependencies (Database)

**Question**: Can the service access its required dependencies?

For Nexus:
```bash
# Test database connection
psql -U nexus -d nexus -h localhost -c "SELECT 1"

# Or through Node
node -e "const pg = require('pg'); new pg.Pool({connectionString: process.env.DATABASE_URL}).query('SELECT 1').then(console.log).catch(console.error)"

# Check migrations ran
psql -U nexus -d nexus -c "\dt" (shows tables)
```

**Evidence**: Query succeeds or fails with specific error

**If blocked**:
- Database not running
- Connection credentials wrong
- Database not initialized
- Migrations not applied
- Stop here. Debug database. Do not proceed.

**If passing**: Move to Layer 4

---

#### Layer 4: Service Responds to Real Request

**Question**: Does the actual endpoint respond to requests?

```bash
curl -X POST http://localhost:3000/api/projects/perlantir/decisions \
  -H "Content-Type: application/json" \
  -d '{"title": "test", "made_by": "governor", "status": "active", "tags": ["test"]}'
```

**Evidence**: HTTP response (200, 400, 500, etc.), response body

**If blocked**:
- Endpoint not implemented
- Route not registered
- Service crashing on request
- Timeout
- Stop here. Debug the endpoint. Do not proceed.

**If passing**: Layer 4 passed. Service is reachable and responds.

---

### Step 3: Execute the Real Operation

Now that you know each layer is working, execute the actual operation.

```bash
# Real compile call
curl http://localhost:3000/api/projects/perlantir/compile \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "perlantir",
    "agentRole": "architect",
    "tags": ["phase-a"],
    "maxTokens": 8000
  }'
```

### Step 4: Verify State Change

```bash
# If operation was "create decision", verify it persisted
psql -U nexus -d nexus -c "SELECT * FROM decisions WHERE title = 'test'"
```

### Step 5: Document the Blocker or Success

**If blocked**: Report exact layer where it failed
```
Blocker: Layer 2 (Service Running)
  ps aux | grep node shows NO process
  Hono server never started
  Cause: NODE_ENV=test mode requires NODE_ENV=development for Hono startup
  Next: Start Hono with NODE_ENV=development
```

**If successful**: Log what you executed and the response
```
compile() executed successfully
  Request: POST /api/projects/perlantir/compile
  Response: 200 OK, 5 decisions in response
  Decisions: DECISION-1, DECISION-2, ... (list them)
  Context size: 4200 bytes
```

---

## Current Phase A Environment Debug

Apply the sequence to Phase A:

### Layer 1: Network Path to Hono Server
```
Question: Can I reach localhost:3000?
Test: curl http://localhost:3000/api/health
Result: Connection refused
Status: FAILED at Layer 1
Cause: Server is not running
```

### Layer 2: Is Hono Server Running?
```
Question: Is the Hono process running?
Test: ps aux | grep node
Result: No node processes
Status: FAILED at Layer 2
Cause: Hono was never started
```

### Layer 3: Can Hono Start?
```
Question: Can Hono start given environment?
Test: cd /data/.openclaw/workspace/nexus/packages/server && npm start
Result: Startup attempts to connect to PostgreSQL
         pg.Pool({connectionString: DATABASE_URL})
         Connection fails: ECONNREFUSED 127.0.0.1:5432
Status: FAILED at Layer 3
Cause: PostgreSQL unavailable
```

### Layer 3.1: Is PostgreSQL Running?
```
Question: Is PostgreSQL listening on :5432?
Test: psql -U nexus -d nexus -h localhost -c "SELECT 1"
Result: psql: error: could not translate host name "localhost" to address: Temporary failure in name resolution
Status: FAILED - PostgreSQL not running
```

### Layer 3.2: Can PostgreSQL Start in This Environment?
```
Question: Can PostgreSQL start in this container?
Test: pg_ctlcluster 17 main start
Result: command not found
Test: sudo systemctl start postgresql
Result: systemd not available
Test: docker run -d postgres
Result: Docker not available (nested container)
Status: FAILED - No PostgreSQL available in this environment
```

### Final Blocker

```
PRIMARY BLOCKER: PostgreSQL unavailable in container

This is a sandboxed container environment:
- No systemd
- No nested Docker
- No process manager for PostgreSQL
- No access to prior session's PostgreSQL

IMPLICATION:
- Hono server cannot start (requires DB connection)
- compile() cannot execute (requires live DB)
- createDecision() cannot execute (requires live DB)
- No Phase A live loops can execute until DB is available

RESOLUTION OPTIONS:
1. Get a persistent PostgreSQL container/service outside this sandbox
2. Access an external Nexus server (different environment)
3. Skip Phase A live validation until DB environment is available
4. Operator decision: defer Phase A or provide alternative environment
```

---

## What NOT To Do When Blocked

❌ **Do not design around the blocker**
- WRONG: "PostgreSQL is blocked, so I'll design the protocol instead"
- RIGHT: "PostgreSQL is blocked. Phase A cannot execute. Escalate."

❌ **Do not substitute theory for environment**
- WRONG: "The design proves it would work, so I'll count it as validated"
- RIGHT: "The design is complete. Live validation is blocked on DB. Can't count it."

❌ **Do not say "will work when..."**
- WRONG: "This will work when PostgreSQL is available, so I'll proceed"
- RIGHT: "This will work when PostgreSQL is available. Currently blocked."

❌ **Do not create extra documentation to justify blocked status**
- WRONG: Create reports and summaries about why it would work
- RIGHT: State the blocker and stop.

---

## Escalation When Blocked

When a live operation is blocked and you cannot resolve it, escalate immediately.

**Escalation message format**:
```
PHASE A EXECUTION BLOCKED

Attempted: compile() against live Nexus
Blocker: PostgreSQL unavailable (container environment limitation)
Layer 3 failure: Cannot establish DB connection to localhost:5432

Evidence of blocker:
- pg_ctlcluster not found
- systemd unavailable
- Docker not available (nested container)
- No existing PostgreSQL service running

Options:
1. Provide PostgreSQL service outside container
2. Provide external Nexus server access
3. Defer Phase A until DB environment available
4. Operator decision on path forward

Current Phase A status: NOT STARTED (awaiting environment resolution)
```

That's it. Clear, factual, no theater.

---

**END SKILL-ENVIRONMENT-FIRST-DEBUGGING**
