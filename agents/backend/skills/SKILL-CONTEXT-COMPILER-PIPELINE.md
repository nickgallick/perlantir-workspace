# SKILL-CONTEXT-COMPILER-PIPELINE

## Purpose

Understand and extend the 10-step `compile()` pipeline. This is the product's core value — every new data source, output format, or optimization modifies this pipeline.

## When to Use

- Any task modifying compilation output or behavior
- Adding a new data source to context (e.g., artifacts, sessions, cache)
- Changing pack priority allocation
- Debugging compilation results (wrong decisions, missing artifacts, unexpected ordering)
- Performance optimization of the compile path
- Adding new output format

## Inputs Required

- `packages/core/src/context-compiler/compiler.ts` — `compile()` and `expandGraphContext()`
- `packages/core/src/context-compiler/packer.ts` — `packIntoBudget()` with priority cascade
- `packages/core/src/context-compiler/formatter.ts` — `formatAsMarkdown()` and `formatAsJson()`
- `packages/core/src/context-compiler/scoring.ts` — scoring functions (see SKILL-SCORING-IMPLEMENTATION)
- `packages/core/src/decision-graph/traversal.ts` — `getConnectedDecisions()` for graph expansion
- `packages/core/tests/compiler.test.ts` — 25 tests
- `packages/core/tests/role-differentiation.test.ts` — 11 proof assertions
- `agents/backend/capabilities/NEXUS-KNOWN-SPEC-ISSUES.md` — BUG-4 (formatter), BUG-5 (packer)

## Execution Method

### The 10-Step Pipeline

```
compile(pool, request, options?) → ContextPackage
│
├── 1. fetchAgent(pool, request.agent_id)
│      → Agent (with relevance_profile, context_budget_tokens)
│
├── 2. fetchProjectDecisions(pool, project_id, include_superseded)
│      → Decision[] (active + pending + optionally superseded)
│
├── 3. Generate task embedding (optional, if embeddingFn provided)
│      → number[1536]
│
├── 4. scoreDecisions(decisions, { agent, taskEmbedding, now })
│      → ScoringResult[] sorted by combined_score DESC
│
├── 5. expandGraphContext(pool, scoringResults, agent, ...)
│      → ScoringResult[] with graph neighbors injected
│
├── 6. fetchAndScoreArtifacts(pool, project_id, scoringResults)
│      → ScoredArtifact[] (relevance = max related decision score)
│
├── 7. fetchNotifications(pool, agent_id) [unless include_notifications=false]
│      → Notification[] (unread, limit 50)
│
├── 8. fetchSessions(pool, ...) [only if include_sessions=true]
│      → SessionSummary[]
│
├── 9. packIntoBudget({ decisions, artifacts, notifications, sessions, maxTokens })
│      → PackResult (priority-allocated, budget-constrained)
│
└── 10. formatAsMarkdown + formatAsJson
       → formatted_markdown, formatted_json strings
```

### Step 5 Deep Dive — Graph Expansion

Graph expansion is the most complex step:

1. Build a `Map<decisionId, ScoringResult>` from step 4 results
2. Filter to decisions with `combined_score >= 0.25` (GRAPH_INCLUSION_THRESHOLD)
3. For each qualifying decision, call `getConnectedDecisions(pool, id, maxDepth)`
4. For each connected decision: `neighborScore = parentScore × 0.6^depth`
5. **Skip-if-higher**: If the neighbor already exists in the map with a higher score, don't replace it
6. Fetch the neighbor's full decision row if not already loaded
7. Set `graph_depth`, `inclusion_reason = "graph_neighbor_depth_N_via_RELATIONSHIP"`, `connected_decisions = [parentId]`
8. Add to map, re-sort all results by combined_score DESC

Key invariant: Graph expansion only **adds** decisions or **replaces** lower-scored ones. It never removes or downgrades existing scores.

### Step 9 Deep Dive — Budget Packing

Priority cascade allocation (token budget percentages):

| Priority | Budget % | Content |
|----------|----------|---------|
| 1 (critical) | 10% | Agent metadata + task description |
| 2 (high) | 55% | Decisions (sorted by combined_score DESC) |
| 3 (medium) | 30% | Artifacts + notifications |
| 4 (low) | 5% | Session summaries |

**Overflow**: If a priority tier doesn't use its full allocation, remaining tokens flow to the next tier. Token estimation: `Math.ceil(JSON.stringify(item).length / 4)`.

**Relevance threshold**: The packer tracks the lowest `combined_score` of any included decision. Reported in output as `relevance_threshold_used`.

