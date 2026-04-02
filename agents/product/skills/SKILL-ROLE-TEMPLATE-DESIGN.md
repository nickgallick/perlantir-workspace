# SKILL-ROLE-TEMPLATE-DESIGN

## Purpose

Design new role templates or tune existing ones based on observed compilation behavior, scoring math, and the role differentiation proof. Product owns "what roles exist and what they prioritize" — this skill ensures role changes are grounded in actual scoring impact, not intuition.

## When to Use

- User requests a new role template
- Existing role produces suboptimal context (wrong decisions ranked high)
- Adding a domain-specific agent type (e.g., compliance, data-engineering)
- Evaluating whether a weight adjustment improves or degrades differentiation
- roleTagMap needs new tag entries for a domain

## Inputs Required

- `packages/core/src/roles.ts` — 8 current templates with weight maps
- `packages/core/src/context-compiler/scoring.ts` — how weights drive scoring (signals B and C)
- `packages/core/tests/scoring.test.ts` — 43 tests with exact numeric expectations
- `packages/core/tests/role-differentiation.test.ts` — 11 proof assertions
- `agents/backend/capabilities/NEXUS-ALGORITHM-REFERENCE.md` — formula spec
- `projects/nexus-v1/shared/NEXUS-SYSTEM-INVARIANTS.md` — INV-1 (Role Differentiation), INV-2 (Scoring Fidelity)

## Execution Method

### How Roles Affect Scoring

A role template is a `RelevanceProfile`:
```typescript
{
  weights: Record<string, number>,     // tag → weight (0.0 to 1.0)
  decision_depth: number,              // max graph traversal depth (1-3)
  freshness_preference: string,        // 'recent_first' | 'validated_first' | 'balanced'
  include_superseded: boolean,         // see superseded decisions?
}
```

The `weights` map feeds two scoring signals:

**Signal B (tagMatching × 0.2)**: For each decision tag present in `weights` with value > 0, accumulate the weight. Average the matching weights, multiply by 0.2.

**Signal C (roleRelevance × 0.15)**: Tags in `weights` with value ≥ 0.8 form the `roleTagMap`. Count overlaps with decision tags. `min(1.0, count × 0.25) × 0.15`. Saturates at 4 matches.

**Implication**: Weights ≥ 0.8 have double impact (signal B + signal C). Weights < 0.8 only affect signal B. Weights = 0.0 contribute nothing.

### Current Role Templates (8)

| Role | High-weight tags (≥ 0.8) | decision_depth | include_superseded |
|------|--------------------------|----------------|-------------------|
| builder | architecture, implementation, api, database, framework, code | 3 | true |
| reviewer | security, code_quality, architecture, testing, code, vulnerability | 2 | true |
| product | requirements, scope, timeline, tradeoff, dependencies, risk | 3 | true |
| docs | deprecation, migration, breaking_change, api | 1 | false |
| launch | positioning, audience, messaging, content, brand, marketing, launch | 1 | false |
| ops | infrastructure, deployment, config, monitoring, security, performance | 2 | false |
| blockchain | contract, chain, token, escrow, onchain, security | 2 | true |
| challenge | challenge, scoring, judge, benchmark, calibration, discrimination | 3 | true |

### Designing a New Role Template

**Step 1 — Define the role's domain:**
What type of decisions should this role see first? What should it ignore?

**Step 2 — Choose 4-8 high-weight tags (≥ 0.8):**
These form the roleTagMap and give the strongest signal C contribution. Pick tags that are highly specific to this role and rarely appear in other roles' high-weight sets.

**Differentiation rule**: A new role must have ≥ 2 high-weight tags that are NOT high-weight in any existing role. Otherwise the new role will produce nearly identical context to an existing one.

**Step 3 — Assign remaining weights (0.1-0.7):**
Tags relevant but not primary. These contribute to signal B but not signal C.

**Step 4 — Set profile parameters:**
- `decision_depth`: 1 for focused roles (docs, launch), 2-3 for broad roles (builder, product)
- `freshness_preference`: `recent_first` for fast-moving roles, `validated_first` for ops, `balanced` for reviewers
- `include_superseded`: `true` for roles that need history (builder, reviewer), `false` for roles that want current truth only (docs, launch)

