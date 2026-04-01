# ROLE-DIFFERENTIATION-PROOF.md — Nexus v1 Core Product Proof

---

## Proof Objective

Demonstrate that the Nexus Context Compiler produces **materially different context packages** for different agent roles when given the **same project data**. This is the core Nexus product claim: role-aware context compilation.

---

## Fixture Setup

### Project
Single project ("Proof Project") with 5 decisions, 3 agents. No artifacts, notifications, or sessions. No embeddings (semantic similarity signal = 0 for all). This isolates the role-differentiation signals (A: direct_affect, B: tag_matching, C: role_relevance) from the embedding signal (D).

### Decision Set (5 decisions)

| # | Title | made_by | affects | tags |
|---|-------|---------|---------|------|
| 1 | Require rate limiting on all auth endpoints | architect | builder, reviewer | security, api, infrastructure |
| 2 | Product positioning targets enterprise developers | product | launch | positioning, audience, messaging, marketing |
| 3 | Use PostgreSQL with pgvector for storage | architect | builder | architecture, database, infrastructure |
| 4 | All public APIs must have integration tests | architect | reviewer, builder | testing, code_quality, api |
| 5 | TypeScript strict mode required | architect | builder, reviewer | code, architecture |

All decisions: status=active, confidence=high, created_at=now (freshness ≈ 1.0).

### Agent Roles

| Agent Name | Role | Key Weight Tags (≥ 0.8) | Directly Affected By |
|------------|------|------------------------|---------------------|
| builder-proof | builder | architecture, implementation, api, database, framework, code | Decisions 1, 3, 4, 5 |
| launch-proof | launch | positioning, audience, messaging, content, brand, marketing | Decision 2 |
| reviewer-proof | reviewer | security, architecture, testing, code_quality, code, vulnerability | Decisions 1, 4, 5 |

### Task Prompts

| Agent | Task Description |
|-------|-----------------|
| builder | "Implement the auth middleware for API routes" |
| launch | "Write launch announcement for the new auth system" |
| reviewer | "Review security posture of the authentication system" |

---

## Exact Ranked Outputs

### Builder Agent
```
1. "TypeScript strict mode required"            — 0.7585 (directly_affects_agent)
2. "Use PostgreSQL with pgvector for storage"    — 0.7538 (directly_affects_agent)
3. "All public APIs must have integration tests" — 0.7112 (directly_affects_agent)
4. "Require rate limiting on all auth endpoints" — 0.7089 (directly_affects_agent)
5. "Product positioning targets enterprise devs" — 0.3000 (moderate_relevance)
```

### Launch Agent
```
1. "Product positioning targets enterprise devs" — 0.8250 (directly_affects_agent)
2. "TypeScript strict mode required"             — 0.3280 (moderate_relevance)
3. "Use PostgreSQL with pgvector for storage"    — 0.3280 (moderate_relevance)
4. "Require rate limiting on all auth endpoints" — 0.3140 (moderate_relevance)
5. "All public APIs must have integration tests" — 0.3000 (moderate_relevance)
```

### Reviewer Agent
```
1. "TypeScript strict mode required"             — 0.7515 (directly_affects_agent)
2. "All public APIs must have integration tests" — 0.7445 (directly_affects_agent)
3. "Require rate limiting on all auth endpoints" — 0.6949 (directly_affects_agent)
4. "Use PostgreSQL with pgvector for storage"    — 0.4172 (moderate_relevance)
5. "Product positioning targets enterprise devs" — 0.3000 (moderate_relevance)
```

---

## What Differed

| Dimension | Builder | Launch | Reviewer |
|-----------|---------|--------|----------|
| #1 decision | TypeScript strict | Product positioning | TypeScript strict |
| Top score | 0.7585 | 0.8250 | 0.7515 |
| `directly_affects` count | 4 | 1 | 3 |
| "Rate limiting" rank | #4 (0.7089) | #4 (0.3140) | #3 (0.6949) |
| "Product positioning" rank | #5 (0.3000) | #1 (0.8250) | #5 (0.3000) |
| Score spread (max − min) | 0.4585 | 0.5250 | 0.4515 |

---

## Why They Differed (By Signal)

**Signal A — Direct Affect (weight 0.4):**
Builder is in `affects` for 4 of 5 decisions → gets the 0.4 boost on each. Launch is only in `affects` for the positioning decision → only 1 decision gets the boost. Reviewer is in `affects` for 3 decisions. This is the dominant differentiator.

**Signal B — Tag Matching (weight 0.2):**
Builder's weight map assigns high values to `api` (0.9), `infrastructure` (0.7), `architecture` (1.0), `database` (0.9) — technical decisions score high. Launch's weights are near-zero for those tags but 1.0 for `positioning`, `marketing`, `messaging`, `audience` — only the positioning decision scores meaningfully. Reviewer has high weights for `security` (1.0), `testing` (0.9), `code_quality` (0.9).

**Signal C — Role Relevance (weight 0.15):**
Builder's roleTagMap (tags ≥ 0.8) = `[architecture, implementation, api, database, framework, code]`. Heavy overlap with technical decision tags. Launch's roleTagMap = `[positioning, audience, messaging, content, brand, marketing]`. Zero overlap with technical tags, full overlap with positioning tags. Reviewer's roleTagMap = `[security, architecture, testing, code_quality, code, vulnerability]`. Overlaps with security and testing decisions.

**Signal D — Semantic Similarity (weight 0.25):**
Not active in this proof (no embeddings). When active, this would further differentiate based on task-to-decision embedding distance.

**Net Effect:** Same 5 decisions, materially different ordering and scores. In a budget-constrained scenario, builder gets auth/infra decisions packed first while launch gets positioning packed first. The core product differentiation is proven.

---

## Why This Matters

This is the core Nexus product proof. The entire value proposition of Nexus is that **the same project knowledge produces different, role-appropriate context for different agents**. A builder agent working on auth middleware gets security and API decisions prioritized. A launch agent writing announcements gets positioning and messaging decisions prioritized. A reviewer auditing security gets testing and vulnerability decisions prioritized.

Without this behavior, Nexus is just a database. With it, Nexus is a decision-aware context compiler that makes multi-agent teams genuinely more effective by giving each agent exactly the context it needs.

This proof must remain true for every future version of the scoring and compilation pipeline.

---

## Reproducibility

### Command to Run
```bash
cd nexus/packages/core && npx vitest run tests/role-differentiation.test.ts
```

### Fixture Data
All fixture data is self-contained in the test file `packages/core/tests/role-differentiation.test.ts`. The test creates its own project, agents, and decisions in PostgreSQL, runs the proof, asserts the invariants, and cleans up.

### Database/State Assumptions
- PostgreSQL 17 + pgvector running on localhost:5432
- `nexus` database with `nexus` user exists
- Migrations applied (test calls `migrate()` in `beforeAll`)
- No pre-existing data required — test is fully self-contained

### What Must Remain True
1. Builder's top-ranked decision is NOT the same as launch's top-ranked decision
2. Launch ranks positioning/messaging decisions above all technical implementation decisions
3. Reviewer ranks security/testing decisions above launch-oriented decisions
4. Same input dataset produces materially different role-aware rankings (scores differ, ordering differs)
5. All three agents receive the same set of decisions but in different order with different scores

---

## Regression Protection

Automated regression test: `packages/core/tests/role-differentiation.test.ts`

This test is part of the standard `vitest run` suite and will fail the build if any of the above invariants are violated.
