# PHASE-A-LIVE-LOOP-PLAN.md

**Purpose**: Exact procedure to execute first live loop when environment available

**Status**: PENDING ENVIRONMENT (PostgreSQL required)

---

## Exact Path to Live Nexus

### Prerequisite: PostgreSQL Available

Required: PostgreSQL 16+ accessible on port 5432, database "nexus" created, migrations applied.

Check:
```bash
psql -U nexus -d nexus -h localhost -c "SELECT * FROM decisions LIMIT 1"
```

If fails: BLOCKED. Cannot proceed.

---

## Step 1: Start Hono Server

```bash
cd /data/.openclaw/workspace/nexus/packages/server
npm start
```

Expected:
```
Server listening on port 3000
Database connected
```

If fails: Check DATABASE_URL, confirm PostgreSQL is running

---

## Step 2: First Real Compile() Call

```bash
curl -X POST http://localhost:3000/api/projects/perlantir/compile \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "perlantir",
    "agentRole": "architect",
    "tags": ["test"],
    "maxTokens": 8000
  }'
```

Expected response:
```json
{
  "status": "ok",
  "decisions": [...],
  "scores": {...},
  "formatted": "..."
}
```

If succeeds: ✅ A-1 first step done

---

## Step 3: First Real Decision Write

```bash
curl -X POST http://localhost:3000/api/projects/perlantir/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test decision from live loop",
    "made_by": "governor",
    "status": "active",
    "tags": ["phase-a", "live-test"]
  }'
```

Expected response:
```json
{
  "id": "abc-123...",
  "title": "Test decision from live loop",
  "created_at": "2026-04-03T..."
}
```

Note the decision ID. If succeeds: ✅ A-2 done

---

## Step 4: Verify Decision Persisted

```bash
psql -U nexus -d nexus -c "SELECT * FROM decisions WHERE title = 'Test decision from live loop'"
```

Expected: One row with all fields matching Step 3 response

If fails: Bug in server (decision not actually persisted)

If succeeds: ✅ A-2 confirmed persisted

---

## Step 5: Compile Again to Show Decision in Context

```bash
curl -X POST http://localhost:3000/api/projects/perlantir/compile \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "perlantir",
    "agentRole": "architect",
    "tags": ["phase-a"],
    "maxTokens": 8000
  }'
```

Expected: New decision appears in compile output with score

If succeeds: ✅ A-3 part 1 done (decision in system affects compile)

---

## Step 6: Supersede the Decision

Record which decision ID from Step 3 appears in Step 5 output.

Create a new decision that supersedes it:

```bash
curl -X POST http://localhost:3000/api/projects/perlantir/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test decision superseded",
    "made_by": "governor",
    "status": "active",
    "tags": ["phase-a", "live-test"]
  }'
```

Get the new decision ID from response. Call it DECISION-B.

Then create edge:

```bash
curl -X POST http://localhost:3000/api/projects/perlantir/edges \
  -H "Content-Type: application/json" \
  -d '{
    "from_decision_id": "abc-123...",
    "to_decision_id": "def-456...",
    "relationship_type": "supersedes"
  }'
```

Update old decision status:

```bash
curl -X PUT http://localhost:3000/api/projects/perlantir/decisions/abc-123... \
  -H "Content-Type: application/json" \
  -d '{"status": "superseded"}'
```

---

## Step 7: Compile Again to Show Score Penalty

```bash
curl -X POST http://localhost:3000/api/projects/perlantir/compile \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "perlantir",
    "agentRole": "architect",
    "tags": ["phase-a"],
    "maxTokens": 8000
  }'
```

Expected: Old decision now appears with 0.4 penalty (superseded status applied)

Compare to Step 5 output:
- Before: old decision score = 0.8 (example)
- After: old decision score = 0.32 (0.8 × 0.4 penalty)

If scores differ: ✅ A-3 done (supersede changes compiled context)

---

## Evidence Log

When all steps succeed, log:

```
A-1: ✅ COLLECTED
  - Step 2: compile() called, returned 200 + context
  - Downstream effect: Step 5 shows decision in context

A-2: ✅ COLLECTED
  - Step 3: createDecision() called, returned decision ID
  - Step 4: Verified in database (SELECT returned row)
  - Proof: Decision persisted in Nexus

A-3: ✅ COLLECTED
  - Step 6: Supersede edge created, old decision status updated
  - Step 7: Compile output shows score penalty (0.8 → 0.32)
  - Proof: Supersede changed downstream compile output

A-4: PENDING
  - Operator must judge: "Did Nexus reduce friction?"
```

---

## Exact Blocker (If Blocked)

If any step fails, report:

```
Blocker: [name of step that failed]

Step: [which step]
Operation: [what you tried]
Error: [exact error message]
Cause: [why it failed]

Cannot proceed to next step.

Options:
1. Fix the blocker (specific fix needed)
2. Escalate (if blocker is environment)
3. Defer Phase A (if blocker cannot be fixed)
```

---

## Success Condition

Phase A live loop is READY when:

1. ✅ PostgreSQL available and confirmed
2. ✅ Hono server starts and listens on :3000
3. ✅ All 7 steps above execute without error
4. ✅ A-1, A-2, A-3 evidence logged
5. ✅ Operator provides A-4 judgment

**Current status**: BLOCKED at prerequisite (PostgreSQL unavailable)

**Resolution**: Operator must provide PostgreSQL access or defer Phase A

---

**END PHASE-A-LIVE-LOOP-PLAN**
