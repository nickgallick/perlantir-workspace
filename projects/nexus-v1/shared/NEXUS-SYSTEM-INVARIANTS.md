# NEXUS-SYSTEM-INVARIANTS.md

Canonical invariant registry for Nexus v1. Every agent must treat these as hard constraints. Violating any invariant is a blocking defect.

---

## INV-1: Role Differentiation

**Statement**: Given the same project state and task description, different agent roles MUST produce materially different `ContextPackage` outputs — different scores, different decision ordering, or different included decisions.

**Enforced by**:
- `packages/core/tests/role-differentiation.test.ts` — 11 assertions
- `packages/sdk/tests/e2e.test.ts` — 2 assertions (SDK boundary)
- `packages/server/tests/routes.test.ts` — 1 assertion (API boundary)

**Failure signal**: Tests produce identical `combined_score` arrays or identical decision ordering across roles. Core claim of the product is invalidated.

---

## INV-2: Scoring Formula Fidelity

**Statement**: The scoring formula MUST match `agents/backend/capabilities/NEXUS-ALGORITHM-REFERENCE.md` exactly. No signal weight, penalty, or formula change without explicit operator approval.

**Enforced by**:
- `packages/core/tests/scoring.test.ts` — 43 tests with exact numeric expectations (3 decimal precision)

**Failure signal**: Any `scoring.test.ts` assertion fails. Computed values diverge from spec worked examples.

**Locked constants**: `WEIGHT_DIRECT_AFFECT=0.4`, `WEIGHT_TAG_MATCHING=0.2`, `WEIGHT_ROLE_RELEVANCE=0.15`, `WEIGHT_SEMANTIC=0.25`, `RELEVANCE_BLEND=0.7`, `FRESHNESS_BLEND=0.3`, `ROLE_TAG_MAP_THRESHOLD=0.8`, `PENALTY_SUPERSEDED_INCLUDED=0.4`, `PENALTY_SUPERSEDED_EXCLUDED=0.1`, `PENALTY_REVERTED=0.05`

---

## INV-3: Error Envelope Consistency

**Statement**: Every HTTP error response MUST have the shape `{ error: { code: string, message: string, details?: unknown } }`. No exceptions — 400, 404, 500 all use this shape.

**Enforced by**:
- `packages/server/tests/routes.test.ts` — error envelope tests (404, validation, UUID)
- `packages/sdk/tests/e2e.test.ts` — `NexusApiError` parsing tests

**Failure signal**: SDK `NexusApiError` constructor fails to parse response. Client receives non-JSON or differently-shaped error body.

---

## INV-4: Compilation Determinism

**Statement**: Given identical inputs (`agent_id`, `task_description`, `max_tokens`, database state) and a fixed `now` timestamp, `compile()` MUST produce identical output every time.

**Enforced by**:
- `packages/core/tests/compiler.test.ts` — determinism tests use fixed `now`

**Failure signal**: Same test input produces different `combined_score` values or different decision ordering across runs. Flaky tests in compiler suite.

**Known exception**: If `embeddingFn` calls an external API (OpenAI) at compile time, embedding variance is possible. In practice, embeddings are stored at decision creation.

---

## INV-5: Status Penalty Application

**Statement**: Superseded decisions MUST receive penalty 0.4 (if profile includes superseded) or 0.1 (if excluded). Reverted decisions MUST receive penalty 0.05. Active/pending decisions MUST receive factor 1.0 (no penalty).

**Enforced by**:
- `packages/core/tests/scoring.test.ts` — penalty-specific test cases

**Failure signal**: Superseded or reverted decisions appear at top of context. `scoring.test.ts` penalty assertions fail.

---

## INV-6: Package Boundary Integrity

**Statement**: `@nexus-ai/core` MUST NOT import from `hono`, `@nexus-ai/server`, or `@nexus-ai/sdk`. `@nexus-ai/sdk` MUST NOT import `pg` at runtime. `@nexus-ai/server` MUST NOT define shared types or contain scoring/compilation logic.

**Enforced by**:
- `packages/*/package.json` — dependency declarations
- TypeScript compiler — import resolution errors on boundary violation
- `turbo.json` — build dependency graph

**Failure signal**: Circular dependency error during `turbo build`. SDK consumers get `Cannot find module 'pg'` at runtime. Type definitions split across packages.

---

## INV-7: Budget Respect

**Statement**: `packIntoBudget()` MUST NOT produce output where `totalTokens` significantly exceeds `maxTokens`. (Greedy packing may overshoot by at most one item's token count.)

**Enforced by**:
- `packages/core/tests/compiler.test.ts` — packer budget tests

**Failure signal**: `budget_used_pct` exceeds 100% by more than a single item's contribution. Context window wasted on overflow.

---

## INV-8: Graph Expansion Monotonicity

**Statement**: `expandGraphContext()` MUST NOT remove or downgrade existing scored decisions. It may only add new decisions or replace entries with higher-scored alternatives.

**Enforced by**:
- `packages/core/tests/compiler.test.ts` — graph expansion tests

**Failure signal**: A decision present after scoring (step 4) disappears after graph expansion (step 5). Score decreases for an existing decision after expansion.

---

## INV-9: Cascade Deletion

**Statement**: Deleting a project MUST cascade-delete all agents, decisions, edges, artifacts, and notifications belonging to that project. No orphaned rows permitted.

**Enforced by**:
- `supabase/migrations/001_initial_schema.sql` — `ON DELETE CASCADE` on all project-scoped foreign keys
- Test cleanup in `routes.test.ts`, `e2e.test.ts` (manual verification)

**Failure signal**: Queries return data referencing a deleted project. Foreign key violation on cascaded entity insertion after parent deletion.

---

## INV-10: Locked Decisions

**Statement**: Stack and design decisions listed as LOCKED in `agents/architect/capabilities/NEXUS-LOCKED-DECISIONS.md` cannot be changed without explicit operator override.

**Enforced by**:
- `NEXUS-LOCKED-DECISIONS.md` — reviewed during architectural decisions
- Governor approval gate — any proposal to change a locked decision requires Category 2+ approval

**Failure signal**: Agent proposes or implements an alternative to a locked decision (e.g., switching from pg to Supabase client, from Hono to Express, from Vitest to Jest).

**Currently locked**: TypeScript strict, Node.js 22, PostgreSQL + pgvector, raw pg driver, Hono, Vitest, Turborepo + pnpm, Docker Compose topology.
