# PLAYBOOK-BLOCKED-ENVIRONMENT.md

**Purpose**: What to do when environment blocker prevents execution.

**When to Use**: When environment check fails. When execution is impossible.

---

## When Blocked

```
You have attempted: [operation]
Result: BLOCKED

Layer failed: [which debugging layer]
Error: [exact error]
Root cause: [why this layer failed]
```

---

## Do NOT Do

❌ Design the next phase while blocked
❌ Proceed with theory work as substitution
❌ Assume blocker will resolve itself
❌ Work around with mocks/stubs (unless explicitly approved)
❌ Count design work as evidence

---

## DO Do

✅ Report blocker exactly
✅ Stop execution
✅ Escalate to operator
✅ Wait for resolution or approval to defer

---

## Blocker Report Template

```
BLOCKER REPORT

Attempted: [operation that was attempted]
Status: BLOCKED

Debugging:
  Layer 1 [network/access]: [result]
  Layer 2 [service running]: [result]
  Layer 3 [dependencies]: [result]
  Layer 4 [operational]: [result]

Failed at: Layer [N]
Error: [exact error message or symptom]
Evidence: [command run + output]

Root Cause:
  [why this layer failed]
  [why it's not easily fixable by Governor]

What is Blocked:
  - [operation blocked]
  - [what cannot proceed]
  - [how long until blocker is resolved, if known]

Options:
  1. Fix the blocker: [exact steps operator must take]
  2. Provide alternative: [what alternative would work]
  3. Defer: [what work is deferred]

Recommendation: [Governor's suggestion]

Awaiting: Operator decision on which path forward
```

---

## Example: PostgreSQL Blocked Phase A

```
BLOCKER REPORT

Attempted: Start Nexus server to execute Phase A live loop
Status: BLOCKED

Debugging:
  Layer 1 [network/access]: localhost:5432 → connection refused
  Layer 2 [service running]: systemctl status postgresql → systemd not available
  Layer 3 [dependencies]: pg_ctlcluster 17 main start → command not found
  Layer 4 [operational]: (never reached)

Failed at: Layer 3
Root Cause: Container environment has no PostgreSQL service, no systemd, no nested Docker

Evidence:
  $ pg_ctlcluster 17 main start
  → command not found

  $ sudo systemctl start postgresql
  → Failed to get D-Bus connection: Operation not permitted

  $ docker run postgres
  → Docker not available (nested container not allowed)

What is Blocked:
  - Hono server cannot start (requires live DB)
  - compile() cannot execute (requires live DB)
  - createDecision() cannot execute (requires live DB)
  - Phase A live execution impossible
  - Estimated duration: until DB available

Options:
  1. Start PostgreSQL inside container
     Operator must provide way to run PostgreSQL service
  
  2. Provide external Nexus server
     Operator provides endpoint + credentials
  
  3. Defer Phase A
     Continue with design work until environment available
     Resume Phase A when DB is accessible

Recommendation: Option 2 (external server) is fastest path to Phase A execution

Awaiting: Operator decision
```

---

## After Blocker Resolved

Once operator provides resolution:

1. Confirm blocker is actually resolved
2. Execute PLAYBOOK-FIRST-LIVE-LOOP
3. Confirm environment is ready
4. Resume Phase A

If blocker is NOT resolved: Report again, exact error.

---

**END PLAYBOOK-BLOCKED-ENVIRONMENT**
