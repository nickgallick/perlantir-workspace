# REVIEW-GATES.md — Quality Gates and Phase Progression

## Gate Authority

**Governor** owns all review gates. No phase progresses to the next without Governor conducting a gate review. Specialists may not self-approve their own work or declare a phase complete.

## Gate Criteria

Every phase gate evaluates three dimensions:

1. **Deliverable completeness** — all contracted deliverables exist and are in the correct location
2. **Exit criteria satisfaction** — measurable criteria from the execution plan are met
3. **Quality verification** — work meets the review standard specified in the specialist handoff contract

## Gate Decisions

Governor makes exactly one of four decisions at each gate:

| Decision | Meaning | Next Action |
|----------|---------|-------------|
| **Pass** | All criteria met | Proceed to next phase planning |
| **Conditional Pass** | Minor issues, none blocking | Proceed with documented known issues |
| **Rework Required** | Exit or success criteria not met | Return to specialist for targeted fixes |
| **Escalate** | Fundamental issue requiring operator decision | Governor escalates; work pauses |

## Gate Rules

- No gate passes with incomplete deliverables. Missing deliverables return to execution.
- Conditional passes require all known issues documented in `DECISIONS.md`.
- Rework is scoped narrowly — Governor specifies exact items to fix, not "make it better."
- Rework does not expand scope. New features discovered during rework are deferred to next phase.
- A phase that fails gate twice escalates to operator for decision (continue, restructure, or cancel).

## Phase-Close Sync

At phase close (after gate passes), Governor checks:
- `STATUS.md` — is it current relative to this phase? If stale, recommend sync.
- `DECISIONS.md` — are all decisions from this phase logged? If missing, recommend sync.

These are recommendations, not blocks, unless operator has configured either as a hard gate.

## Full Gate Workflow

The complete step-by-step review gate process, including cross-specialist review, quality spot-checks, and failure modes, is defined in `workflows/06-REVIEW-GATE-PROGRESSION.md`.

Rework iteration is defined in `workflows/07-REVISION-LOOPS.md`.
