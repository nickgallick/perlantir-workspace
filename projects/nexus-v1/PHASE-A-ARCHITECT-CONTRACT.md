# ARCHITECT CONTRACT — Phase A Integration Protocol Design

**Created**: 2026-04-03 01:25 UTC+8
**Governor**: Phase A Task 1 Specialist Briefing
**Status**: READY FOR DISPATCH
**Requires**: Governor approval + operator approval

---

## Objective

Design the Governor ↔ Nexus integration protocol: specify when Governor calls compile(), how decisions are recorded, how change propagation triggers context refresh, and how the 5-integration-point workflow maintains consistency across specialist tasks.

**In one sentence**: Define exactly how Governor and Nexus talk to each other so that specialists receive decision-aware context before dispatch.

---

## Constraints (What You Must Respect)

1. **No new Nexus features** — You are designing integration points, not extending the API
2. **No changes to Nexus schema** — Use existing Decision, Edge, Agent, Project tables
3. **Respect locked decisions** — AMB-1 (raw pg.Pool), stack choices, existing architecture
4. **Production-grade thinking** — This protocol must be executable by Governor in real OpenClaw sessions; it cannot be theoretical
5. **Reversible design** — The protocol must allow Governor to integrate without breaking existing Nexus functionality

---

## Deliverables

**Primary** (governance artifact):
- `PHASE-A-INTEGRATION-PROTOCOL.md` — 5 integration points, workflows, state preservation, example sequence

**Secondary** (decision records):
- 5 decisions created in Nexus DB (via SDK), all status "pending" (awaiting approval)
  - Decision 1: Governor should compile before every specialist dispatch
  - Decision 2: Decisions recorded after phase completion
  - Decision 3: Specialist can self-serve context refresh mid-task
  - Decision 4: Change Propagator checks before dispatch
  - Decision 5: Protocol integration points + workflow

**Tertiary** (proof of use):
- Evidence that you used compiled context from prior Nexus decisions to design this protocol
- Reference at least 2 decisions from the v1 build in your design rationale

---

## Files in Scope

You may create/modify:
- `projects/nexus-v1/PHASE-A-INTEGRATION-PROTOCOL.md` (primary)
- `projects/nexus-v1/PHASE-A-DECISIONS.md` (list of 5 decisions you created)
- Decisions in Nexus DB (via SDK, captured in session log)

You may **read** (reference in rationale):
- `POST-V1-ROADMAP.md` (Section 2.x defines the workflows)
- `agents/architect/capabilities/NEXUS-LOCKED-DECISIONS.md`
- `projects/nexus-v1/spec/` (the v1 algorithm + schema)
- `agents/COORDINATION.md`

---

## Out of Scope (Explicitly NOT Your Job)

- Implementation code (Task 2, Backend)
- Verification testing (Task 3, QA)
- Governor's dispatcher code (that's multi-phase work)
- Changes to Nexus server or SDK internals
- Product features or roadmap adjustments
- Performance optimization

---

## Success Criteria

You will have succeeded when:

1. **Protocol is complete** — 5 integration points are defined with clear workflows
   - When Governor calls compile (and why)
   - When decisions are recorded (and what gets recorded)
   - When change propagation triggers context refresh
   - When specialists refresh context mid-task
   - When phase completion updates decision statuses

2. **Protocol is executable** — Governor can read the protocol and implement it without ambiguity
   - Each point specifies: trigger, actor, inputs, outputs, SDK calls
   - Example sequence shows a realistic Phase A workflow
   - State preservation rules are explicit

3. **Protocol references design decisions** — The 5 decisions capture the "why" of the protocol
   - Not just "we do X"; but "we do X because of Y constraint"
   - Decisions are linked (edges show dependencies)
   - 1 decision supersedes a prior related decision (if one exists)

4. **Proof of context use** — Your design references ≥2 Nexus v1 decisions
   - E.g., "Decision 1 about compile is necessary because of AMB-1 (raw pg.Pool) and role-differentiation design"
   - Shows you actually compiled context from prior work, not designed in isolation

5. **No ambiguity** — Task 2 (Backend) must be able to implement this with 0 clarifying questions
   - Every SDK call is specified (method name, parameters, expected response)
   - Every workflow has concrete examples
   - Every error case is handled

6. **Quality bar met** — This is operator-grade work
   - Coherent, well-structured, defensible
   - Could be presented to stakeholders as the integration specification
   - 0 placeholder thinking ("we'll figure this out later")

---

## Review Standard

Governor will evaluate your work on:

- **Correctness** — Does the protocol actually solve the Governor ↔ Nexus coordination problem?
- **Completeness** — Are there gaps? What did you miss?
- **Clarity** — Can Task 2 implement this without asking questions?
- **Quality** — Is this operator-grade or does it need rework?
- **Evidence** — Did you actually use Nexus context, or design in isolation?

If Governor finds gaps or lacks clarity, you will rework before Task 2 begins.

---

## Timeline

**Start**: 2026-04-03 (after operator approval)
**Checkpoint**: Day 1 EOD — protocol draft + 5 decisions created
**Completion**: 2026-04-03 evening — final review, ready for Task 2
**Due**: 2026-04-04 00:00 UTC+8

---

## Context You'll Receive

When Governor dispatches this task, you will receive:

**Compiled context** (decision-aware, role-scoped):
- Nexus v1 architecture decisions that are relevant to integration
- Governor's coordination decision from v1 (how Governor manages specialists)
- Prior integration attempts or related work (if any, marked superseded)
- Standards that apply (Governor AGENT.md, CHANGE-CLASSIFICATION-AND-APPROVALS, EXECUTION-PERSISTENCE)

**Inputs**:
- POST-V1-ROADMAP.md §2 (OpenClaw Operator Workflow section)
- Locked decisions artifact
- Governor's operating loop and specialist briefing rules

**You should**:
1. Read the compiled context (it's being sent to you)
2. Design the 5 integration points using that context
3. Reference at least 2 decisions from the context in your rationale
4. Create 5 decisions that capture your design choices
5. Link decisions via edges (dependencies, supersedes, refinements)

---

## Questions or Blockers?

If anything is unclear before you start:
- Ask Governor now (don't proceed with assumptions)
- Governor will clarify or escalate

---

## What Happens After You're Done

1. Governor reviews your protocol + 5 decisions
2. Governor approves or asks for rework
3. Task 2 (Backend) reads your protocol and implements it
4. Task 3 (QA) validates the supersede cycle works

Your design gates Task 2 execution. Make it good.

---

**Ready to be dispatched. Awaiting Governor approval.**
