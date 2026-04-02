# SKILL-LIVE-LOOP-VALIDATION.md

**Purpose**: How Governor proves a system works in the smallest real loop, without design theater.

**When to Use**: When validating that a system actually executes as designed. Do not use this for planning, design reviews, or specification validation. Use this only when the system is supposed to be live and you need to prove it works.

---

## The Live Loop

A "live loop" is the smallest cycle that exercises the actual system:

```
Input: Real request (SDK call or HTTP request)
  ↓
System: Live service (server, database, external service)
  ↓
Output: Real response (data persisted, state changed, effect observed)
  ↓
Verification: Prove the output came from the system, not from substitution
```

A live loop is **not**:
- ❌ A design document describing how it would work
- ❌ A simulated request + simulated response
- ❌ A markdown artifact pretending to be system output
- ❌ A specialist "playing the role" of system
- ❌ A contract that says "this will happen"

A live loop **is**:
- ✅ An actual request sent to a real service
- ✅ The service responding with real data
- ✅ The response proving state was changed
- ✅ Verifiable evidence (logs, data, timestamps)

---

## Inputs Required

1. **Live environment confirmation**:
   - Service is running and responding to requests
   - Database (or equivalent state store) is available
   - Network path is open
   - Auth (if required) is configured

2. **One real request**:
   - Not simulated, not mock, not "would be"
   - Actual SDK call or HTTP request to live service
   - Captures request timestamp, parameters, headers

3. **One real response**:
   - Actual response from service
   - Not assumed, not designed, not "expected"
   - Captures response timestamp, status code, body

4. **One observable state change**:
   - Something changed in the system as a result
   - Persisted to database or equivalent
   - Queryable/verifiable after the fact
   - Example: decision created (query confirms it exists)

5. **Downstream effect**:
   - The state change affected downstream behavior
   - Not just "change was recorded" but "change affected the next operation"
   - Example: decision superseded changes how next compile() scores it

---

## Execution Method

### Step 1: Confirm Environment

**DO THIS FIRST. Do not skip.**

Confirm each of these explicitly:
- [ ] Service is running (health check succeeds)
- [ ] Database is available (connection succeeds)
- [ ] Auth is configured (if required)
- [ ] Network path is open (can reach the service)
- [ ] No "would work if X" — X must be true now

**If any fails**: STOP. Report blocker. Do not proceed. Do not substitute design for execution.

Example blocker report:
```
PostgreSQL unavailable (pg_ctlcluster not found).
Cannot proceed with live loop.
Service requires database.
Blocker: nested Docker not available in this container.
```

### Step 2: Execute One Real Request

Send a real request to the live system.

Example (SDK):
```typescript
const context = await nexusClient.compileForAgent("perlantir", "architect", {
  tags: ["phase-a"],
  maxTokens: 8000
});
```

Example (HTTP):
```bash
curl -X POST http://localhost:3000/api/projects/perlantir/decisions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test decision",
    "made_by": "governor",
    "status": "active",
    "tags": ["test"]
  }'
```

**Capture**:
- Request timestamp
- Request body/parameters
- Response status
- Response body
- Response timestamp

### Step 3: Verify State Changed

Query the system to prove the request caused a state change.

Example:
```typescript
const decision = await nexusClient.getDecision(decisionId);
console.log(`Decision persisted: ${decision.id}, created: ${decision.created_at}`);
```

**Verify**:
- State exists in database
- State has expected values
- Timestamp is recent
- No ambiguity about where the state came from

### Step 4: Prove Downstream Effect

Show that the state change affected behavior in a subsequent operation.

Example (compile context affected by new decision):
```typescript
// Before: compile without the new decision
const contextBefore = await nexusClient.compileForAgent(...);
const decisionScoreBefore = contextBefore.decisions.find(d => d.id === newDecisionId)?.score;

// Create decision
await nexusClient.createDecision(...);

// After: compile with the new decision
const contextAfter = await nexusClient.compileForAgent(...);
const decisionScoreAfter = contextAfter.decisions.find(d => d.id === newDecisionId)?.score;

// Prove it affected output
console.log(`Before: ${decisionScoreBefore}`);
console.log(`After: ${decisionScoreAfter}`);
console.assert(decisionScoreBefore !== decisionScoreAfter, "Decision affected compile output");
```

**Verify**:
- The effect is observable in the system
- The effect is not coincidental (before/after comparison proves causation)
- The effect is real (logged, persisted, measurable)

---

## Failure Modes

### Failure Mode 1: Environment Not Available

**Symptom**: Service doesn't respond, database connection fails, auth is not configured.

**What NOT to do**:
- ❌ "I'll just simulate what would happen"
- ❌ "I'll design the flow and assume it works"
- ❌ "I'll create a markdown artifact showing what would be recorded"
- ❌ Continue with other work

**What TO do**:
1. Report the blocker explicitly (exact error, exact dependency)
2. Stop the live loop
3. Escalate to operator or infrastructure (depending on severity)
4. Wait for resolution or ask operator for alternative environment

