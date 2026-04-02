# SKILL-REGRESSION-DETECTION

## Purpose

Identify and diagnose regressions in Nexus test output: numeric score drift, missing decisions in context, changed ordering, broken graph traversal, and silent behavioral changes that pass existing assertions but produce wrong results.

**Enforces**: INV-2 (Scoring Formula Fidelity), INV-4 (Compilation Determinism) from `projects/nexus-v1/shared/NEXUS-SYSTEM-INVARIANTS.md`

## When to Use

- Test failure investigation (especially in `scoring.test.ts` or `compiler.test.ts`)
- Post-refactor verification — "tests pass, but is output actually correct?"
- Score value changes detected during code review
- Compilation output changes (different decisions included, different ordering)
- Any "tests pass but behavior looks wrong" report

## Inputs Required

- `packages/core/tests/scoring.test.ts` — 43 tests with exact numeric expectations
- `packages/core/tests/compiler.test.ts` — output structure assertions
- `packages/core/tests/role-differentiation.test.ts` — proof lock (11 assertions)
- `packages/core/tests/scenario.test.ts` — THE Scenario (11 assertions)
- `projects/nexus-v1/shared/NEXUS-SYSTEM-INVARIANTS.md` — invariant definitions

## Execution Method

### Regression Categories

**Category A — Numeric Drift:**
A computed score changes from its expected value.

Detection: `scoring.test.ts` assertion fails (e.g., expected `0.607`, got `0.605`).

Diagnosis protocol:
1. Identify which signal changed: run `scoreDecision` with debug context, compare breakdown
2. Check if any constant was modified: `WEIGHT_*`, `PENALTY_*`, `ROLE_TAG_MAP_THRESHOLD`, `RELEVANCE_BLEND`, `FRESHNESS_BLEND`
3. Check if role template weights changed in `roles.ts`
4. Check if freshness parameters changed: `HALF_LIFE_VALIDATED_DAYS`, `HALF_LIFE_UNVALIDATED_DAYS`
5. If no constant changed: check for floating-point operation reordering (rare but possible with `Array.reduce` vs loop)

Resolution: Revert the change that modified the constant. If the change was intentional, update ALL 43 test expectations with recomputed values — do not estimate.

**Category B — Ordering Change:**
Decisions appear in a different order in compilation output.

Detection: `compiler.test.ts` or `role-differentiation.test.ts` assertion on decision order fails.

Diagnosis protocol:
1. Check if scores are equal (tie-breaking changed)
2. Check if `Array.sort` stability assumption is violated (V8's sort is stable, but verify)
3. Check if graph expansion changed the score for a decision (graph neighbor replaced a directly-scored decision)
4. Check if a new decision was added to the test project (changes relative ordering)

Resolution: If scores tie, the sort is correct either way — loosen the assertion to compare score values not order. If scores differ, the scoring change is the root cause.

**Category C — Inclusion Change:**
A decision that was previously included is now excluded, or vice versa.

Detection: `decisions_included` count changes, or specific decision title not found in output.

Diagnosis protocol:
1. Check if `relevance_threshold_used` changed (packer cut at a different point)
2. Check if the decision's score dropped below the threshold (scoring regression)
3. Check if `max_tokens` changed (budget shrank, fewer decisions fit)
4. Check if a new high-scoring decision was added (pushed lower-scoring ones out)
5. Check graph expansion: did a graph neighbor displace a directly-scored decision?

Resolution: Depends on root cause — scoring fix, budget adjustment, or test data update.

**Category D — Silent Behavioral Change:**
Tests pass but output is semantically wrong.

This is the most dangerous category. Examples:
- All decisions score 0.0 (but tests only assert `> 0` not specific values)
- `formatted_markdown` is empty string (passes `typeof === 'string'`)
- `notifications` array is always empty (test asserts `Array.isArray` but not length)
- `artifacts` all have `relevance_score: 0` (no `related_decision_ids` set)

Prevention:
- Assertions must be specific: exact values or tight ranges, not just type checks
- Every numeric assertion should use `toBeCloseTo(expected, 3)` with a computed expected value
- Collection assertions should include count: `expect(arr.length).toBe(N)` or `toBeGreaterThan(0)`

### Regression Triage Decision Tree

```
Test fails
├── Is it a scoring test? (scoring.test.ts)
│   ├── Check: did a constant change? → revert or recompute all 43 values
│   └── Check: did a role template change? → verify roleTagMap derivation
├── Is it a compilation test? (compiler.test.ts)
│   ├── Check: is it ordering? → compare scores, check ties
│   ├── Check: is it inclusion? → check threshold and budget
│   └── Check: is it format? → check formatter for template changes
├── Is it a role-diff test? (role-differentiation.test.ts)
│   ├── Check: did Signal A stop differentiating? → verify affects arrays
│   └── Check: did Signal B/C converge? → check tag weights and roleTagMap
└── Is it a scenario test? (scenario.test.ts)
    ├── Check: is it notification-related? → verify propagator
    └── Check: is it graph-related? → verify get_connected_decisions function
```

### Invariant-Linked Regression Classes

| Regression | Invariant | Test File | Severity |
|-----------|-----------|-----------|----------|
| Score value changed | INV-2 | `scoring.test.ts` | CRITICAL |
| Same output for different roles | INV-1 | `role-differentiation.test.ts` | CRITICAL |
| Different output for same inputs | INV-4 | `compiler.test.ts` | HIGH |
| Budget exceeded | INV-7 | `compiler.test.ts` | MEDIUM |
| Graph expansion removed a decision | INV-8 | `compiler.test.ts` | MEDIUM |
| Error response shape changed | INV-3 | `routes.test.ts` | HIGH |

### Do NOT Do This

- **Do not update test expectations without understanding why the value changed.** "Make the test pass" is not debugging. Compute the correct value from the formula.
- **Do not ignore ≤ 0.001 differences.** Floating-point precision issues compound across the pipeline. If a score changes by 0.001, something changed — find what.
- **Do not add `.skip` to a failing invariant test.** This is an explicit INV-2 violation.
- **Do not assume "tests pass = no regression."** Silent Category D regressions require assertion quality review, not just test execution.

## Failure Modes

| Failure | Signal | Most Likely Cause |
|---------|--------|-------------------|
| 1 scoring test fails | Specific expected value wrong | Constant or weight changed |
| 43 scoring tests fail | All expectations wrong | Formula restructured or blend ratio changed |
| role-diff test fails | Identical scores | `affects` handling broken or Signal A weight zeroed |
| scenario test fails | Notification missing | Propagator agent name resolution broken |
| compiler test flaky | Passes sometimes, fails sometimes | `new Date()` used instead of fixed `now` (INV-4) |

## Exit Criteria

- Root cause identified (specific constant, function, or data change)
- Fix addresses root cause, not symptoms (test expectations match formula, not reverse)
- All 213 tests pass after fix
- No test expectation loosened without explicit justification
- Regression cause documented in daily memory for future reference
