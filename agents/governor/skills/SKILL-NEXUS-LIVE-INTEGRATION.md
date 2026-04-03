# SKILL-NEXUS-LIVE-INTEGRATION.md

**Purpose**: How Governor uses Nexus for decision recording and context compilation in live loops.

**When to Use**: During Phase A and beyond. When executing live loops that touch decision recording or context compilation.

---

## Nexus in Live Loops

### Before Specialist Dispatch (Compile)

```
1. Governor checks: Is compile() available? (environment check)
2. Governor calls: compile(projectId, agentRole, tags)
3. Server returns: context package (decisions + scores + formatted)
4. Governor passes context to specialist
5. Specialist executes task using that context
6. Specialist output references decisions from context (proof of use)
```

**Evidence**: Specialist received real context from real system

---

### After Specialist Completes (Record)

```
1. Identify decisions made during task
2. Call createDecision(title, made_by, status, tags, context)
3. Server generates UUID, persists to decisions table
4. Server returns decision ID
5. Governor logs the decision ID
6. Decision now queryable in system
```

**Evidence**: Decision persisted, queryable, has ID

---

### When Decision Supersedes Another (Verify Effect)

```
1. Create Decision B that supersedes Decision A
2. Create edge: A → B (type: "supersedes")
3. Update A: status = "superseded"
4. Call compile(same project, same role, same tags)
5. Compare before/after compile output:
   - Decision A score before: S1
   - Decision A score after: S2
   - S2 should be S1 × 0.4 (penalty for superseded)
6. Log before/after as evidence
```

**Evidence**: Score changed, penalty applied, effect observable

---

## Environment Checklist (Before Nexus Operations)

- [ ] PostgreSQL available (psql works)
- [ ] Hono server started (curl /health works)
- [ ] Migrations applied (SELECT from decisions table works)
- [ ] API key configured (if required)
- [ ] Network path open (requests reach server)

**If any fails**: BLOCKED. Escalate. Do not proceed.

---

## Nexus SDK Methods Governor Uses

| Method | Purpose | When |
|--------|---------|------|
| `compileForAgent(projectId, role, tags)` | Get context for specialist | Before dispatch |
| `createDecision(projectId, {title, made_by, status, tags})` | Record decision | After specialist completes |
| `updateDecisionStatus(decisionId, newStatus)` | Change decision status | When decision superseded |
| `createEdge(projectId, {from, to, type})` | Link decisions | When dependencies exist |
| `listNotifications(agentId, filter)` | Check for stale context | Before dispatch |

---

## Decision Hygiene Rules

**When recording decisions**:
- [ ] Title is clear (1 line, specific)
- [ ] made_by is accurate (architect, backend, governor, operator)
- [ ] status is correct (pending, active, superseded, reverted)
- [ ] tags are relevant and specific (["phase-a", "integration", ...])
- [ ] context explains WHY (rationale, constraints, tradeoffs)
- [ ] edges link to related decisions (depends on, supersedes, refined-by, etc.)

**If any missing**: Do not record. Fix first.

---

## Evidence Collection with Nexus

**A-1 Evidence** (specialist with compiled context):
- Log: compile() call + response
- Log: specialist received context
- Log: specialist task output

**A-2 Evidence** (decision persisted):
- Log: createDecision() call + response (decision ID)
- Log: SELECT query confirms decision exists in DB

**A-3 Evidence** (supersede changes context):
- Log: Before compile() → score S1
- Log: Edge created, status updated
- Log: After compile() → score S2
- Verify: S2 ≠ S1, penalty applied

---

**END SKILL-NEXUS-LIVE-INTEGRATION**
