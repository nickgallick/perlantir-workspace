# SKILL-SCENARIO-CONSTRUCTION

## Purpose

Design test scenarios with realistic decision sets that stress-test specific compiler behaviors beyond THE Scenario (spec §20). Target: graph depth limits, tag overlap edge cases, superseded chains, budget overflow, zero-match agents, and high decision counts.

## When to Use

- New feature implementation needs targeted test coverage
- Investigating a compilation bug that THE Scenario doesn't reproduce
- Expanding test coverage for edge cases identified during code review
- Stress-testing at scale (50, 200, 1000 decisions)
- Validating new scoring signals or formula changes

## Inputs Required

- `agents/qa/capabilities/NEXUS-SCENARIO-DEFINITIONS.md` — existing scenario data patterns
- `packages/core/tests/scenario.test.ts` — THE Scenario implementation (pattern reference)
- `agents/qa/capabilities/NEXUS-TEST-PLAN.md` — test strategy
- `packages/core/src/context-compiler/packer.ts` — budget/overflow logic to stress-test
- `packages/core/src/context-compiler/scoring.ts` — scoring edge cases
- `packages/core/src/decision-graph/traversal.ts` — graph traversal limits

## Execution Method

### Scenario Design Template

Every scenario must define:

```
Name:            Short identifier (e.g., "deep-graph-chain")
Target behavior: What specific system behavior is being tested
Setup data:      Exact decisions, agents, edges required
Trigger:         The compile() call that exercises the behavior
Expected output: Specific numeric or structural assertions
Why existing tests don't cover this: Gap identification
```

### Scenario Categories (Priority Order)

**Category 1 — Budget Pressure:**
Test packer behavior when decisions exceed the token budget.

- Setup: 20+ decisions, all scoring > 0.3, token budget of 2000
- Assert: `decisions_included < decisions_considered`
- Assert: Included decisions have higher `combined_score` than excluded
- Assert: `relevance_threshold_used > 0` (packer actually cut)
- Assert: `totalTokens <= maxTokens + single_item_margin`

**Category 2 — Graph Depth Stress:**
Test graph expansion at depth limits.

- Setup: Linear chain of 6 decisions: A→B→C→D→E→F
- Agent `decision_depth` set to 3
- Compile for decision A with high score
- Assert: B, C, D included as graph neighbors (depth 1, 2, 3)
- Assert: E, F NOT included (depth 4, 5 — beyond limit)
- Assert: Score decay applied: B = parent × 0.6, C = parent × 0.36, D = parent × 0.216

**Category 3 — Superseded Chain:**
Test behavior with multiple generations of superseded decisions.

- Setup: Decision A (active), superseded by B (superseded), superseded by C (active)
- Agent profile with `include_superseded: true`
- Assert: C scores highest (active, most recent)
- Assert: B scores with 0.4 penalty (superseded, included)
- Assert: A scores with 0.4 penalty (superseded, included)
- Then flip to `include_superseded: false`:
- Assert: B scores with 0.1 penalty (superseded, excluded)

**Category 4 — Zero-Match Agent:**
Test compilation for an agent with no matching signals.

- Setup: 5 decisions all with `affects: ['builder']`, tags: `['code', 'api']`
- Compile for a `launch` agent
- Assert: `decisions_included > 0` (decisions still available, just lower scored)
- Assert: All scores are low (< 0.15 — only tag matching possible, no directAffect)
- Assert: Output is valid ContextPackage (not error, not empty crash)

**Category 5 — Tag Overlap Saturation:**
Test when a decision's tags perfectly match a role's high-weight tags.

- Setup: Decision with `tags: ['architecture', 'implementation', 'api', 'database', 'code', 'framework']` (all builder roleTagMap tags)
- Assert: Signal C (roleRelevance) = `min(1.0, 6 × 0.25) × 0.15 = 0.15` (capped at max)
- Assert: Signal B (tagMatching) approaches maximum due to high average weight
- This is the "perfect match" ceiling for a single decision

**Category 6 — Empty Project:**
Test compilation for a project with no decisions.

- Setup: Project with 1 agent, 0 decisions
- Assert: `decisions_considered === 0`
- Assert: `decisions_included === 0`
- Assert: `formatted_markdown` still valid (contains agent metadata, no decisions section)
- Assert: No error thrown

**Category 7 — Notification Flood:**
Test change propagator with many affected agents.

- Setup: Decision with `affects` listing 6+ agent names
- Assert: Notification generated for each agent
- Assert: Each notification has role-appropriate `role_context`
- Assert: Notification count = number of matching agent rows (not affected names, since name→agent resolution may match multiple)

### Constructing Decision Sets

**Realistic data guidelines:**
- Titles: specific enough to differentiate (`"Use JWT for API auth"` not `"Decision 1"`)
- Tags: drawn from existing roleTagMap entries (see `roles.ts` for valid high-weight tags per role)
- Affects: use actual agent names created in the test setup
- Made_by: use realistic maker roles (`architect`, `product`, `security`)
- Confidence: vary (`high`, `medium`, `low`) — doesn't affect scoring but affects realism

**Scaling guidelines:**
- 4-10 decisions: standard functional testing
- 20-50 decisions: budget pressure testing
- 100-200 decisions: performance baseline
- 500-1000 decisions: stress testing (see SKILL-COMPILATION-PERFORMANCE-VALIDATION)

### Do NOT Do This

- **Do not create scenarios with all identical decisions.** This tests nothing — all scores will be equal regardless of role.
- **Do not create scenarios without explicit expected values.** "It should work" is not an assertion. Compute the expected score.
- **Do not hardcode UUIDs in scenarios.** Create entities in `beforeAll` and reference the returned IDs.
- **Do not create scenarios that depend on timing.** Pass fixed `now` to `compile()` for deterministic freshness scores (INV-4).
- **Do not test features that don't exist yet** (e.g., session summaries in compile output when sessions are opt-in and untested).

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| Scenario passes trivially | Assertions too weak (e.g., `expect(result).toBeDefined()`) | Code review | Add numeric assertions on scores, counts, ordering |
| Scenario flaky across runs | Time-dependent freshness without fixed `now` | Intermittent test failure | Pass `{ now: new Date('2026-04-02T02:00:00Z') }` to compile |
| Scenario can't reproduce a bug | Test data too different from production data | Bug persists despite passing scenario | Match production decision shapes exactly |
| Graph expansion scenario gives 0 neighbors | `get_connected_decisions` SQL function not applied | No graph expansion in results | Verify migration applied, edges created correctly |

## Exit Criteria

- Scenario has explicit target behavior documented
- Setup data creates the exact conditions needed (not more, not less)
- Assertions are numeric or structural (not just "defined" or "truthy")
- Fixed `now` used for any freshness-dependent assertion
- Cleanup removes all test data in `afterAll`
- Scenario follows the canonical integration test pattern (SKILL-INTEGRATION-TEST-AUTHORING)
