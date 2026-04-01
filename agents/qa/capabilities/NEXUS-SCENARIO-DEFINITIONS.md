# NEXUS-SCENARIO-DEFINITIONS.md

Concrete test scenarios with setup data and expected outputs. These prove the core claim: same project, different role → materially different context.

---

## Shared Test Data

### Project
```typescript
{ name: 'Scenario Test Project', description: 'Auth system with API, deployment, and marketing decisions' }
```

### Agents (3, using role templates from Spec §6)
```typescript
const agents = {
  builder:  { name: 'builder',  role: 'builder',  relevance_profile: getRoleTemplate('builder') },
  reviewer: { name: 'reviewer', role: 'reviewer', relevance_profile: getRoleTemplate('reviewer') },
  launch:   { name: 'launch',   role: 'launch',   relevance_profile: getRoleTemplate('launch') }
};
```

### Decisions (10, with tags and affects designed to produce divergent scores)

| # | Title | Tags | Affects | Status |
|---|-------|------|---------|--------|
| D1 | Use stateless JWT for API authentication | `['architecture', 'api', 'security']` | `['builder', 'reviewer']` | active |
| D2 | Rotate refresh tokens on every renewal | `['security', 'api', 'implementation']` | `['builder', 'reviewer']` | active |
| D3 | Split auth API from web auth flow | `['architecture', 'api']` | `['builder']` | active |
| D4 | Use edge-compatible middleware only | `['architecture', 'framework', 'infrastructure']` | `['builder', 'ops']` | active |
| D5 | Move audit logging to async queue | `['infrastructure', 'performance']` | `['builder', 'ops']` | active |
| D6 | Deprecate legacy /login route by May 1 | `['deprecation', 'api', 'breaking_change']` | `['builder', 'docs', 'launch']` | active |
| D7 | Delay SSO until post-launch | `['scope', 'requirements', 'tradeoff']` | `['product', 'builder', 'launch']` | active |
| D8 | Require rate limiting on all auth endpoints | `['security', 'api', 'infrastructure']` | `['builder', 'ops']` | active |
| D9 | Store password hashes with Argon2id | `['security', 'implementation', 'code']` | `['builder', 'reviewer']` | active |
| D10 | Use feature flags for auth method rollout | `['requirements', 'scope', 'launch']` | `['builder', 'launch', 'product']` | active |

---

## Scenario A: Different Roles → Different Context

**Task for all agents:** "Review the current auth implementation decisions"

### Expected: Builder's Top 5

Builder has high weights for: architecture (1.0), implementation (1.0), api (0.9), database (0.9), framework (0.8), code (0.8), infrastructure (0.7), security (0.6).

Builder is in `affects` for: D1, D2, D3, D4, D5, D6, D7, D8, D9, D10 (all 10).

**Expected top scorers for builder:** D1, D2, D3, D8, D9 — all directly affect builder AND match builder's high-weight tags (architecture, api, security, implementation, code).

D6 (deprecation) scores lower — builder has no `deprecation` weight.
D7 (scope, requirements, tradeoff) — builder has no weights for these tags.

### Expected: Reviewer's Top 5

Reviewer has high weights for: security (1.0), code_quality (1.0), architecture (0.9), testing (0.9), code (0.8), vulnerability (0.8).

Reviewer is in `affects` for: D1, D2, D9 only.

**Expected top scorers for reviewer:** D1, D2, D9 (directly affected + security/architecture tags). D8 scores moderately (security tag but not in affects). D3 lower (architecture but not in affects and no security tag).

### Expected: Launch's Top 5

Launch has high weights for: positioning (1.0), audience (1.0), messaging (1.0), content (0.9), brand (0.9), marketing (1.0), launch (0.8), deprecation (0.7), breaking_change (0.6).

Launch is in `affects` for: D6, D7, D10 only.

**Expected top scorers for launch:** D6 (deprecation + breaking_change + directly affected), D10 (launch tag + directly affected), D7 (scope/requirements — but launch has no weight for these tags, so relies on direct affect only). D1-D5, D8-D9 should score LOW for launch (no relevant tags, not in affects).

### Verification Assertions

