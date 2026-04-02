# PHASE-A-INTEGRATION-PROTOCOL.md — Governor ↔ Nexus

**Created**: 2026-04-03 01:15 UTC+8
**Author**: Governor
**Status**: ACTIVE (Phase A execution)
**Prerequisite**: Nexus v1 COMPLETE, POST-V1-ROADMAP approved

---

## 1. Integration Points

### 1.1 Governor Dispatch Flow (Before Specialist Execution)

**When**: Immediately before dispatching work to a specialist
**Actor**: Governor
**Protocol**:

1. Receive operator approval for phase work
2. Identify affected project + specialist role
3. Call Nexus `compile(projectId, agentRole, tags, scope)` with:
   - `projectId`: The active project (e.g., "perlantir")
   - `agentRole`: The specialist's role (e.g., "architect", "backend", "qa")
   - `tags`: Domain tags relevant to the work (e.g., ["phase-7", "integration", "nexus"])
   - `scope`: Optional filter for decision status/recency
4. Receive compiled context package
5. Include context in specialist dispatch payload
6. Log compile call: timestamp, role, decisions included, context size
7. Specialist executes with context available

**SDK Call**:
```typescript
const context = await nexus.compileForAgent(projectId, agentRole, {
  tags: ["phase-a", "integration"],
  maxTokens: 8000,
  includeSuperseded: false
});
// Include in dispatch payload
dispatch({ objective, contract, context });
```

### 1.2 Decision Recording (After Specialist Work or Operator Approval)

**When**: 
- Operator approves a design choice (strategy decision)
- Specialist resolves an ambiguity (execution decision)
- Phase completes (milestone decision)
- Postmortem identifies a lesson (learning decision)

**Actor**: Governor or specialist (via Governor)
**Protocol**:

1. Identify decision type: strategic, architectural, execution, lessons-learned
2. Compose decision object:
   - `title`: 1-line decision name
   - `description`: Why was this decided? What alternatives existed?
   - `made_by`: "operator" | "governor" | agent role name
   - `status`: "pending" → "approved" → "active" (or "superseded" / "reverted")
   - `tags`: Domain tags for future compilation (e.g., ["phase-a", "integration", "nexus"])
   - `context`: Justification, constraints, tradeoffs
3. Create decision via SDK
4. If decision supersedes prior work, create edge: `{ from: oldDecisionId, to: newDecisionId, type: "supersedes" }`
5. Log decision: ID, title, tags, made_by
6. Return decision ID for project tracking

**SDK Call**:
```typescript
const decision = await nexus.createDecision(projectId, {
  title: "Use raw pg.Pool for database client",
  description: "Chosen over @supabase/supabase-js for lower-level control...",
  made_by: "operator",
  status: "approved",
  tags: ["nexus", "architecture", "database"],
  context: "Approved 2026-04-01. All code reflects this choice."
});

// If superseding a prior decision:
await nexus.createEdge(projectId, {
  from_decision_id: oldDecisionId,
  to_decision_id: decision.id,
  relationship_type: "supersedes"
});
```

### 1.3 Change Propagation (Notification Check Before Dispatch)

**When**: Governor prepares to dispatch work to a specialist
**Actor**: Governor
**Protocol**:

1. Before compile/dispatch, check specialist's notifications
2. Call `listNotifications(agentId)` with filter: status NOT READ, urgency = "high"
3. If `high`-urgency notifications exist (supersedes or reverts):
   - Log: "Agent has stale context, compile will refresh"
   - Compile fresh context (as per 1.1)
   - Include notification summary in dispatch
4. Mark notifications as read after dispatch

**SDK Call**:
```typescript
const notifications = await nexus.listNotifications(agentId, {
  status: "unread",
  minUrgency: "high"
});

if (notifications.length > 0) {
  console.log(`${agentId} has ${notifications.length} high-urgency notifications`);
  // Compile fresh context (will score superseded decisions lower)
  const context = await nexus.compileForAgent(projectId, role, options);
  // Include in dispatch
}
```

### 1.4 Specialist Mid-Task Context Refresh (Optional, Self-Serve)

