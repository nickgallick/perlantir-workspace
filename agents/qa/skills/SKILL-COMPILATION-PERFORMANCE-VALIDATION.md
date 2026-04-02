# SKILL-COMPILATION-PERFORMANCE-VALIDATION

## Purpose

Verify compile latency, graph traversal cost, scoring throughput, and packing performance. Detect performance regressions under realistic decision counts. Establish baselines and thresholds for acceptable performance.

**Relates to**: INV-4 (Compilation Determinism — performance variance can indicate non-deterministic paths), INV-7 (Budget Respect — slow packing may indicate inefficient iteration)

## When to Use

- Adding decisions to a project at scale (50, 200, 1000)
- Changing the `compile()` pipeline (new steps, new data sources)
- Modifying graph traversal algorithm or depth limits
- Any change to `scoring.ts` that adds computation per decision
- Pre-release performance verification
- Investigating "compilation feels slow" reports

## Inputs Required

- `packages/core/src/context-compiler/compiler.ts` — compile() with `compilation_time_ms`
- `packages/core/src/decision-graph/traversal.ts` — recursive SQL traversal
- `packages/core/src/context-compiler/scoring.ts` — per-decision scoring (5 signals)
- `packages/core/src/context-compiler/packer.ts` — sort + greedy pack
- `packages/core/tests/compiler.test.ts` — existing compilation tests (no perf assertions yet)

## Execution Method

### Performance Budget (Target Thresholds)

| Decision Count | Max Compile Time | Max Graph Traversal | Notes |
|---------------|------------------|--------------------|----|
| 10 | 50ms | 10ms | Typical demo size |
| 50 | 150ms | 30ms | Small production project |
| 200 | 500ms | 100ms | Medium production project |
| 1000 | 2000ms | 400ms | Large project, stress test |

These are total `compilation_time_ms` values measured on the current hardware (8-core x86_64, 31 GiB RAM, PostgreSQL 17 local). Scale proportionally for different environments.

**Baseline reference** (from Day 7 E2E tests): Compilation with 4-5 decisions completes in < 50ms consistently.

### What Gets Measured

The `compile()` function already reports `compilation_time_ms` in every `ContextPackage`. This measures the full pipeline (steps 1-10). To isolate subsystems:

**Scoring throughput:**
```typescript
const start = Date.now();
const { results } = scoreDecisions(decisions, { agent, now });
const scoringMs = Date.now() - start;
// Expect: < 1ms per decision (pure computation, no I/O)
```

**Graph traversal:**
```typescript
const start = Date.now();
const connected = await getConnectedDecisions(pool, decisionId, depth);
const traversalMs = Date.now() - start;
// Expect: < 5ms per decision at depth 3 with < 50 edges
```

**Packing:**
```typescript
const start = Date.now();
const packed = packIntoBudget(input);
const packingMs = Date.now() - start;
// Expect: < 1ms for 200 decisions (sort + greedy scan)
```

**DB fetch (dominant cost):**
```
fetchAgent:             1 query, < 5ms
fetchProjectDecisions:  1 query, scales with decision count
fetchAndScoreArtifacts: 1 query + in-memory scoring
fetchNotifications:     1 query, < 5ms
```

### Performance Test Structure

```typescript
describe('Compilation Performance', () => {
  it('compiles 50 decisions within 150ms', async () => {
    // Setup: create project + agent + 50 decisions in beforeAll
    const start = Date.now();
    const pkg = await compile(pool, {
      agent_id: agentId,
      task_description: 'Performance test task',
    }, { now: fixedNow });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(150);
    expect(pkg.decisions_considered).toBe(50);
    expect(pkg.compilation_time_ms).toBeLessThan(150);
  });
});
```

### Performance Regression Detection

**Method 1 — Threshold Assertions:**
Add `expect(elapsed).toBeLessThan(threshold)` to existing compilation tests. Conservative thresholds (2× expected) to avoid flaky tests while catching 10× regressions.

**Method 2 — Relative Comparison:**
Compile the same data twice, verify times are within 2× of each other. If second run is > 2× first, something is non-deterministic or leaking.

**Method 3 — Scaling Linearity:**
Compile with N decisions, then 2N decisions. The 2N run should take < 3× the N run time (sublinear scaling is fine; superlinear indicates algorithmic regression).

```typescript
it('compilation scales sub-quadratically', async () => {
  // Compile with 50 decisions
  const pkg50 = await compile(pool, req50, opts);
  const time50 = pkg50.compilation_time_ms;

  // Compile with 100 decisions
  const pkg100 = await compile(pool, req100, opts);
  const time100 = pkg100.compilation_time_ms;

  // 2× decisions should NOT take > 3× time
  expect(time100).toBeLessThan(time50 * 3);
});
```

### Known Performance Characteristics

**O(N) operations** (linear in decision count):
- `fetchProjectDecisions` — 1 SQL query, PG handles N rows
- `scoreDecisions` — iterate N decisions, compute 5 signals each
- `packIntoBudget` — sort (O(N log N)) + greedy scan (O(N))

**O(N × D) operations** (N decisions × D graph depth):
- `expandGraphContext` — for each qualifying decision, query graph at depth D
- This is the most expensive step at scale. Each qualifying decision triggers a recursive SQL query.

**Potential bottleneck**: If 50% of 200 decisions qualify for graph expansion (score ≥ 0.25), that's 100 recursive SQL queries. Each query does a depth-limited BFS. At depth 3 with many edges, this can be slow.

**Mitigation strategies** (for future optimization):
- Batch graph queries (fetch all neighbors in one query instead of per-decision)
- Cache graph expansion results (context_cache table exists but is unused)
- Raise `GRAPH_INCLUSION_THRESHOLD` to reduce qualifying decisions

### Do NOT Do This

- **Do not add `setTimeout`-based timing assertions.** Use `Date.now()` delta or `compilation_time_ms` from the output.
- **Do not set thresholds too tight.** CI environments are slower than local dev. Use 2× the expected local time as the threshold.
- **Do not run performance tests with `fileParallelism: true`.** Parallel DB load skews timing.
- **Do not measure cold-start performance as representative.** First compile after PG restart includes connection setup and plan caching. Warm up with one compile before measuring.
- **Do not include embedding generation time in compile performance.** Embeddings are generated at decision creation, not at compile time (unless `embeddingFn` is passed, which is rare).

## Failure Modes

| Failure | Symptom | Root Cause | Fix |
|---------|---------|------------|-----|
| Compile > 500ms for 10 decisions | `compilation_time_ms` exceeds threshold | Graph expansion running per-decision queries | Check GRAPH_INCLUSION_THRESHOLD; batch queries |
| Compile time doubles after refactor | Threshold assertion fails | Added O(N²) operation in pipeline | Profile with timing logs; check for nested loops |
| Flaky timing assertions | Test passes locally, fails in CI | CI machine slower | Use 2× threshold or relative comparison instead of absolute |
| Graph traversal timeout | `getConnectedDecisions` > 5s | Dense graph with many edges at depth 3+ | Limit edge count in traversal query or reduce depth |
| Scoring takes > 10ms for 50 decisions | Unexpected scoring bottleneck | Embedding computation at score time (should be pre-stored) | Verify embeddings stored at creation, not computed at compile |

## Exit Criteria

- Performance test exists for at least 2 decision counts (e.g., 10 and 50)
- Threshold assertions use conservative bounds (2× expected)
- `compilation_time_ms` reported in output matches actual elapsed time
- Scaling test verifies sub-quadratic growth
- No existing tests broken by performance test additions
- Performance baselines documented for current hardware
