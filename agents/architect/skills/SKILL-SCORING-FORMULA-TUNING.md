# SKILL-SCORING-FORMULA-TUNING

## Purpose

Design scoring formula modifications — new signals, weight adjustments, penalty changes — with rigorous impact analysis across all 8 role templates. Scoring tuning is the highest-leverage product lever; a weight change ripples through every agent's compiled context.

## When to Use

- Product reports that a role receives wrong/suboptimal context
- Adding a new scoring signal (signal F, G, etc.)
- Adjusting freshness decay parameters
- Changing the combined score blend (currently 0.7 relevance + 0.3 freshness)
- Modifying pack priority percentages (currently 10/55/30/5)
- Evaluating the impact of a proposed role template change

## Inputs Required

- `packages/core/src/context-compiler/scoring.ts` — current formula with all constants
- `packages/core/src/roles.ts` — 8 role templates with weight maps
- `agents/backend/capabilities/NEXUS-ALGORITHM-REFERENCE.md` — formula spec with worked examples
- `packages/core/tests/scoring.test.ts` — 43 tests with exact expected values
- `packages/core/tests/role-differentiation.test.ts` — 11 proof assertions
- `projects/nexus-v1/shared/ROLE-DIFFERENTIATION-PROOF.md` — proof methodology

## Execution Method

### Current Formula Constants

```
Signal weights (must sum to 1.0):
  A: directAffect     = 0.40
  B: tagMatching       = 0.20
  C: roleRelevance     = 0.15
  D: semanticSimilarity = 0.25
  Total               = 1.00

Combined score blend:
  relevance × 0.70 + freshness × 0.30

Freshness parameters:
  half_life_validated   = 30 days
  half_life_unvalidated = 7 days

Status penalties:
  active    = 1.0 (no penalty)
  superseded (included)  = 0.4
  superseded (excluded)  = 0.1
  reverted  = 0.05

Role tag map threshold: 0.8 (tags with weight >= 0.8 in profile)
Role relevance per-match: 0.25 (capped at 1.0 → 4 matches saturates)

Graph expansion:
  inclusion threshold  = 0.25 (min combined_score to expand)
  score decay per depth = 0.6
```

### Impact Analysis Framework

Before proposing any change, compute the impact matrix:

**Step 1: Identify the change.**
Example: "Increase directAffect weight from 0.4 to 0.5"

**Step 2: Rebalance.**
Signal weights must sum to 1.0. If A increases by 0.1, another signal must decrease by 0.1. Choose which one and justify.

**Step 3: Compute impact for representative decision-agent pairs.**

Use this template for 3 roles (builder, launch, reviewer) against 2 decision types:

| | Decision with affects=[builder], tags=[security, api] | Decision with affects=[], tags=[marketing, launch] |
|---|---|---|
| **Builder (before)** | A=0.40, B=0.17, C=0.04 = 0.61 | A=0.00, B=0.00, C=0.00 = 0.00 |
| **Builder (after)** | compute new values | compute new values |
| **Launch (before)** | A=0.00, B=0.03, C=0.00 = 0.03 | A=0.00, B=0.19, C=0.11 = 0.30 |
| **Launch (after)** | compute new values | compute new values |

**Step 4: Check role differentiation preservation.**

The ratio between a builder's score for a "builder-relevant" decision and a launch agent's score for the same decision must remain > 3:1. If the ratio drops below 3:1, role differentiation is weakened to the point where context packages converge.

**Step 5: Check edge cases.**

- Does any role now score 0.0 for all decisions? (Broken — agent gets empty context)
- Does combined_score exceed 1.0 for any case? (Must be capped)
- Do superseded/reverted penalties still produce meaningful differentiation? (0.4 × 0.61 vs 0.4 × 0.03 — the ratio must hold)

### Adding a New Signal

1. **Define the signal function**: pure, deterministic, returns a value in [0, 1]
2. **Assign a weight**: subtract from existing signals to maintain sum = 1.0
3. **Update `scoreDecision`**: add signal computation and include in breakdown
4. **Update `ScoreBreakdown` interface**: add the new field
5. **Update debug formatting**: add the new signal to `formatDebugLine`
6. **Update worked examples** in `NEXUS-ALGORITHM-REFERENCE.md`
7. **Update or add tests**: minimum 5 tests for the new signal (zero case, max case, typical case, edge cases)
8. **Re-run all 43 scoring tests**: they will fail because expected values changed. Update each with new computed values.
9. **Re-run role differentiation proof**: verify it still holds with the new signal

### Role Template Interaction

Each role template has a `weights` map that directly feeds signal B (tagMatching) and signal C (roleRelevance). Changing a template changes every compilation for that role.

**roleTagMap derivation**: `tags from weights where weight >= 0.8`

| Role | roleTagMap (current) |
|------|---------------------|
| builder | architecture, implementation, api, database, framework, code |
| reviewer | security, code_quality, architecture, testing, code, vulnerability |
| product | requirements, scope, timeline, tradeoff, dependencies, risk |
| docs | deprecation, migration, breaking_change, api |
| launch | positioning, audience, messaging, content, brand, marketing, launch |
| ops | infrastructure, deployment, config, monitoring, security, performance |
| blockchain | contract, chain, token, escrow, onchain, security |
| challenge | challenge, scoring, judge, benchmark, calibration, discrimination |

Changing the threshold from 0.8 to 0.7 would add more tags to roleTagMap, increasing signal C values for all roles, potentially reducing differentiation if all roles gain the same tags.

### Do NOT Do This

- **Do not change signal weights without rebalancing to sum 1.0.** The formula produces meaningful scores only when max(A+B+C+D) ≈ 1.0 for a perfectly relevant decision.
- **Do not tune constants by "feel."** Compute the impact matrix. Verify numerically.
- **Do not change the role tag map threshold (0.8) without re-verifying all 43 scoring tests AND 11 role differentiation assertions.** This single constant affects every role's signal C.
- **Do not propose changes without a rollback plan.** If the change degrades context quality, the old constants must be restorable immediately.
- **Do not modify freshness half-lives without considering the test suite.** Many tests use fixed `now` values calculated against specific half-life expectations.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| All roles get identical context | Signal weights rebalanced to make A dominant and all agents match on `affects` | `role-differentiation.test.ts` fails | Ensure non-A signals have enough weight for differentiation |
| Agent gets empty context | All decisions score below relevance threshold after weight change | `decisions_included === 0` | Lower threshold or increase relevant signal weights |
| 43 scoring tests fail | Expected values hardcoded for old weights | Test failures | Recompute all expected values from new formula — do not estimate |
| Freshness dominates relevance | `FRESHNESS_BLEND` increased above 0.5 | Recent-but-irrelevant decisions rank higher than old-but-relevant | Keep relevance blend ≥ 0.6 |
| Graph expansion over-includes | `GRAPH_INCLUSION_THRESHOLD` lowered below 0.1 | Too many low-relevance graph neighbors in context | Keep threshold ≥ 0.15 |

## Exit Criteria

- Signal weights sum to 1.0
- Impact matrix computed for ≥ 3 roles × ≥ 2 decision types
- Role differentiation ratio > 3:1 preserved
- Combined score stays in [0, 1] for all cases
- All 43 scoring tests updated to new expected values and pass
- All 11 role differentiation assertions pass
- Change documented with rationale and rollback constants