```typescript
// Builder and launch must have materially different top 3
const builderTop3 = builderContext.decisions.slice(0, 3).map(d => d.decision.id);
const launchTop3 = launchContext.decisions.slice(0, 3).map(d => d.decision.id);
const overlap = builderTop3.filter(id => launchTop3.includes(id));
expect(overlap.length).toBeLessThanOrEqual(1); // At most 1 shared in top 3

// Builder should have D1 or D2 in top 3 (security + architecture + directly affected)
expect(builderTop3).toContainAny([d1.id, d2.id]);

// Launch should have D6 in top 3 (deprecation + breaking_change + directly affected)
expect(launchTop3).toContain(d6.id);

// Launch should NOT have D5 or D9 in top 5 (pure infrastructure/code, not in launch affects)
const launchTop5Ids = launchContext.decisions.slice(0, 5).map(d => d.decision.id);
expect(launchTop5Ids).not.toContain(d5.id);
expect(launchTop5Ids).not.toContain(d9.id);

// Reviewer should have fewer total decisions than builder (narrower scope)
expect(reviewerContext.decisions.length).toBeLessThanOrEqual(builderContext.decisions.length);
```

---

## Scenario B: Superseded Decision

**Setup:** Compile for builder with D7 ("Delay SSO") included. Then create D11 ("Include SSO for enterprise beta") superseding D7.

**Expected after recompile:**
- D7 status is now 'superseded'
- D11 appears in builder's context
- D7's score is reduced (× 0.4 penalty since builder profile has `include_superseded: true`)
- D11.combined_score > D7.combined_score

```typescript
const d7Score = updatedContext.decisions.find(d => d.decision.id === d7.id)?.combined_score ?? 0;
const d11Score = updatedContext.decisions.find(d => d.decision.id === d11.id)?.combined_score ?? 0;
expect(d11Score).toBeGreaterThan(d7Score);
```

---

## Scenario C: Notification Targeting

**Setup:** Create decision with `affects: ['builder', 'launch']`.

**Expected:**
```typescript
const builderNotifs = await getNotifications(builder.id, true);
const launchNotifs = await getNotifications(launch.id, true);
const reviewerNotifs = await getNotifications(reviewer.id, true);

expect(builderNotifs.length).toBeGreaterThan(0);
expect(launchNotifs.length).toBeGreaterThan(0);
expect(reviewerNotifs.length).toBe(0); // NOT affected

// Role context differs
expect(builderNotifs[0].role_context).toContain('implementation');
expect(launchNotifs[0].role_context).toContain('messaging');
```

---

## Scenario D: Graph Expansion

**Setup:** D1 scores high for builder (direct affect + matching tags). Create edge: D1 → D3 (requires). Create edge: D3 → D5 (informs). Builder profile `decision_depth: 3`.

**Expected in builder's compilation:**
```typescript
const d1Entry = context.decisions.find(d => d.decision.id === d1.id);
const d3Entry = context.decisions.find(d => d.decision.id === d3.id);
const d5Entry = context.decisions.find(d => d.decision.id === d5.id);

// D3 included as graph neighbor of D1
expect(d3Entry).toBeDefined();
expect(d3Entry.graph_depth).toBe(1);
expect(d3Entry.inclusion_reason).toContain('graph_neighbor');

// D5 included at depth 2
expect(d5Entry).toBeDefined();
expect(d5Entry.graph_depth).toBe(2);

// Scores decay: D1 > D3 > D5
expect(d1Entry.combined_score).toBeGreaterThan(d3Entry.combined_score);
expect(d3Entry.combined_score).toBeGreaterThan(d5Entry.combined_score);
```

---

## Scenario E: Baseline vs. Nexus

**Setup:** Same as Scenario A.

**Baseline:** Sort all decisions by `created_at DESC`, take top 5. Same result for every agent.

**Nexus:** `compile()` for builder and launch.

```typescript
const baselineTop5 = allDecisions
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  .slice(0, 5)
  .map(d => d.id);

const builderTop5 = builderContext.decisions.slice(0, 5).map(d => d.decision.id);
const launchTop5 = launchContext.decisions.slice(0, 5).map(d => d.decision.id);

// Baseline is identical for both (just sorted by time)
// Nexus is different for each
expect(builderTop5).not.toEqual(launchTop5);

// At least 2 decisions differ between builder and launch top 5
const nexusDiff = builderTop5.filter(id => !launchTop5.includes(id));
expect(nexusDiff.length).toBeGreaterThanOrEqual(2);
```

---

## What this changes in execution

QA and Backend have concrete, copy-pasteable test data and assertions. No interpretation needed. The expected outputs are derived from the scoring algorithm with the actual role template weights, not guesses. Eliminates: "what should the test assert?", vague pass/fail criteria, tests that prove nothing, post-implementation debates about whether the output is correct.
