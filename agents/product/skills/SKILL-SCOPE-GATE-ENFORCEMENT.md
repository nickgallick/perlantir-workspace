# SKILL-SCOPE-GATE-ENFORCEMENT

## Purpose

Evaluate any feature request, proposal, or "should we also..." suggestion against the Nexus v1 scope boundary and produce an instant accept/reject/defer decision with rationale. This is Product's primary gating function — every feature idea must pass through this skill before any work begins.

## When to Use

- Any feature request from any agent or external source
- "It would be easy to also add..." proposals
- Scope expansion proposals during implementation
- Backlog prioritization decisions
- Evaluating whether a bug fix is actually a feature request in disguise

## Inputs Required

- `agents/product/capabilities/NEXUS-SCOPE-BOUNDARY.md` — IN v1 / NOT IN v1 / EXPLICITLY OUT tables
- `MEMORY.md` — deferred items list, backlog items (SB-1 through SB-4, PB-1)
- `agents/architect/capabilities/NEXUS-LOCKED-DECISIONS.md` — stack constraints

## Execution Method

### The Gate (3-Step Decision)

```
Step 1: Is it in the "IN v1" table?
  YES → ACCEPT (it's approved scope, proceed to implementation planning)
  NO  ↓

Step 2: Is it in the "NOT in v1" table?
  YES → REJECT (document the rejection trigger from the table)
  NO  ↓

Step 3: Is it in the "ONLY WITH EXPLICIT OPERATOR OVERRIDE" category?
  YES → DEFER (requires operator approval before even scoping)
  NOT LISTED → DEFER (unknown scope, escalate to operator)
```

**Response template:**
```
SCOPE GATE: [ACCEPT / REJECT / DEFER]
Feature: <one-line description>
Rationale: <which table/row, or "not listed — requires operator override">
Action: <proceed to planning / document rejection / escalate to operator>
```

### Common Traps (Pre-Computed Rejections)

These patterns appear frequently. Pre-reject without analysis:

| Pattern | Example | Response |
|---------|---------|----------|
| "It would be easy to also add..." | "Add a GraphQL endpoint alongside REST" | REJECT — GraphQL is EXPLICITLY OUT. Hono REST only. |
| "Users will expect..." | "Users will expect a web UI for viewing decisions" | REJECT — Visual graph explorer NOT IN v1 (trigger: 500+ GitHub stars) |
| "Competitors have..." | "Mem0 has a Python SDK" | REJECT — Python SDK NOT IN v1 (trigger: 10+ user requests) |
| "We should future-proof by..." | "Add RBAC now so we don't refactor later" | REJECT — RBAC NOT IN v1 (trigger: enterprise request) |
| "While we're touching this file..." | "While fixing auth, let's add OAuth support" | REJECT — SSO/OAuth is EXPLICITLY OUT for v1 |
| "This is a small fix" | "Add a /api/decisions/search endpoint" | DEFER — not in scope tables, requires operator override |

### Distinguishing Bug Fixes from Feature Requests

A bug fix corrects behavior that deviates from approved scope. A feature request adds behavior beyond approved scope.

| Scenario | Verdict | Why |
|----------|---------|-----|
| "Compile returns wrong scores" | Bug fix (ACCEPT) | Scoring is IN v1 scope, broken behavior |
| "Compile should also search artifacts by content" | Feature request (DEFER) | Content search not in current compile pipeline |
| "SDK method throws untyped error" | Bug fix (ACCEPT) | SDK error handling is IN v1 scope |
| "SDK should support streaming responses" | Feature request (DEFER) | Streaming not in scope tables |
| "Health endpoint blocked by auth" | Bug fix (ACCEPT) | Health endpoint is IN v1 scope, auth conflict is a defect (SB-4) |
| "Add rate limiting to compile endpoint" | Tracked item (ACCEPT) | Rate limiting is in threat model, but check: it's listed in scope boundary |

### Handling "IN v1 but Not Yet Built"

Some items are IN v1 scope but not yet implemented:
- WebSocket real-time notifications — IN v1, not built
- Context cache — table exists, not used by compiler
- GitHub Actions CI/CD — IN v1, not created
- README + docs files — IN v1, not written
- Docker compose + Dockerfile — IN v1, not created (only spec exists)
- Launch content — IN v1, not written

These are ACCEPT but need to be sequenced by the operator. Product does not unilaterally schedule them.

### Backlog Item Cross-Reference

Before rejecting, check if the item is already tracked:

| Tracked Item | Status | Scope Gate |
|-------------|--------|------------|
| SB-1: timingSafeEqual | Tracked, must fix before production | ACCEPT (security hardening) |
| SB-2: Generic 500 messages | Tracked, must fix before production | ACCEPT (security hardening) |
| SB-3: Startup migration | Tracked, must fix before production | ACCEPT (production readiness) |
| SB-4: Health auth conflict | Tracked, should fix before production | ACCEPT (production readiness) |
| PB-1: Performance baseline | Tracked, next after Phase 8 | ACCEPT (quality infrastructure) |

### Do NOT Do This

- **Do not evaluate scope by effort.** "It's only 10 lines" is not a scope argument. Scope is defined by the boundary tables, not by implementation cost.
- **Do not accept scope verbally.** All scope changes must be written (operator approval in chat or directive).
- **Do not reinterpret "IN v1" items.** If the table says "REST API server (Hono, all CRUD routes + /api/compile)," that means those routes — not "REST API server + also GraphQL."
- **Do not defer without escalating.** DEFER means "bring to operator" not "think about it later."
- **Do not negotiate with other agents on scope.** Architect can't authorize scope changes. Backend can't add features. Only the operator approves scope beyond the boundary.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| Feature built without gate check | Agent skipped Product review | Feature not in scope tables, no operator approval | Revert or get retroactive approval |
| Scope creep via "bug fix" disguise | Feature labeled as bug to bypass gate | "Fix" adds behavior that never existed | Apply bug-vs-feature distinction above |
| Operator approval lost | Verbal approval not recorded | No written record of scope change | Record all approvals in DECISIONS.md or daily memory |
| Stale scope boundary | Operator approved scope change but SCOPE-BOUNDARY.md not updated | Gate rejects an approved item | Update SCOPE-BOUNDARY.md after every operator scope decision |

## Bad Product Move

**Temptation**: "Let's add a few more features before launch to make v1 more competitive."

**Why it weakens Nexus**: Nexus v1's value is the core claim — role-differentiated context compilation. Every feature beyond that dilutes focus, delays launch, and creates surface area for bugs. The competitive moat is the scoring algorithm + graph + propagator working correctly, not feature count. Letta/Mem0/Zep have more features but none have role-aware compilation. Shipping a tight, correct core beats shipping a wide, buggy surface.

**The rule**: If it doesn't make the comparison demo more compelling, it doesn't ship in v1.

## Exit Criteria

- Feature evaluated against scope boundary tables in < 30 seconds
- Response uses the template: SCOPE GATE + Feature + Rationale + Action
- ACCEPT only for items in "IN v1" table or tracked backlog
- REJECT cites specific "NOT in v1" row with trigger condition
- DEFER escalated to operator, not left in limbo