**When**: Specialist encounters an unfamiliar decision area mid-task
**Actor**: Specialist (via SDK)
**Protocol**:

1. Specialist calls `compileForAgent()` with different tags or scope
2. Receive refreshed context for that area
3. Continue work with updated information
4. Optionally report back to Governor: "Found decision X, changed approach"

**SDK Call**:
```typescript
// Mid-task, specialist realizes they need different context
const additionalContext = await nexus.compileForAgent(projectId, agentRole, {
  tags: ["decision-areas-i-missed"],
  scope: "last-7-days",
  includeSuperseded: true
});
```

### 1.5 Phase Completion & Decision Status Update

**When**: Phase completes and Governor evaluates outcomes
**Actor**: Governor
**Protocol**:

1. For each decision made during phase, update status
2. Call `updateDecisionStatus(decisionId, newStatus)` with: "approved" → "active" or "active" → "superseded"
3. If phase itself was a decision, update its status
4. Log status changes with rationale
5. Create edges if decisions are related (dependency, causation, refinement)

**SDK Call**:
```typescript
// Phase 1 decisions are now active
await nexus.updateDecisionStatus(decision1.id, "active");

// Phase 1 revealed a better approach - supersede old decision
await nexus.updateDecisionStatus(oldApproachDecisionId, "superseded");
await nexus.createEdge(projectId, {
  from_decision_id: oldApproachDecisionId,
  to_decision_id: newApproachDecisionId,
  relationship_type: "supersedes"
});
```

---

## 2. Example: Phase A Execution Sequence

### Setup
- **Project**: "perlantir"
- **Specialist 1**: Architect (role = "architect")
- **Specialist 2**: Backend Engineer (role = "backend")
- **Phase Work**: OpenClaw Integration (add Governor ↔ Nexus protocol)

### Step 1: Operator Approval
```
Nick: "Approved. Execute Phase A as outlined. Architect first, then Backend."
Governor: Received Category 2 approval. Proceeding to Architect dispatch.
```

### Step 2: Architect Dispatch
```
Governor calls:
  nexus.compileForAgent("perlantir", "architect", {
    tags: ["phase-a", "integration", "governor-protocol"],
    maxTokens: 8000
  })

Response: 12 relevant decisions about Nexus architecture, 3 Governor standards, 
          1 prior integration attempt (superseded). Context size: 4,200 tokens.

Governor includes in dispatch:
  {
    objective: "Define Governor ↔ Nexus protocol...",
    contract: { constraints, deliverables, files_in_scope, timeline },
    context: { decisions, standards_relevant, graph_state }
  }

Log: "2026-04-03 01:20 — Architect dispatch, compile included 12 decisions, 3 standards"
```

### Step 3: Architect Work
Architect designs the protocol (this document). Creates 5 decisions:
- DECISION-001: "Governor should compile before every specialist dispatch"
- DECISION-002: "Decisions recorded after phase completion"
- DECISION-003: "Specialist can self-serve context refresh"
- DECISION-004: "Change Propagator checks before dispatch"
- DECISION-005: "Protocol includes 5 integration points"

### Step 4: Architect Records Decisions
```
await nexus.createDecision("perlantir", {
  title: "Governor should compile before every specialist dispatch",
  made_by: "architect",
  status: "pending",
  tags: ["phase-a", "governor-protocol"],
  context: "Ensures specialists have current decision context..."
})

// Repeat for all 5 decisions
// All created with status "pending" (awaiting Governor/Operator approval)
```

### Step 5: Governor Reviews Architect Output
- Verifies protocol is sound
- All 5 decisions approved by operator
- Governor updates decision statuses: "pending" → "approved"

### Step 6: Backend Dispatch
```
Governor calls:
  nexus.compileForAgent("perlantir", "backend", {
    tags: ["phase-a", "integration", "sdk-implementation"],
    maxTokens: 8000
  })

Response: Same 5 architect decisions (now status: "approved"), plus 2 prior backend 
          decisions about SDK. Context size: 3,100 tokens.

Governor includes in dispatch with updated context
```

