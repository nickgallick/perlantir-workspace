# PHASE-A-ARCHITECT-CONTEXT-PACKAGE.md

**Compiled For**: Architect (role: architect)
**Compiled By**: Governor
**Compiled At**: 2026-04-03 01:40 UTC+8
**Tags**: ["phase-a", "integration", "governor-protocol"]
**Scope**: nexus-v1 project, decisions relevant to integration

---

## What This Is

This is **compiled context** — prior decisions from Nexus v1 and Governor that are relevant to your Task 1 (protocol design). Governor compiled this using role-differentiated scoring.

Read this before designing the protocol. Reference at least 2 of these decisions in your protocol rationale (proof of context use).

---

## Core Architecture Decisions (Nexus v1)

### DECISION: AMB-1 RESOLVED — Database Client Stack

**Title**: Use raw `pg` (node-postgres) with `pg.Pool` — no Supabase

**Status**: APPROVED (locked, 2026-04-01)

**Made By**: Architect

**Context**: 
- Supabase SDK adds abstraction layer + managed auth overhead
- Raw pg.Pool provides lower-level control, necessary for custom connection handling
- Nexus needs to support pgvector + custom migrations
- Locked decision: all code reflects this choice

**Relevance to Phase A**: 
- Governor ↔ Nexus integration will use SDK client (NexusClient)
- NexusClient sits atop pg.Pool in the server
- Decision-recording calls flow through: Governor → SDK client → Hono route → decision CRUD → pg.Pool
- You don't need to change this; just understand the layer stack

**Edges**: None (no prior decision superseded)

---

### DECISION: Nexus Scoring Algorithm (5-Signal Composition)

**Title**: Decisions scored by relevance×0.7 + freshness×0.3 (composite formula)

**Status**: ACTIVE (v1 complete, 2026-04-02)

**Made By**: Backend (Day 3 implementation)

**Context**:
- Direct affect signal: role relevance (matching agent tags to decision tags)
- Tag matching: explicit tags on decision (e.g., "phase-5", "integration")
- Role relevance: role-to-tag weight map (architect cares about design decisions)
- Semantic similarity: embedding distance for natural language matching
- Freshness: decisions older than 14 days score lower
- Status penalty: superseded decisions scored 0.4, reverted 0.1
- Final score: min(1.0, relevance×0.7 + freshness×0.3)

**Relevance to Phase A**:
- When Governor calls `compileForAgent("perlantir", "architect", tags)`, this scoring happens
- You need to understand what context the Architect receives (it will be scored by this formula)
- Decisions you create in Task 1 will be scored this way when other agents request context later
- Tag your decisions well (tags drive score)

**Edges**: Depends on role-differentiation proof (test case)

---

### DECISION: Change Propagator Pattern (Notification-Driven Context Refresh)

**Title**: Notify agents when decisions they depend on are superseded/reverted

**Status**: ACTIVE (v1 complete, 2026-04-02)

**Made By**: Backend (Day 5 implementation)

**Context**:
- When decision X is superseded by decision Y, agents subscribed to X's tags get `high`-urgency notification
- Agents can poll notifications or receive via WebSocket (post-v1)
- Specialists see stale context = context is stale until re-compiled
- Change Propagator tracks who cares about what (agent subscriptions)
- Notifications include: decision ID, old status, new status, urgency level

**Relevance to Phase A**:
- Phase A protocol must include a step: "Governor checks notifications before dispatching specialist"
- If a specialist has `high`-urgency notifications (supersede/revert), Governor re-compiles fresh context
- You are designing when this happens and how Governor responds
- The infrastructure (Change Propagator) already exists; you're just specifying when Governor uses it

**Edges**: Depends on scoring decision (why notifications matter)

---

### DECISION: SDK Client Architecture (Synchronous Request-Response)

**Title**: NexusClient.compile() and .createDecision() are async/await, not streams

**Status**: ACTIVE (v1 complete, 2026-04-02)

**Made By**: Backend (Day 6–7)

**Context**:
- Client methods: `compileForAgent(projectId, role, options)`, `createDecision(projectId, body)`, `updateDecisionStatus(id, status)`, `listNotifications(agentId, filter)`
- All methods return Promise<T> (async)
- Error handling: NexusApiError class preserving server error envelope
- No streaming context or async iterators (simple, synchronous contracts)

