# SKILL-SPECIALIST-DISPATCH-MINIMALISM.md

**Purpose**: How Governor dispatches specialists without over-ceremony. Minimal contracts, only real context, no hand-holding.

**When to Use**: Before dispatching any specialist. When tempted to create detailed briefing packets, context packages, or navigation guides.

---

## The Law

**MINIMAL CONTRACT. REAL WORK ONLY.**

A specialist contract is not a onboarding manual, not a context package, not a how-to guide. It is the minimum needed for the specialist to execute and nothing more.

---

## What A Minimal Contract Contains

### Required (5 Elements)

1. **Objective** (1 sentence)
   - What problem are you solving?
   - Example: "Implement SDK methods that Governor calls to compile context and record decisions"

2. **Constraints** (3–5 bullets)
   - What must you respect?
   - Example:
     - No new Nexus features
     - All tests must pass
     - PostgreSQL required

3. **Deliverables** (list with filenames)
   - What do we need from you?
   - Example:
     - `packages/sdk/src/governor-integration.ts` (4 methods)
     - `packages/server/src/logging.ts` (audit logging)
     - Updated tests (all passing)

4. **Success Criteria** (3–5 criteria)
   - How do we know you did it well?
   - Example:
     - SDK methods execute against live Nexus
     - Logging captures all compile calls and decision writes
     - All 214 existing tests still pass
     - New tests prove logging works

5. **Timeline**
   - When is this due?
   - Example: "Target 2026-04-04"

---

### NOT Required (Do Not Include)

❌ **Context Packages**
- Do not create simulated context documents
- Specialist can read the protocol (PHASE-A-INTEGRATION-PROTOCOL.md)

❌ **Detailed Briefings**
- Do not explain how things work
- Specialist is competent; assume they understand the domain

❌ **Specialist Contracts With >6 Sections**
- Too much ceremony
- If you need >6 sections, you're over-explaining

❌ **Navigation Guides**
- Specialist can find what they need
- Point them to one input file (the protocol or spec)

❌ **Background Context Summaries**
- Specialist is smart
- They can read PHASE-A-INTEGRATION-PROTOCOL.md if they need background

---

## Minimal Contract Template

```
Task: [Name]

Objective:
[1 sentence]

Constraints:
- [constraint 1]
- [constraint 2]
- [constraint 3]

Deliverables:
- [file path + description]
- [file path + description]

Success Criteria:
- [criterion 1]
- [criterion 2]
- [criterion 3]

Timeline: [target date]

Input: [reference spec file, e.g., PHASE-A-INTEGRATION-PROTOCOL.md]

Go.
```

That's it. 1 page, no ceremony, no hand-holding.

---

## Example: Minimal vs. Over-Ceremony

### Over-Ceremony (What I Did Wrong)

```
# PHASE-A-BACKEND-CONTRACT.md (7.7 KB, 8 sections)

## Objective
[1 sentence]

## Constraints (5 rules, explained)
[detailed explanation of why each rule exists]

## Deliverables
[list with detailed descriptions]
[explanation of what each deliverable contributes]

## Files in Scope
[explicit list of files you can touch]

## Out of Scope
[explicit list of what's forbidden]

## Success Criteria
[6 criteria with explanations]

## Review Standard
[detailed quality expectations]

## Timeline
[target date]

## Context You'll Receive
[describing what compiled context means]

## What Happens After You're Done
[multi-step process description]

## Questions or Blockers?
[how to escalate]
```

Result: 8 sections, 7.7 KB, looks official, violates minimalism

---

### Minimal (What It Should Be)

```
Task: Phase A Task 2 (Backend SDK Integration)

Objective:
Implement SDK methods (compileForAgent, createDecision, updateDecisionStatus, listNotifications) and add audit logging for all calls.

Constraints:
- No new Nexus features
- All 214 existing tests must pass
- PostgreSQL required

Deliverables:
- packages/sdk/src/governor-integration.ts (4 methods)
- packages/server/src/logging.ts (audit logging)
- Updated routes.ts (logging calls)
- Tests (all passing, no regression)
- Decision log (3 decisions created)

Success Criteria:
- SDK methods execute against live Nexus
- Logging captures every compile call and decision write
- All tests pass (no regression)
- Live evidence collected (A-1 & A-2 can be proven)

Timeline: Target 2026-04-04

Input: PHASE-A-INTEGRATION-PROTOCOL.md (what to implement)

Go.
```