### Adding a New Data Source

To add a new data source to the compiler:

1. Create a fetch function (e.g., `fetchCustomData(pool, ...)`)
2. Add it between steps 8 and 9 (before packing)
3. Define a scored type (e.g., `ScoredCustomData`)
4. Add it to `PackInput` interface in `packer.ts`
5. Allocate budget percentage — **the 4 tiers must still sum to 100%**
6. Add it to both formatters (`formatAsMarkdown` and `formatAsJson`)
7. Add the field to `ContextPackage` type in `types.ts`
8. Add tests covering: empty data, budget overflow, format output

### Modifying the Formatter

- `formatAsMarkdown` produces human-readable context for LLM consumption
- `formatAsJson` produces structured context for programmatic use
- Both receive the `PackResult` — they format what the packer included
- Known bugs fixed (BUG-4, BUG-5): template literal backtick handling and `.join()` calls

### Do NOT Do This

- **Do not call `pool.query` in the formatter or packer.** These are pure functions. All data fetching happens in steps 1-8.
- **Do not change the step order** without understanding dependencies: scoring needs the agent (step 1), graph expansion needs scores (step 4), packing needs everything (steps 4-8).
- **Do not remove the `min(1.0, ...)` on combined_score** in the scoring layer — scores > 1.0 break the packer's relevance threshold logic.
- **Do not modify `GRAPH_SCORE_DECAY` (0.6) or `GRAPH_INCLUSION_THRESHOLD` (0.25)** without re-running all compiler and scenario tests. These constants determine which decisions get graph-expanded and how much their neighbors contribute.
- **Do not add database round-trips inside the packing loop.** Packing may iterate hundreds of decisions — all data must be pre-fetched.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| `Agent not found: UUID` | Invalid or deleted agent_id | Error thrown at step 1 | Validate agent exists before compile, or return typed error |
| Empty context package (0 decisions) | All decisions below relevance threshold, or project has no decisions | `decisions_included === 0` | Check project has decisions; check scoring produces non-zero scores |
| Graph expansion returns 0 neighbors | `getConnectedDecisions` function missing in DB, or no edges exist | `debugTrace.graphExpansionLog` empty | Verify migration applied (get_connected_decisions function), verify edges exist |
| Budget overflow — decisions truncated | Too many high-scoring decisions for token budget | `budget_used_pct < 100` but decisions missing | Increase `max_tokens` or accept the relevance threshold cutoff |
| Determinism failure | Using `new Date()` instead of `options.now` | Same input produces different `combined_score` | Always pass `now` in tests; production uses `new Date()` (acceptable) |
| `compilation_time_ms` negative | Clock skew (shouldn't happen) | Negative value in output | Use `Math.max(0, Date.now() - startTime)` |
| Artifact scoring returns 0 for all | No `related_decision_ids` on artifacts | All artifacts have `relevance_score: 0` | Ensure artifacts reference decision IDs when registered |

## Nexus-Specific Examples

**Compile call from SDK through server:**
```
SDK: client.compileForAgent('builder', 'Implement auth', projectId)
  → client.compileContext({ agent_id, task_description })
    → POST /api/compile { agent_id, task_description }
      → compile(pool, request, { debug: false })
        → ContextPackage
```

**What the ContextPackage contains:**
```typescript
{
  agent: { name: 'builder', role: 'builder' },
  task: 'Implement auth middleware',
  compiled_at: '2026-04-02T...',
  token_count: 3420,
  budget_used_pct: 42.75,
  decisions: ScoredDecision[],      // sorted by combined_score DESC
  artifacts: ScoredArtifact[],       // sorted by relevance_score DESC
  notifications: Notification[],
  recent_sessions: SessionSummary[],
  formatted_markdown: string,        // human-readable
  formatted_json: string,            // structured
  decisions_considered: 10,
  decisions_included: 7,
  relevance_threshold_used: 0.1234,
  compilation_time_ms: 45,
}
```

## Exit Criteria

- `compile()` returns a valid `ContextPackage` with all fields populated
- Decisions are sorted by `combined_score` descending in output
- Graph expansion adds neighbors with decayed scores without removing existing higher scores
- Packer respects token budget with correct priority cascade (10/55/30/5)
- Both formatters produce non-empty output for non-empty input
- 25 `compiler.test.ts` tests pass
- 11 `role-differentiation.test.ts` assertions pass
- Role-differentiated output proven: same project + different agents → different `decisions` ordering and scores
