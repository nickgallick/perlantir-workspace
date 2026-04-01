# INTAKE.md — How Work Enters the Enterprise System

## Intake Authority

**Governor** owns intake. All work enters through Governor. No specialist may accept work directly from operator or external sources without Governor's involvement.

## Intake Requirements

Before any work is accepted into the system, Governor must confirm:

1. **Clear objective** — what problem is being solved (not "build a thing")
2. **Identified customer/stakeholder** — who benefits
3. **Measurable success criteria** — how we know it worked
4. **Bounded scope** — what is in, what is explicitly out
5. **Feasibility signal** — technically achievable (specialist sounding if needed)
6. **Timeline estimate** — rough order of magnitude

Work that cannot satisfy these requirements is returned to the requester for clarification. Governor does not guess at missing requirements.

## Intake Decisions

Governor makes exactly one of three decisions:

- **Accept** — work is clear, feasible, and aligned. Proceeds to project creation.
- **Defer** — work is valid but not now. Documented with reason and re-review trigger.
- **Reject** — work is not feasible, not aligned, or not ready. Governor explains why and what would need to change.

## Intake Deliverable

For accepted work, Governor produces an **Intake Summary** (objective, success criteria, scope, timeline, dependencies, risks, recommended approach) and presents it to operator for approval. No project is created without operator approval of the Intake Summary.

## Full Intake Workflow

The complete step-by-step intake process, including failure modes and escalation paths, is defined in `workflows/01-INTAKE-TRIAGE.md`.