### Failure Mode 2: Response Received But State Not Persisted

**Symptom**: Service responds 200 OK, but query shows state was not actually saved.

**What NOT to do**:
- ❌ "The response indicates success, so I'll count it as done"
- ❌ "Maybe the database is slow, I'll check later"
- ❌ "It should have worked, so I'll proceed"

**What TO do**:
1. Repeat the verification query 3 times (with 1-second delays)
2. If state still doesn't appear: report failure
3. Do not count this as evidence
4. Escalate as a bug (service returning 200 but not persisting)

### Failure Mode 3: Downstream Effect Not Observable

**Symptom**: State change succeeded, but can't observe any downstream effect.

**What NOT to do**:
- ❌ "The state was recorded, so it must be affecting behavior"
- ❌ "The design says it should affect downstream, so I'll count it"
- ❌ "I'll trust that it works"

**What TO do**:
1. Try multiple downstream operations (compile with different roles, different tags)
2. If effect is still not observable: report it as a blocker
3. This might indicate: (a) bug in system, (b) test design is wrong, (c) effect is delayed
4. Do not count as evidence until you can observe it

---

## Nexus/Perlantir Examples

### Live Loop 1: Create and Retrieve a Decision

```
Input: 
  createDecision({title: "Test", made_by: "governor", status: "active"})

System:
  1. Hono server receives POST /api/projects/perlantir/decisions
  2. Route validates input
  3. Database INSERT into decisions table
  4. Server generates UUID
  5. Returns 201 + decision ID

Output:
  {id: "abc-123", title: "Test", created_at: "2026-04-03T03:35:00Z", ...}

Verification:
  1. Response status is 201
  2. Response includes decision ID
  3. Query: SELECT * FROM decisions WHERE id = 'abc-123'
  4. Confirm row exists with matching data
  5. Confirm created_at timestamp is recent
```

### Live Loop 2: Supersede Affects Compiled Context

```
Input:
  1. Create Decision A (status: active)
  2. compileForAgent("perlantir", "architect", {tags: ["test"]})
     → returns context with Decision A (score: 0.8)
  3. Create Decision B that supersedes Decision A
     → edge: A → B, type: "supersedes"
     → update Decision A status: "superseded"
  4. compileForAgent("perlantir", "architect", {tags: ["test"]})
     → returns context with Decision A (score: 0.4 penalty applied)

Verification:
  1. First compile: Decision A present, score = 0.8
  2. Second compile: Decision A present, score = 0.4 (calculated by scoring algorithm)
  3. Score difference proves the supersede status affected the calculation
  4. Log both compile outputs as evidence
```

### Live Loop 3: Change Propagator Notification Triggered

```
Input:
  1. Create Decision X, tag it ["phase-a"]
  2. Agent subscribes to ["phase-a"] notifications
  3. Supersede Decision X
  4. Query: listNotifications(agent_id, {unread: true})

Verification:
  1. Notification exists with decision_id = X
  2. Notification status = "unread"
  3. Notification urgency = "high" (supersedes are high-urgency)
  4. Notification message includes old status and new status
  5. Timestamp is recent
```

---

## Exit Criteria

A live loop is complete when:

1. ✅ Environment confirmed available (or blocker identified and reported)
2. ✅ Real request executed (captured with timestamp and parameters)
3. ✅ Real response received (captured with status and body)
4. ✅ State change verified in database (queryable, persisted)
5. ✅ Downstream effect observable (in subsequent operations)
6. ✅ Evidence logged and reproducible (another session can verify the same)

If any step is blocked or failed, report it and stop. Do not proceed past the failure.

---

## Do Not Do This

❌ **Do not substitute design for execution**
- Design: "The protocol specifies that compile is called before dispatch"
- Not live loop: "I've designed the protocol so compile will be called"
- Live loop: "I called compile(), it returned context, I dispatched a specialist with that context"

❌ **Do not use markdown as system output**
- Not live loop: "I created a markdown decision log"
- Live loop: "I called createDecision(), the server persisted it, I queried it back"

❌ **Do not roleplay as the system**
- Not live loop: "I acted as the specialist and used the context"
- Live loop: "I dispatched a real specialist with real compiled context from the system"

❌ **Do not count assumed effects**
- Not live loop: "The design says supersede affects scoring, so it must"
- Live loop: "I created a superseded decision, I queried compile output before and after, I verified the score penalty in the output"

❌ **Do not proceed when blocked**
- Not live loop: "PostgreSQL is down, but I'll design Phase A anyway"
- Live loop: "PostgreSQL is down. I cannot execute compile(). Phase A is blocked until DB is available."

❌ **Do not mix planning with validation**
- Planning: "Here's the 5-point protocol, ready for implementation"
- Not live loop validation: "Since the protocol is designed, Phase A is validated"
- Live loop validation: "I executed the protocol, the system behaved as specified, here's the evidence"

---

**END SKILL-LIVE-LOOP-VALIDATION**
