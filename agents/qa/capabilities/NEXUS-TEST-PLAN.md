# NEXUS-TEST-PLAN.md

What must be proven before Nexus v1 can ship. Derived from Spec §20, §21.

---

## Test Infrastructure

- **Framework:** Vitest (Spec §2)
- **Database:** Real PostgreSQL 16 with pgvector. NOT SQLite. NOT mocked. Vector queries and recursive CTEs must execute against real Postgres
- **Embeddings:** Stub embedder for unit tests (returns deterministic vectors). Real OpenAI embeddings for integration/scenario tests (sparingly — API costs + rate limits)
- **Test DB setup:** Each test suite creates its own project to avoid cross-test contamination. Teardown deletes test data

## Unit Tests (4 files, Spec §20)

### `decision-graph.test.ts`
- Create decision → all fields persisted correctly including embedding
- Create edge → relationship stored, self-edge rejected, duplicate rejected
- Update decision status (active → superseded) → status changes, updated_at updates
- List decisions by project, filter by status
- List decisions by tags (GIN index)
- Graph traversal: 5 decisions in a chain (A→B→C→D→E) → `get_connected_decisions(A, 3)` returns B(depth 1), C(depth 2), D(depth 3), not E(depth 4)

### `context-compiler.test.ts`
- Score security decision for **reviewer** → combined_score > 0.5
- Score security decision for **launch** → combined_score < 0.35
- Score marketing decision for **launch** → combined_score > 0.5
- Score marketing decision for **builder** → combined_score < 0.35
- Graph expansion includes neighbors at reduced weight (0.6^depth)
- Freshness: 1-day-old decision scores higher than 30-day-old
- Freshness: validated decision scores higher than unvalidated (same age)
- Packer respects token budget (never exceeds maxTokens)
- Packer includes higher-scored items first
- Packer allocates ~10% to notifications, ~55% to decisions

### `change-propagator.test.ts`
- Decision created → affected agents get notifications, unaffected don't
- Decision superseded → both old and new `affects` lists get notified
- Different roles get different `role_context` messages (builder ≠ reviewer ≠ launch)
- Cache invalidated on change (context_cache rows deleted for affected agents)

### `roles.test.ts`
- All 8 templates load via `getRoleTemplate()`
- Weight override works (`getRoleTemplate('builder', { security: 1.0 })` → security weight is 1.0)
- Unknown role throws descriptive error
- `listRoleTemplates()` returns 8 entries
- `inspectRoleTemplate()` returns deep copy (mutations don't affect original)

## Scenario Tests (5 scenarios in `scenario.test.ts`, Spec §20)

These are the **most important tests**. They prove the product claim.

### Scenario A: Different Roles → Different Context
- **Setup:** Project with 10 decisions spanning architecture, security, marketing, deployment, scope, API topics. Register builder, reviewer, launch with role templates
- **Action:** `compile()` for each agent with the same task ("Review project status")
- **Verify:** Builder's top 3 decisions are NOT the same as reviewer's top 3. Launch's top 3 are NOT the same as builder's. At least 2 decisions appear in one agent's top 5 but not another's
- **This is the core claim.** If this test fails, the product doesn't work

### Scenario B: Superseded Decision Updates Context
- **Setup:** Project with active decision D1. Compile for builder (D1 included). Create D2 that supersedes D1
- **Action:** Compile again for builder
- **Verify:** D2 appears in context. D1 either absent or has reduced score (× 0.4 penalty). D2's score > D1's score

### Scenario C: Affected Roles Notified, Unaffected Not
- **Setup:** Project with builder, reviewer, launch agents. Create decision affecting ['builder', 'launch'] only
- **Action:** Check notifications
- **Verify:** builder has notification, launch has notification, reviewer has NO notification

### Scenario D: Graph Neighbors Included at Reduced Priority
- **Setup:** Decision A (high relevance to builder). Decision B connected to A via 'requires' edge. Decision C connected to B via 'informs' edge
- **Action:** Compile for builder
- **Verify:** A in context (direct relevance). B in context (depth 1, score = A × 0.6). C in context (depth 2, score = A × 0.36). B's score < A's score. C's score < B's score

### Scenario E: Baseline vs. Nexus Differs Materially
- **Setup:** Same as Scenario A
- **Action:** Naive retrieval (all decisions sorted by recency) vs. Nexus compilation
- **Verify:** Nexus returns different orderings for different agents. Naive retrieval returns identical ordering for all. The intersection of builder's top 5 and launch's top 5 is ≤ 3 (at least 2 differ)

## Performance Targets (Spec §20)

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Compile latency (100 decisions) | < 2 seconds | Time `compile()` call with 100 seeded decisions, real embeddings, real DB |
| Cache hit latency | < 100ms | Second `compile()` with same agent + task (cache populated) |

## Launch Checklist Tests (Spec §21)

These are verified as part of the pre-launch gate, not automated tests:
- [ ] `npm install @nexus-ai/sdk` works
- [ ] `docker compose up -d` starts working instance
- [ ] `pnpm demo:compare` runs end-to-end
- [ ] `POST /api/compile` returns in < 2s with 100 decisions
- [ ] Two agents with different roles get DIFFERENT context (Scenario A automated)
- [ ] Change propagation works (Scenario C automated)
- [ ] Graph traversal works (Scenario D automated)
- [ ] All tests pass

---

## What this changes in execution

QA has a complete, prioritized test plan with specific assertions before any code is written. Tests can be written test-first. The scenario tests define what "the product works" means in concrete, verifiable terms. Eliminates: vague "test the compiler" tasks, missing edge cases discovered post-implementation, debates about what "done" means, placeholder tests that assert nothing.
