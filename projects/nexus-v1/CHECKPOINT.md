# CHECKPOINT — Nexus v1

---

## Schema and Provenance

```
schema-version      : 1.0.0
checkpoint-id       : 009
prior-checkpoint-id : 008
last-writer         : Governor
last-updated        : 2026-04-02 06:10 UTC+8
active-owner        : Governor
lock-status         : UNLOCKED
```

---

## Project and Phase

```
project             : Nexus v1
phase               : Day 7 — SDK Ergonomics + Demo + Developer Path
approval-category   : 2
approval-phrase     : "Proceed to Day 7" (operator directive)
approval-timestamp  : 2026-04-02 06:03 UTC+8
approved-scope      : SDK methods for full server surface, typed errors, E2E tests through SDK, demo polish, developer-path proof
approval-freshness  : FRESH
lifecycle           : COMPLETED
status              : PHASE-COMPLETE
session-termination : CLEAN
recovery-mode       : NORMAL
```

---

## Deliverables

### Day 7 Output — 3 files modified, 1 file created, 1 file rewritten

**SDK Client Enhancements:**
- [x] `packages/sdk/src/client.ts` — Added NexusApiError, NexusErrorEnvelope, HealthResponse types; added updateDecisionStatus, createEdge, listEdges, deleteEdge, listArtifacts, health methods; fixed getDecisionGraph return type to ConnectedDecision[]; error handling now preserves server error envelope
- [x] `packages/sdk/src/index.ts` — Added NexusApiError, NexusErrorEnvelope, HealthResponse exports

**SDK E2E Tests:**
- [x] `packages/sdk/tests/e2e.test.ts` — 27 new tests through Hono app boundary (health, error handling ×3, project CRUD, agent CRUD, decision CRUD ×5, edge CRUD ×4, artifact CRUD ×2, graph, compile ×3, role differentiation ×2, notifications ×2, full lifecycle)

**Config:**
- [x] `packages/sdk/package.json` — Added @nexus-ai/server, pg, @types/pg dev dependencies
- [x] `packages/sdk/vitest.config.ts` — Added fileParallelism: false, testTimeout: 30000

**Demo:**
- [x] `examples/software-team/comparison.ts` — Rewritten: 4-section structure (baseline/nexus/propagation/ergonomics), health check, artifact demo, edge/graph showcase, typed error handling demo

### Verification

- Build: 3/3 packages, zero TypeScript errors
- Tests: 213/213 pass (150 core + 36 SDK + 27 server, 13 test files)
- No regressions in any prior test file
- SDK E2E tests route through real Hono app + real PostgreSQL — not mocked

---

## Deviations

None. All deliverables match scope.

---

## Next Phase

Day 8+: Scope TBD. Requires explicit approval.
