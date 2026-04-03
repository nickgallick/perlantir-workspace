# PLAYBOOK-FIRST-LIVE-LOOP.md

**Purpose**: Step-by-step execution of the first real live loop. Proves system works.

**When to Use**: When validating a system for the first time. When proving environment is ready.

---

## Precondition Check

Before starting, confirm:
- [ ] Environment is available (DB, server, network)
- [ ] You have read SKILL-LIVE-LOOP-VALIDATION.md
- [ ] You have the exact endpoint/credentials ready

---

## Step 1: Network Access

```bash
# For local Hono server
curl http://localhost:3000/api/health

# For remote Nexus
curl https://nexus.example.com/api/health
```

**Expected**: HTTP 200 + health status response

**If fails**: BLOCKED. Cannot proceed. Escalate.

---

## Step 2: Real API Call (Compile)

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

**Expected**: 
```json
{
  "status": "ok",
  "decisions": [...],
  "formatted": "..."
}
```

**Capture**: Full response, timestamp

**If fails**: Check Layer 3 (database). Escalate.

---

## Step 3: Real API Call (Create Decision)

```bash
curl -X POST http://localhost:3000/api/projects/perlantir/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test decision from live loop",
    "made_by": "governor",
    "status": "active",
    "tags": ["test"]
  }'
```

**Expected**: 
```json
{
  "id": "abc-123...",
  "title": "Test decision from live loop",
  "created_at": "2026-04-03T..."
}
```

**Capture**: Decision ID, full response, timestamp

**If fails**: Check database. Escalate.

---

## Step 4: Verify Persistence

```bash
psql -U nexus -d nexus -c "SELECT * FROM decisions WHERE title = 'Test decision from live loop'"
```

**Expected**: One row with all fields matching Step 3 response

**If fails**: Bug in server. Escalate.

---

## Step 5: Compile Again (Downstream Effect)

Same as Step 2, but now the test decision should appear.

**Expected**: Compile returns decision we just created, with score

**If fails**: Decision not affecting compilation. Bug.

---

## Summary

✅ Network accessible
✅ compile() works
✅ createDecision() works
✅ Persistence verified
✅ Downstream effect observable

**Result**: First live loop successful. Environment is ready.

---

## Evidence to Log

```
First Live Loop Completed

1. compile() call executed: [timestamp]
   Response: [decisions count], [tokens], [format]

2. createDecision() call executed: [timestamp]
   Decision ID: abc-123
   Response: [all fields]

3. Persistence verified: [timestamp]
   SELECT query confirms decision in DB

4. Downstream compile verified: [timestamp]
   Decision appears in compile output with score

Status: Environment ready for Phase A execution
```

---

**END PLAYBOOK-FIRST-LIVE-LOOP**