### Step 7: Backend Work
Backend implements Governor SDK integration in 2 files. Creates 3 decisions:
- DECISION-006: "SDK client needs compile() method with role + tags"
- DECISION-007: "Governor logs all compile calls for audit"
- DECISION-008: "Notification check before dispatch prevents stale context"

### Step 8: Phase A Completion

After both tasks complete, Governor:
1. Updates all 8 decisions: "pending" → "active"
2. Creates 2 edges: DECISION-006/007/008 depend on DECISION-001/002/003
3. Records a phase-level decision: "Phase A integration protocol defined and implemented"
4. Evaluates A-1 through A-4 (evidence checklist below)

---

## 3. Success Rubric for Phase A (From POST-V1-ROADMAP)

| # | Evidence Requirement | Verification Method |
|---|---------------------|---------------------|
| **A-1** | ≥2 real specialist tasks executed with Nexus-compiled context (not demo data — actual project work dispatched by Governor) | Task logs showing compile call before dispatch + specialist receiving context package |
| **A-2** | ≥1 real decision recorded from live work (not seeded — a decision that emerged from actual execution) | Decision exists in DB with `made_by` pointing to real agent/operator, linked to real project |
| **A-3** | ≥1 supersede event that changes downstream compiled context (a decision is superseded and a subsequent compile for an affected agent produces different output than before) | Before/after compile output diff showing the superseded decision's score penalty applied |
| **A-4** | Operator judgment: brief written assessment of whether Nexus reduced manual context loading, repeated instructions, or context drift compared to pre-Nexus workflow | Operator statement in completion report (pass/fail/conditional) |

**Phase A cannot be marked complete until all 4 evidence requirements are documented. A-4 is the kill switch.**

---

## 4. State Preservation During Phase A

Governor maintains the following state files throughout Phase A:

- **projects/nexus-v1/STATUS.md** — Phase A progress, tasks, evidence collected
- **projects/nexus-v1/CHECKPOINT.md** — Execution state, recovery point, decisions made
- **projects/nexus-v1/DECISIONS.md** — Appended decisions from Phase A work (architectural, execution, lessons)
- **memory/SESSION-HANDOFF-YYYY-MM-DD.md** — Daily notes on Phase A progress, blockers, discoveries
- **MEMORY.md** — Phase A completion summary, Phase A→Phase B recommendation, operator approval status

After each task completion or daily checkpoint:
1. Update STATUS.md with new evidence
2. Append to SESSION-HANDOFF with raw notes
3. After complete phase, update CHECKPOINT.md with recovery state
4. After complete phase, update MEMORY.md with Phase A outcome

---

## 5. Risk Mitigation

**Risk 1: Specialist doesn't use compiled context**
- Mitigation: Governor validates that specialist received and read context before execution
- Evidence: Specialist mentions context in their work or references decisions from compile output

**Risk 2: Compiled context is stale or incorrect**
- Mitigation: Change Propagator checks before dispatch; Governor re-compiles if notifications exist
- Evidence: Notification logs showing what was checked, what context was refreshed

**Risk 3: Decision recording is burdensome**
- Mitigation: Phase A does not require manual recording of every small decision; only phase-level + strategic decisions
- Evidence: Time tracking shows decision recording adds <10% overhead to phase work

**Risk 4: Operator judgment (A-4) is negative**
- Mitigation: None — A-4 is the kill switch. If operator judges that Nexus added friction instead of value, Phase A loops with adjustments.
- Recovery: Re-design protocol based on operator feedback, run Phase A again

---

## 6. Transition to Phase B (Production Hardening)

**Prerequisite**: All 4 evidence requirements (A-1 through A-4) documented AND operator judgment (A-4) is positive.

**Phase B will address**:
- PB-1: Compilation performance baseline + staged enforcement (warn → CI fail)
- PH-1: Input validation on all API routes
- DX-2: Structured logging for compile calls and decision recording

**Phase B does not start until A-4 is pass/conditional.**

---

**Protocol Ready. Awaiting Operator Approval to Begin Live Integration.**
