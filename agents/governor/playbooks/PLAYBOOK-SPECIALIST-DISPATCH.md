# PLAYBOOK-SPECIALIST-DISPATCH.md

**Purpose**: Minimal specialist dispatch. Clear contract, one reference, go.

**When to Use**: Before dispatching any specialist.

---

## Pre-Dispatch Checklist

- [ ] Specialist's objective is crystal clear (1–2 sentences)
- [ ] Constraints are explicit (3–5 items, no explanation)
- [ ] Deliverables are specific (filenames/descriptions)
- [ ] Success criteria are measurable (3–5 criteria)
- [ ] Timeline is concrete (exact date)
- [ ] Contract fits on 1 page
- [ ] One reference spec/protocol ready for specialist
- [ ] Nothing else is being sent (no context packages, no navigation guides, no briefings)

---

## Dispatch Message Template

```
Task: [Name]

Objective:
[1–2 sentences describing the problem]

Constraints:
- [constraint 1]
- [constraint 2]
- [constraint 3]

Deliverables:
- [filename]: [description]
- [filename]: [description]

Success Criteria:
- [criterion 1]
- [criterion 2]
- [criterion 3]

Timeline: [exact date or "target [date]"]

Input: [reference filename, e.g., "PHASE-A-INTEGRATION-PROTOCOL.md"]

Go.
```

**Size**: ~0.3 KB (one short message)**

---

## Example: Minimal Task 2 Dispatch

```
Task: Phase A Task 2 (Backend SDK Integration)

Objective:
Implement SDK methods that Governor calls to compile context and record decisions. 
Add audit logging so all compile and decision recording calls are visible.

Constraints:
- No new Nexus features
- All 214 existing tests must pass
- PostgreSQL required
- Existing route structure must be respected

Deliverables:
- packages/sdk/src/governor-integration.ts (4 methods)
- packages/server/src/logging.ts (audit logging)
- Updated tests (integration tests, zero regression)
- Test output (all passing)

Success Criteria:
- SDK methods execute against live Nexus
- Logging captures all compile calls and decision writes
- All tests pass (no regression)
- Live evidence collection enabled (A-1 & A-2 proof possible)

Timeline: Target 2026-04-04

Input: PHASE-A-INTEGRATION-PROTOCOL.md

Go.
```

---

## After Dispatch

**If specialist asks for clarification**:
- Answer in 1–2 sentences
- Do not create supplementary documents
- Do not expand the contract
- Specialist continues

**If specialist needs context**:
- Point them to the input reference
- They can read the spec
- No context package needed

**If specialist wants navigation**:
- They can figure it out
- Assume they're competent in their domain

---

## After Specialist Completes

1. Review deliverables against contract
2. Accept or request rework
3. Archive contract (or delete if not needed for record)
4. Log completion in STATUS.md

No completion report.
No thank-you letter.
No summary document.

---

**END PLAYBOOK-SPECIALIST-DISPATCH**