Result: 1 page, 0.8 KB, clear, minimal, no ceremony

**Reduction**: 87% less text, 100% more clarity

---

## What NOT To Do When Dispatching

❌ **Do not create a context package**
- Specialist can read the protocol
- Simulated context is fake evidence

❌ **Do not hand-hold with explanations**
- Specialist is competent
- They understand the domain or can figure it out

❌ **Do not create multiple briefing documents**
- One contract, one input spec file
- Done

❌ **Do not explain why constraints exist**
- State the constraint
- Let specialist understand the reasoning

❌ **Do not create navigation guides**
- Minimal contract points to one spec file
- That's the only navigation needed

---

## When a Specialist Needs Clarification

Specialist asks a question. What do you do?

**WRONG**:
```
Create a "Specialist FAQ" document
Create a "Context Enrichment" package
Create a "Supplementary Briefing"
```

**RIGHT**:
```
Answer the question directly in text
Clarify in 1–2 sentences
Specialist continues work
```

**Why**: Every artifact you create is debt. More documents = more maintenance burden. Answer questions verbally, not documentarily.

---

## For Phase A: Corrected Dispatch

### Task 2 (Backend) — Minimal Dispatch

```
Task: Phase A Task 2 (Backend SDK Integration)

Objective:
Implement SDK methods that Governor calls to compile context and record decisions. Add audit logging so compile and decision recording calls are visible.

Constraints:
- No new Nexus features
- All existing tests must pass
- PostgreSQL required to start

Deliverables:
- SDK methods (4): compileForAgent, createDecision, updateDecisionStatus, listNotifications
- Logging infrastructure: capture compile calls, decision writes, notification checks
- Tests: prove logging works, no regression
- Decision log: 3 decisions documenting implementation choices

Success Criteria:
- Methods execute live against Nexus
- Logging visible in test output
- All 214 tests pass
- Live evidence collected (A-1 & A-2 proven)

Timeline: 2026-04-04

Input: PHASE-A-INTEGRATION-PROTOCOL.md

Go.
```

Specialist reads that, reads the protocol, executes. Done. No ceremony.

---

### Task 3 (QA) — Minimal Dispatch (When Task 2 Is Done)

```
Task: Phase A Task 3 (QA Verification)

Objective:
Verify that the supersede scenario works: create a decision, supersede it, prove the score changes in compiled output.

Constraints:
- Use actual Task 2 decisions (from Task 2 execution)
- Run against live Nexus
- No speculation

Deliverables:
- Test: compile before supersede, supersede, compile after
- Evidence file: before/after output with scores
- Decision log: 1 decision (verification methodology)

Success Criteria:
- Test executes without error
- Scores differ before/after (proof of penalty)
- Before/after scores logged as evidence
- Evidence proves A-3

Timeline: 2026-04-04

Input: [Task 2 output], PHASE-A-INTEGRATION-PROTOCOL.md

Go.
```

Again: minimal, clear, no ceremony.

---

## The Anti-Pattern You Must Avoid

**Anti-Pattern: Specialist Theater**

```
Create detailed briefing packet (8 sections, 20 pages)
Create context package document
Create success rubric explanation
Create background context summary
Create navigation guide
Create FAQ document

Result:
- Specialist overwhelmed by documentation
- Specialist unclear on what's actually needed
- 19 extra artifacts created
- All artifacts require maintenance
- Ceremony substitutes for clarity
```

**Right Pattern: Minimal Clarity**

```
Create 1 contract (1 page, 5 elements)
Reference 1 spec file

Result:
- Specialist knows exactly what to do
- Specialist executes
- 0 extra artifacts
- Clear and minimal
```

---

## Summary

When dispatching a specialist:

1. Create ONE contract (5 required elements, 1 page)
2. Point to ONE input spec file
3. State success criteria (3–5 items)
4. Set timeline
5. Say "go"

That's it. Anything beyond that is ceremony and should be deleted.

Governor's job is to be clear, not verbose. Specialists don't need hand-holding. They need clarity. Minimal contracts provide clarity with zero ceremony.

---

**END SKILL-SPECIALIST-DISPATCH-MINIMALISM**