**Relevance to Phase A**:
- You are designing when/how Governor calls these SDK methods
- Integration protocol will specify: Governor calls `compileForAgent()` with specific parameters
- Governor calls `createDecision()` with specific payload shape
- Know that these are async calls (timing matters in dispatch workflow)

**Edges**: Foundation for all Governor integration points

---

## Governor Execution Model (From Governor AGENT.md)

### DECISION: Specialist Briefing Structure (8 Required Elements)

**Title**: Every specialist receives: objective, constraints, deliverables, files_in_scope, out_of_scope, success_criteria, review_standard, timeline

**Status**: ACTIVE (governance, applies to all work)

**Made By**: Governor (operating loop rule)

**Context**:
- Specialist briefing is not "go figure it out" — it's a formal contract
- Every briefing has these 8 elements, non-negotiable
- Specialist can ask clarifying questions before starting
- Governor is accountable for specialist work quality

**Relevance to Phase A**:
- You (Architect) are receiving this briefing
- Task 2 (Backend) will receive a briefing based on your protocol output
- Task 3 (QA) will receive a briefing based on Task 2 output
- Protocol should specify: who acts, what they do, what they produce, what success looks like
- This is the briefing template you're designing for future specialists

**Edges**: Governs specialist dispatch (your Task 1 output will be Task 2's briefing)

---

### DECISION: Phase Architecture (Sequential Phases with Approval Gates)

**Title**: Work is phased. Each phase requires operator approval before starting. Phase N-1 output informs Phase N plan.

**Status**: ACTIVE (governance)

**Made By**: Governor (operating loop rule)

**Context**:
- No auto-progression (Phase 2 does not start because Phase 1 is done)
- Operator must explicitly approve "Phase 2, execute as follows..."
- Phases may have sub-phases or tasks, but all are sequenced
- Phase completion triggers review gates (did we meet criteria?)

**Relevance to Phase A**:
- Phase A is itself 3 sequential tasks (Architect → Backend → QA)
- Each task completes → review → next task starts
- You are designing the integration protocol; Backend implements it; QA verifies
- Protocol should assume sequential execution (not parallelized)

**Edges**: Underlies Phase A structure itself

---

## Integration-Relevant Standards (From workspace/standards/)

### DECISION: Definition of Done (8-Category Checklist)

**Standard**: `standards/DEFINITION-OF-DONE.md`

**Applies To**: Every specialist deliverable

**Categories**:
1. Objective met (did we solve the stated problem?)
2. Scope boundary respected (in/out of scope honored)
3. Quality bar met (production-grade, defensible)
4. Verification complete (no false claims)
5. Risks identified (what could go wrong?)
6. Documentation complete (can others understand this?)
7. Handoff complete (next specialist has what they need)
8. Rollback planned (if needed, can we undo?)

**Relevance to Phase A**:
- Task 1 deliverable (protocol) must satisfy all 8
- Task 2 deliverable (SDK implementation) must satisfy all 8
- Task 3 deliverable (verification + evidence) must satisfy all 8
- You are designing a protocol that meets this standard

**Edges**: Quality governance for all Phase A work

---

### DECISION: State Preservation Standard (CHECKPOINT.md System)

**Standard**: `standards/EXECUTION-PERSISTENCE-STANDARD.md`

**Applies To**: Governor execution + project state

**Key Rules**:
- After each meaningful work, update: STATUS.md, CHECKPOINT.md, DECISIONS.md
- CHECKPOINT.md is the recovery point (if session ends, resume from here)
- State files must be in sync (no orphaned decisions, all file edits tracked)
- 10 mandatory write triggers (phase complete, decision made, scope change, etc.)

**Relevance to Phase A**:
- As you work (Task 1), decisions you create are logged to DECISIONS.md
- STATUS.md is updated with evidence collected (A-1 through A-4 rubric)
- If session ends, CHECKPOINT.md allows next session to resume without re-reading everything
- You are designing a protocol that produces durable state (decisions in DB, not ephemeral)

**Edges**: Underpins state preservation for Phase A

---

## Success Rubric (From POST-V1-ROADMAP.md)

### A-1: ≥2 Specialist Tasks with Compiled Context

**Requirement**: 2 real tasks executed with Nexus-compiled context (not demo seeded data)

**Evidence**: Task logs showing compile call before dispatch + specialist receiving context package

**Relevance**: Your protocol specifies when Governor calls compile(). Task 2 (Backend) will execute against this spec + receive compiled context. That's A-1 evidence.

---

### A-2: ≥1 Real Decision from Live Work

**Requirement**: ≥1 decision recorded from actual execution (not pre-loaded demo)

**Evidence**: Decision exists in DB with `made_by` pointing to real agent/operator, linked to real project

**Relevance**: You create 5 decisions in Task 1 (integration design choices). Those are real decisions, not seeded. Each decision references prior work (AMB-1, scoring algorithm, etc.). That's A-2 evidence.

---

### A-3: ≥1 Supersede Event Changes Compiled Context

**Requirement**: A decision is superseded and a subsequent compile produces different output

**Evidence**: Before/after compile output showing the superseded decision's score penalty applied

**Relevance**: Task 2 (Backend) creates a supersede event (one of its decisions supersedes something). Task 3 (QA) verifies that compile output changes. Your protocol specifies when this happens.

---

### A-4: Operator Judgment

**Requirement**: Did Nexus reduce manual context loading, repeated instructions, or context drift compared to pre-Nexus workflow?

**Evidence**: Operator statement (pass/fail/conditional)

**Relevance**: After all tasks, you (and all specialists) will write 1-2 sentences: "Did using Nexus context help? Did it reduce friction?" That's A-4 evidence.

---

## Your Task (Reminder)

**Objective**: Design the Governor ↔ Nexus protocol (5 integration points, workflows, state preservation, example).

**Deliverables**:
1. PHASE-A-INTEGRATION-PROTOCOL.md (already drafted, ready for refinement)
2. 5 decisions created in Nexus DB (via SDK mock, since DB unavailable)

**Context You've Received**:
- 3 prior architecture decisions (AMB-1, scoring, change propagator)
- 2 governor decisions (briefing structure, phase architecture)
- 2 governance standards (definition of done, state preservation)
- 4 success criteria (A-1 through A-4)

**What You Should Do**:
1. Read this context
2. Review PHASE-A-INTEGRATION-PROTOCOL.md (already complete)
3. Refine if needed based on context
4. Create 5 integration decisions (SDK calls, logged to decision list)
5. Submit for review

**Success Criteria**:
- Protocol references ≥2 of the decisions above (proof of context use)
- 5 decisions created, status "pending" (awaiting Backend implementation)
- Decision edges map dependencies (e.g., Decision-006 depends on Decision-001)
- No ambiguity for Task 2 (Backend) to implement

---

## How to Reference This Context

In your protocol or decision descriptions, cite like:

> "We compile context before dispatch because the scoring algorithm (decision NEXUS-SCORING) shows that role-matched decisions score higher than generic ones. Governor needs fresh context to dispatch specialists effectively."

> "Change Propagator pattern (decision NEXUS-CHANGE-PROPAGATOR) means Governor must check notifications before dispatch — a specialist with stale context is useless."

> "SDK client is async/await (decision NEXUS-SDK-ARCHITECTURE), so compile() and createDecision() are non-blocking. Governor can parallelize context loads for multiple specialists."

---

## Next Steps

1. **Review this context** — Understand the decisions that led to Nexus
2. **Refine PHASE-A-INTEGRATION-PROTOCOL.md** — Already complete, but adjust if this context reveals gaps
3. **Create 5 decisions** — Document your integration design choices:
   - Decision 1: Governor should compile before every specialist dispatch
   - Decision 2: Decisions recorded after phase completion
   - Decision 3: Specialist can self-serve context refresh mid-task
   - Decision 4: Change Propagator checks before dispatch
   - Decision 5: Protocol integration points + workflow
4. **Submit for review** — Governor will review + approve or ask for rework

**Timeline**: Complete by EOD 2026-04-03

---

**Context compiled and delivered. Ready for Task 1 execution.**
