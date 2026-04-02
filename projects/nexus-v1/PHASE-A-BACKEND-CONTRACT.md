# BACKEND CONTRACT — Phase A SDK Integration & Logging

**Created**: 2026-04-03 01:50 UTC+8
**Governor**: Phase A Task 2 Specialist Briefing
**Status**: READY FOR DISPATCH
**Depends On**: Task 1 Complete (Architect protocol + 5 decisions approved)

---

## Objective

Implement the Governor ↔ Nexus integration in code: add SDK methods, integrate with Hono server routes, and add audit logging for all compile() and decision recording calls.

**In one sentence**: Make the protocol from Task 1 executable—Governor can now call SDK methods and log the calls for A-1 evidence.

---

## Constraints (What You Must Respect)

1. **No new Nexus features** — You are implementing integration points, not extending the product
2. **No breaking changes** — All existing tests must pass (214 tests currently passing)
3. **Respect locked decisions** — AMB-1, SDK architecture, async/await contracts
4. **Production-grade code** — This is real code, not scaffolding
5. **Reversible** — If Phase A loops, this code can be reverted without side effects

---

## Deliverables

**Primary** (code changes):
- `packages/sdk/src/governor-integration.ts` — Helper methods for Governor calls (compile, createDecision, updateDecisionStatus, listNotifications)
- `packages/server/src/logging.ts` — Audit logging for compile calls, decision recording, notification checks
- Updates to existing route handlers to call logging functions
- All tests passing (no regression)

**Secondary** (decision records):
- 3 decisions created in decision log (via logged SDK calls), status "pending"
  - Decision 1: SDK needs compileForAgent() method (already exists, doc it)
  - Decision 2: Governor logs all compile calls for audit
  - Decision 3: Notification check before dispatch (infrastructure)
- 1 supersede event created: Backend Decision 6 supersedes Architect Decision 1 (protocol refined during implementation)

**Tertiary** (verification):
- Evidence that you used Task 1 decisions (the 5 Architect decisions) in your implementation
- Log lines showing: compile calls, decision creations, notification checks

---

## Files in Scope

You may create/modify:
- `packages/sdk/src/governor-integration.ts` (new)
- `packages/server/src/logging.ts` (new)
- `packages/server/src/routes.ts` (existing, add logging calls)
- `packages/server/tests/` (add integration tests proving logging works)
- Decision log file (list of 3 decisions + 1 supersede event)

You may **read** (reference in code comments/docs):
- `PHASE-A-INTEGRATION-PROTOCOL.md` (what to implement)
- `PHASE-A-DECISIONS-CREATED.md` (Architect's 5 decisions)
- `packages/sdk/src/client.ts` (existing client to extend)
- `packages/server/src/index.ts` (existing server setup)

---

## Out of Scope (Explicitly NOT Your Job)

- Changing the database schema (use existing tables)
- Implementing real decision storage in DB (decisions already exist in table from prior work; just log the calls)
- WebSocket support (that's Phase C post-v1)
- Conversion of decision-log to actual DB writes (just log what **would** be written)
- Performance optimization
- Changing Hono route structure

---

## Success Criteria

You will have succeeded when:

1. **SDK methods are implemented**
   - `compileForAgent(projectId, role, options)` → returns context package (uses existing compile route)
   - `createDecision(projectId, body)` → creates decision, returns ID (uses existing decision route)
   - `updateDecisionStatus(decisionId, newStatus)` → updates decision, returns confirmation
   - `listNotifications(agentId, filter)` → lists notifications, returns array
   - All methods are async/await, typed, error-handled

2. **Logging is complete**
   - Every compile call logged: `{ timestamp, projectId, role, decisionCount, contextSize }`
   - Every decision creation logged: `{ timestamp, title, tags, made_by, edges }`
   - Every notification check logged: `{ timestamp, agentId, high-urgency-count }`
   - All logs go to `packages/server/src/logging.ts` (single source of truth)
   - Logs are readable in test output

3. **3 decisions created**
   - Decision 1: "SDK compileForAgent() method enables Governor dispatch context" (decision doc)
   - Decision 2: "Audit logging all compile calls enables A-1 evidence collection"
   - Decision 3: "Notification check prevents stale context dispatch"
   - Each has rationale, tags, status "pending"

4. **1 supersede event created**
   - Backend Decision 6: "Simplified protocol from Task 1—Governor doesn't check notifications, just compiles fresh every time"
   - Supersedes Architect Decision 4 (check notifications before dispatch)
   - Rationale: "Implementation revealed that fresh compile is simpler than notification polling"
   - This creates A-3 evidence (supersede changes downstream context)

5. **All tests pass**
   - No regression (existing 214 tests still pass)
   - New integration tests showing logging works
   - Example: test that compile() call is logged with expected fields

6. **Proof of context use**
   - Your code comments reference ≥2 of Architect's decisions
   - E.g., "Architect Decision 1 requires compileForAgent(); implementing now"
   - Shows you read the prior work, not designed in isolation

---

## Review Standard

Governor will evaluate your work on:

- **Correctness** — Do the SDK methods actually work? Do logging calls fire at the right time?
- **Completeness** — Are all 4 methods implemented? All logging points covered?
- **Code quality** — TypeScript strict, no type errors, clean structure
- **Testing** — Are new changes tested? Do existing tests still pass?
- **Evidence** — Did you actually use Task 1 decisions? Is logging visible?

If Governor finds gaps or regressions, you will rework before Task 3 begins.

---

## Timeline

**Start**: 2026-04-03 (after Governor dispatch)
**Checkpoint**: Day 1 EOD — SDK methods implemented + logging wired + tests passing
**Completion**: 2026-04-03 late or 2026-04-04 early — final review, ready for Task 3
**Due**: 2026-04-04 01:00 UTC+8

---

## Context You'll Receive

When Governor dispatches this task, you will receive:

**Compiled context** (decision-aware, role-scoped):
- Architect's 5 decisions (DECISION-PHASE-A-001 through 005)
- Prior Nexus decisions about SDK architecture, change propagator, scoring
- Governor standards (definition of done, execution persistence)
- Locked decisions (database client, async contracts)

**Inputs**:
- PHASE-A-INTEGRATION-PROTOCOL.md (what to implement)
- PHASE-A-DECISIONS-CREATED.md (Architect's 5 decisions for context)
- PHASE-A-ARCHITECT-CONTEXT-PACKAGE.md (background context)
- Existing SDK client + server code (to integrate with)

**You should**:
1. Read the protocol (5 integration points, workflows)
2. Read Architect's 5 decisions (understand the design principles)
3. Implement SDK methods that Governor will call
4. Add logging so Governor's calls are visible
5. Create 3 decisions documenting your implementation choices
6. Create 1 supersede event (protocol changed during implementation)
7. Reference Architect's decisions in your code (proof of use)

---

## Questions or Blockers?

If anything is unclear before you start:
- Ask Governor now (don't proceed with assumptions)
- Governor will clarify or escalate

---

## What Happens After You're Done

1. Governor reviews your code + 3 decisions + 1 supersede event
2. Governor runs tests, verifies logging output
3. Governor approves or asks for rework
4. Task 3 (QA) reads your code + decisions, tests the supersede scenario
5. QA creates before/after compile output showing supersede penalty

Your implementation gates Task 3 execution. Make it good.

---

**Ready to be dispatched. Awaiting Governor approval to proceed with Task 2.**
