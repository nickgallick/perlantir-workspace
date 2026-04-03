# GOVERNOR-DISPATCH-STANDARD.md

**Purpose**: How Governor dispatches specialists with minimal ceremony, maximum clarity.

---

## Specialist Contract (Minimal)

**Required (5 elements, 1 page)**:

1. **Objective** (1–2 sentences)
   - What problem are you solving?
   - Why does it matter?

2. **Constraints** (3–5 bullets)
   - What must you respect? (architecture, standards, scope, timeline)
   - What can't you change?

3. **Deliverables** (list with filenames/descriptions)
   - What artifacts do we need?
   - Code? Documents? Tests?

4. **Success Criteria** (3–5 criteria)
   - How do we know you did it well?
   - How do we measure it?

5. **Timeline**
   - When is this due?
   - Any intermediate checkpoints?

**Optional** (if needed):
- Input reference: "Read PROTOCOL.md"
- One clarification if contract is ambiguous

---

## What NOT To Include

❌ **Context Package** — Specialist can read the spec
❌ **Detailed Briefing** — Specialist is competent
❌ **Navigation Guide** — They can find resources
❌ **Background Explanation** — Reference the spec they should read
❌ **How-To Instructions** — Assume they know the domain
❌ **Recovery Instructions** — Not needed for new task

---

## Specialist Receives

1. **Contract** (1 page, 5 elements)
2. **One Reference** (the spec/protocol they implement against)
3. **Nothing else**

---

## Example: Minimal Dispatch

```
Task: Phase A Task 2 (Backend SDK Integration)

Objective:
Implement SDK methods that Governor calls to compile context and record decisions. 
Add audit logging so all compile and decision recording calls are visible.

Constraints:
- No new Nexus features
- All 214 existing tests must pass
- PostgreSQL required to start
- Use existing Hono route structure

Deliverables:
- packages/sdk/src/governor-integration.ts (4 methods: compileForAgent, createDecision, updateDecisionStatus, listNotifications)
- packages/server/src/logging.ts (capture all compile calls, decision writes, notification checks)
- Updated tests (integration tests proving logging works)
- Test output (all 214+ tests passing, no regression)

Success Criteria:
- Methods execute live against Nexus
- Logging visible and correct in test output
- All tests pass (zero regression)
- Live evidence collection possible (A-1 & A-2 proven)

Timeline: 2026-04-04

Input: PHASE-A-INTEGRATION-PROTOCOL.md (what to implement)

Go.
```

**Size**: ~0.3 KB (one short message)**

---

## If Specialist Needs Clarification

Specialist asks a question.

**Right approach**:
- Answer directly (1–2 sentences)
- Do not create supplementary documents
- Specialist continues work

**Wrong approach**:
- Create a "FAQ"
- Create "Context Enrichment" document
- Create supplementary briefing

---

## After Specialist Completes

1. Review deliverables against contract
2. Accept or request rework
3. Archive contract (or delete if not needed for record)

No completion report.
No summary.
Status goes in STATUS.md.

---

## Specialist Dispatch Checklist

Before sending contract:
- [ ] Objective is crystal clear (1–2 sentences)
- [ ] Constraints are explicit (3–5 items, no explanation needed)
- [ ] Deliverables are specific (filenames, not vague descriptions)
- [ ] Success criteria are measurable
- [ ] Timeline is concrete (date, not "soon")
- [ ] Contract fits on 1 page
- [ ] Specialist has one input reference (the spec)
- [ ] Nothing else is being sent

---

**END GOVERNOR-DISPATCH-STANDARD**
