# SKILL-SCORING-IMPLEMENTATION

## Purpose

Implement, debug, and extend the 5-signal scoring formula with exact numeric precision. The scoring layer is the mathematical core of Nexus — any deviation breaks role differentiation.

## When to Use

- Any task touching relevance calculation in `scoring.ts`
- Adding a new scoring signal
- Tuning signal weights or penalties
- Debugging why an agent receives wrong/unexpected context
- Modifying `roleTagMap` threshold or role templates in `roles.ts`
- Investigating score differences between roles

## Inputs Required

- `packages/core/src/context-compiler/scoring.ts` — all scoring functions
- `agents/backend/capabilities/NEXUS-ALGORITHM-REFERENCE.md` — formula spec with worked examples
- `packages/core/src/roles.ts` — role templates, `roleTagMap` derivation (threshold ≥ 0.8)
- `packages/core/tests/scoring.test.ts` — 43 tests with exact numeric expectations
- `agents/backend/capabilities/NEXUS-KNOWN-SPEC-ISSUES.md` — BUG-2 (truncated roleTagMap), BUG-3 (truncated freshness divisor)

## Execution Method

### The Formula

```
relevance_score = (A + B + C + D) × E

A = directAffect:       0.4 if decision.affects includes agent.name OR agent.role; else 0
B = tagMatching:        (sum_of_matching_tag_weights / count_of_matching_tags) × 0.2
C = roleRelevance:      min(1.0, matching_role_tags × 0.25) × 0.15
D = semanticSimilarity: cosine_similarity(task_embedding, decision_embedding) × 0.25
E = statusPenalty:      superseded+included → 0.4; superseded+excluded → 0.1; reverted → 0.05; active → 1.0

combined_score = min(1.0, relevance_score × 0.7 + freshness_score × 0.3)

freshness_score = exp(-age_hours / (half_life_days × 24))
  half_life = 30 days if validated_at is set, else 7 days
```

### Signal-by-Signal Implementation Rules

**Signal A — Direct Affect (0.4):**
- Case-insensitive comparison: `a.toLowerCase() === agent.name.toLowerCase()`
- Matches on EITHER `agent.name` OR `agent.role`
- Binary: 0.4 or 0. No partial credit.

**Signal B — Tag Matching (×0.2):**
- Only tags present in `profile.weights` with `weight > 0` count as matches
- If zero matches, return 0 (not NaN from division by zero)
- Formula: `(weightSum / matchCount) × 0.2`
- Tags are lowercased for lookup: `profile.weights[tag.toLowerCase()]`

**Signal C — Role Relevance (×0.15):**
- `roleTagMap` = tags from `profile.weights` where `weight >= 0.8`
- Count overlaps between `decision.tags` and `roleTagMap`
- Formula: `min(1.0, matchCount × 0.25) × 0.15`
- Maximum: 4+ matches → `min(1.0, 1.0) × 0.15 = 0.15`
- Decision tags must be lowercased before comparison

**Signal D — Semantic Similarity (×0.25):**
- Returns 0 if either embedding is missing (no error, no NaN)
- Uses `cosineSimilarity()` from `relevance.ts`
- In tests without OpenAI, embeddings are absent → signal D = 0

**Status Penalty (E):**
- Applied as multiplier to the sum of A+B+C+D
- `include_superseded` comes from `agent.relevance_profile.include_superseded`
- Reverted penalty (0.05) is extremely harsh by design — reverted decisions are nearly invisible

**Freshness:**
- Exponential decay: `exp(-ageHours / halfLifeHours)`
- `ageHours = max(0, ...)` — future timestamps clamp to 0 (freshness = 1.0)
- Tests use fixed `now` parameter to avoid time drift

### Do NOT Do This

- **Do not use floating-point equality in tests.** Use `toBeCloseTo(expected, 3)` for 3 decimal places.
- **Do not add a signal without updating the weight constants.** All 4 signal weights (0.4 + 0.2 + 0.15 + 0.25 = 1.0) must sum to 1.0 for a maximally-relevant active decision to score ~1.0.
- **Do not change `ROLE_TAG_MAP_THRESHOLD` from 0.8** without re-verifying all 43 scoring tests and 11 role-differentiation proofs. This threshold was determined by matching the spec's worked examples.
- **Do not skip the status penalty.** Even for "active" decisions, `computeStatusPenalty` must be called (returns 1.0, the identity multiplier).
- **Do not use `new Date()` in scoring logic.** Always accept `now` as a parameter for deterministic testing.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| NaN in combined_score | Division by zero in tag matching (0 matches) | Test assertions fail | Check `matchCount === 0` early return |
| All agents get identical scores | Signal A dominates and all agents match on `affects` | Role-differentiation test fails | Verify `affects` uses agent names, not generic strings |
| Reverted decisions appear in context | Status penalty not applied or applied as 1.0 | Scenario test fails | Verify `computeStatusPenalty` handles `'reverted'` → 0.05 |
| Scores drift across test runs | Using `new Date()` instead of fixed `now` | Flaky freshness-dependent tests | Pass `now` in `ScoringContext` |
| roleTagMap empty for a role | All weights in profile < 0.8 | Signal C always returns 0 | Check role template in `roles.ts` has weights ≥ 0.8 |
| Score exceeds 1.0 | Missing `min(1.0, ...)` on combined_score | Assertion failure | Ensure `Math.min(1.0, ...)` wraps the blend |

## Nexus-Specific Examples

**Why roles produce different scores — the mathematical proof:**

For a decision with `affects: ['builder']`, `tags: ['security', 'api']`:

| Signal | Builder | Launch |
|--------|---------|--------|
| A (directAffect) | 0.4 (name match) | 0.0 (no match) |
| B (tagMatching) | `(0.8+0.9)/2 × 0.2 = 0.170` | `(0.2+0.1)/2 × 0.2 = 0.030` |
| C (roleRelevance) | `min(1, 1×0.25) × 0.15 = 0.0375` | `min(1, 0×0.25) × 0.15 = 0.0` |
| **Total (A+B+C)** | **0.6075** | **0.030** |

This 20:1 ratio is what makes role differentiation work. Signal A (affects) is the strongest differentiator; Signal B (tags) provides secondary differentiation; Signal C (role relevance) adds tertiary.

## Exit Criteria

- All 5 signals produce mathematically correct values matching `NEXUS-ALGORITHM-REFERENCE.md` worked examples
- 43 `scoring.test.ts` tests pass with exact numeric values (3 decimal precision)
- 11 `role-differentiation.test.ts` assertions pass
- `scoreDecisions` returns results sorted by `combined_score` descending
- Status penalty correctly applies to superseded (0.4 or 0.1) and reverted (0.05) decisions
- Combined score never exceeds 1.0
- Debug mode produces per-decision breakdown strings