**Step 5 — Validate differentiation:**
Compute scores for ≥ 3 test decisions against the new role AND the most similar existing role. Score difference must be ≥ 0.05 for at least 1 decision (INV-1 threshold from QA skill).

### Example: Designing a "compliance" Role

```typescript
compliance: {
  weights: {
    legal: 1.0, compliance: 1.0, regulation: 1.0, audit: 0.9,
    privacy: 0.9, security: 0.8, risk: 0.8,
    architecture: 0.4, api: 0.3, implementation: 0.1,
    marketing: 0.0, code: 0.0, design: 0.0,
  },
  decision_depth: 2,
  freshness_preference: 'validated_first',
  include_superseded: true,  // compliance needs decision history
}
```

Differentiation check: `legal`, `compliance`, `regulation`, `audit` are NOT high-weight in any existing role → unique signal C → passes differentiation.

### Tuning an Existing Template

**Trigger**: A user reports "builder gets irrelevant launch decisions" or "reviewer misses security decisions."

**Protocol**:
1. Identify the specific decision(s) being mis-ranked
2. Compute the current score breakdown (signals A-D) for that decision × that role
3. Identify which signal is causing the problem
4. If signal B (tag weights): adjust the specific tag weight up or down
5. If signal C (roleTagMap): a tag may need to cross the 0.8 threshold
6. Recompute scores for 3+ representative decisions to verify the change improves the specific case without degrading others
7. Update `scoring.test.ts` expectations if weights changed

**Critical constraint**: Changing any weight in an existing template invalidates some of the 43 scoring tests. All affected tests must be recomputed, not estimated.

### The roleTagMap Sensitivity Issue

`ROLE_TAG_MAP_THRESHOLD = 0.8` in `scoring.ts`. This is the most sensitive constant:

- A tag at weight 0.79 contributes to signal B only
- A tag at weight 0.80 contributes to signal B AND signal C (double impact)
- Moving a single tag from 0.79 → 0.80 can change scores by up to 0.0375 (one additional roleTagMap match × 0.25 × 0.15)

**Do not casually set weights to exactly 0.8.** Either commit to it being a high-priority tag (≥ 0.8) or keep it below (≤ 0.7). The 0.8 boundary is a cliff, not a gradient.

## Bad Product Move

**Temptation**: "Let's add 20 role templates to cover every possible team configuration."

**Why it weakens Nexus**: More templates mean more roleTagMap overlap, weaker differentiation between roles, and a larger test surface. Each template's weights interact with every decision's tags — 20 templates means 20× the scoring validation surface. The 8 current templates cover the most common multi-agent team structures. New roles should be added only when a real user demonstrates a domain that no existing role handles adequately, not preemptively.

**The rule**: A new role template must demonstrate unique differentiation (≥ 2 exclusive high-weight tags) against all existing roles. If it can't, the user should use `getRoleTemplate(closestRole, overrides)` instead.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| New role identical to existing | High-weight tags overlap completely | Role differentiation test fails | Add unique tags or merge with existing role |
| Weight change breaks 43 tests | Expected values hardcoded for old weights | `scoring.test.ts` fails | Recompute all affected expected values |
| roleTagMap cliff | Tag moved from 0.79 to 0.80 | Score jumps unexpectedly | Intentional choice: ≥ 0.8 or ≤ 0.7, no 0.79/0.80 zone |
| Existing role degraded by new template | Shared tags dilute differentiation | Role diff test for existing pair weakens | Verify all role pairs, not just new role |

## Exit Criteria

- New template has ≥ 2 high-weight tags exclusive to it
- Score difference ≥ 0.05 vs most similar existing role for ≥ 1 test decision
- All 43 scoring tests pass (with recomputed expectations if weights changed)
- All 11 role differentiation assertions pass
- Template added to `roles.ts` with correct structure
- `listRoleTemplates()` returns updated count
- No existing role's differentiation degraded
