# NEXUS-ALGORITHM-REFERENCE.md

The Context Compiler scoring algorithm with concrete worked examples. Backend must implement this exactly. (Spec §7)

---

## Scoring Formula

For each decision, compute `relevance_score` from 4 signals:

```
relevance_score = A + B + C + D   (then apply E)

A = direct_affect:       0.4  if decision.affects includes agent.name or agent.role
B = tag_matching:        (sum of matching tag weights / count of matching tags) × 0.2
C = role_relevance:      min(1.0, matching_role_tags × 0.25) × 0.15
D = semantic_similarity: cosine_similarity(task_embedding, decision_embedding) × 0.25
E = status_penalty:      if superseded: × 0.4 (profile.include_superseded) or × 0.1
                          if reverted:  × 0.05
```

Then combine with freshness:

```
freshness_score = exp(-age_hours / (half_life_days × 24))
   where half_life_days = 30 if validated, 7 if not

combined_score = min(1.0, (relevance_score × 0.7) + (freshness_score × 0.3))
```

---

## Worked Example 1: Security Decision → Builder Agent

**Decision:** "Require rate limiting on all auth endpoints"
- `affects`: ['builder', 'ops']
- `tags`: ['security', 'api', 'infrastructure']
- `status`: 'active'
- `created_at`: 2 days ago
- `validated_at`: null
- `embedding`: [0.12, 0.45, ...] (1536 dims)

**Agent:** builder
- `role`: 'builder'
- `relevance_profile.weights`: { architecture: 1.0, implementation: 1.0, api: 0.9, database: 0.9, framework: 0.8, code: 0.8, infrastructure: 0.7, security: 0.6, testing: 0.6, performance: 0.5, design: 0.2, legal: 0.1, marketing: 0.0, content: 0.0 }

**Task:** "Implement the auth middleware for API routes"
- `task_embedding`: [0.18, 0.39, ...] (1536 dims)

### Step A: Direct Affect
`decision.affects` includes 'builder' → **A = 0.4**

### Step B: Tag Matching
- `security` → weight 0.6 ✓
- `api` → weight 0.9 ✓
- `infrastructure` → weight 0.7 ✓
- 3 matches, sum = 0.6 + 0.9 + 0.7 = 2.2
- Average = 2.2 / 3 = 0.733
- **B = 0.733 × 0.2 = 0.147**

### Step C: Role Relevance
Builder's roleTagMap: ['architecture', 'implementation', 'api', 'database', 'framework', 'code']
- Decision tags: ['security', 'api', 'infrastructure']
- Matches with roleTagMap: 'api' → 1 match
- **C = min(1.0, 1 × 0.25) × 0.15 = 0.25 × 0.15 = 0.0375**

### Step D: Semantic Similarity
Assume cosine_similarity = 0.72 (auth middleware task vs. rate limiting decision)
- **D = 0.72 × 0.25 = 0.18**

### Step E: Status Penalty
Status is 'active' → no penalty

### Relevance Score
**relevance_score = 0.4 + 0.147 + 0.0375 + 0.18 = 0.7645**

### Freshness Score
Age = 48 hours, not validated → half-life = 7 days = 168 hours
**freshness_score = exp(-48 / 168) = exp(-0.286) = 0.751**

### Combined Score
**combined = min(1.0, (0.7645 × 0.7) + (0.751 × 0.3)) = min(1.0, 0.5352 + 0.2253) = 0.760**

**Inclusion reason:** 'directly_affects_agent'

---

## Worked Example 2: Same Decision → Launch Agent

**Same decision** "Require rate limiting on all auth endpoints" but scored for the **launch** agent.

**Agent:** launch
- `role`: 'launch'
- `relevance_profile.weights`: { positioning: 1.0, audience: 1.0, messaging: 1.0, content: 0.9, brand: 0.9, marketing: 1.0, launch: 0.8, deprecation: 0.7, breaking_change: 0.6, architecture: 0.2, implementation: 0.0, security: 0.1, code: 0.0 }

**Task:** "Write launch announcement for the new auth system"
- `task_embedding`: [0.05, 0.62, ...] (1536 dims)

### Step A: Direct Affect
`decision.affects` = ['builder', 'ops'] — does NOT include 'launch' → **A = 0.0**

### Step B: Tag Matching
- `security` → weight 0.1 ✓
- `api` → not in launch weights → skip
- `infrastructure` → not in launch weights → skip
- 1 match, sum = 0.1
- Average = 0.1 / 1 = 0.1
- **B = 0.1 × 0.2 = 0.02**

### Step C: Role Relevance
Launch's roleTagMap: ['positioning', 'audience', 'messaging', 'content', 'brand', 'marketing']
- Decision tags: ['security', 'api', 'infrastructure']
- Matches: 0
- **C = 0.0**

### Step D: Semantic Similarity
Assume cosine_similarity = 0.31 (launch announcement vs. rate limiting)
- **D = 0.31 × 0.25 = 0.0775**

### Relevance Score
**relevance_score = 0.0 + 0.02 + 0.0 + 0.0775 = 0.0975**

### Freshness (same)
**freshness_score = 0.751**

### Combined Score
**combined = min(1.0, (0.0975 × 0.7) + (0.751 × 0.3)) = min(1.0, 0.0683 + 0.2253) = 0.294**

**Inclusion reason:** 'moderate_relevance' (combined ≥ 0.2)

---

## The Proof

Same decision. Builder gets **0.760** (high priority, included early). Launch gets **0.294** (barely above threshold, included late or cut by packer). This is the core product differentiation.

---

## Graph Expansion (Spec §7 `expandGraphContext`)

After scoring, decisions with `combined_score ≥ 0.25` are expanded:
1. Call `get_connected_decisions(decision_id, max_depth)` — the recursive CTE
2. For each connected decision at depth N: `neighbor_score = parent_combined_score × 0.6^N`
3. If a connected decision already exists with a higher score, skip it
4. Connected decisions get `inclusion_reason: 'graph_neighbor_depth_N_via_RELATIONSHIP'`

**Example:** If a decision scores 0.76 and has a `requires` neighbor at depth 1:
- Neighbor score = 0.76 × 0.6¹ = 0.456
- If that neighbor has its own `informs` neighbor at depth 2:
  - Score = 0.76 × 0.6² = 0.274 (barely above 0.25 threshold for the parent, but this is the neighbor's score, not a threshold check — all graph neighbors are included)

---

## Token Budget Packing (Spec §8)

After scoring and expansion, pack into budget:

| Priority | Category | Budget % | Overflow |
|----------|---------|---------|---------|
| 1 | Notifications | 10% | Unused flows to decisions |
| 2 | Decisions | 55% + overflow | Unused flows to artifacts |
| 3 | Artifacts | 30% (capped at remaining) | Unused flows to sessions |
| 4 | Sessions | Whatever remains | — |

Token estimation: `Math.ceil(text.length / 4)`

Items packed in score order (highest first). The last decision packed sets `relevanceThreshold` in the result.

---

## What this changes in execution

Backend implements the scoring algorithm correctly on the first pass. No guessing at weights, no misunderstanding the combination formula, no incorrect graph decay. The worked examples serve as manual test cases: if the implementation produces these numbers for these inputs, it's correct. Eliminates: trial-and-error debugging of scoring, incorrect weight application, wrong freshness formula.
