# SKILL-SYSTEM-INVARIANT-ENFORCEMENT

## Purpose

Identify, document, and enforce system invariants that must hold across all changes to Nexus. Invariants are properties that are always true regardless of what features are added. Violating any invariant invalidates the product.

## When to Use

- Reviewing any refactor or feature that touches scoring, compilation, or API contracts
- Pre-merge architectural review
- Investigating a test failure to determine if it's an invariant violation or expected behavior change
- Adding a new invariant (new proof, new contract, new constraint)
- Resolving disagreements about "is this a bug or intended behavior?"

## Inputs Required

- `packages/core/tests/role-differentiation.test.ts` — 11 proof assertions
- `packages/core/tests/scoring.test.ts` — 43 numeric validation tests
- `packages/core/tests/scenario.test.ts` — 11 scenario tests
- `packages/server/src/middleware/errors.ts` — error envelope contract
- `packages/core/src/context-compiler/compiler.ts` — determinism requirement
- `packages/core/src/context-compiler/scoring.ts` — scoring formula
- `agents/architect/capabilities/NEXUS-LOCKED-DECISIONS.md` — locked decisions as hard constraints
- All `package.json` files — dependency boundary definitions

## Execution Method

### Invariant Registry

Each invariant has: ID, statement, enforcement mechanism, test location, violation severity.

---

**INV-1: Role Differentiation**
- **Statement**: Given the same project state and task description, different agent roles MUST produce materially different `ContextPackage` outputs (different scores, different decision ordering, or different included decisions).
- **Enforcement**: `role-differentiation.test.ts` (11 assertions), `e2e.test.ts` (2 assertions), `routes.test.ts` (1 assertion)
- **Violation severity**: CRITICAL — this is the product's core value proposition
- **What "materially different" means**: At least one of: (a) different `combined_score` for the same decision across roles, (b) different top-ranked decision, (c) different number of included decisions
- **What is NOT a violation**: Identical scores for a decision that has zero role-differentiating signals (no `affects`, no matching tags). This means the test data lacks differentiation, not the system.

**INV-2: Scoring Formula Fidelity**
- **Statement**: The scoring formula MUST match `NEXUS-ALGORITHM-REFERENCE.md` exactly. No signal weight changes, no penalty changes, no formula restructuring without explicit operator approval.
- **Enforcement**: `scoring.test.ts` (43 tests with exact numeric expectations to 3 decimal places)
- **Violation severity**: CRITICAL — scoring drives everything downstream
- **Locked constants**: `WEIGHT_DIRECT_AFFECT=0.4`, `WEIGHT_TAG_MATCHING=0.2`, `WEIGHT_ROLE_RELEVANCE=0.15`, `WEIGHT_SEMANTIC=0.25`, `RELEVANCE_BLEND=0.7`, `FRESHNESS_BLEND=0.3`, `ROLE_TAG_MAP_THRESHOLD=0.8`

**INV-3: Error Envelope Consistency**
- **Statement**: Every HTTP error response from the server MUST have the shape `{ error: { code: string, message: string, details?: unknown } }`. No exceptions.
- **Enforcement**: `routes.test.ts` (error envelope tests), `e2e.test.ts` (NexusApiError parsing)
- **Violation severity**: HIGH — SDK error handling depends on this shape
- **Covers**: 400, 404, 500 responses. Also covers `app.onError()` fallback for unhandled exceptions.

**INV-4: Compilation Determinism**
- **Statement**: Given identical inputs (`agent_id`, `task_description`, `max_tokens`, database state) and a fixed `now` timestamp, `compile()` MUST produce identical `ContextPackage` output every time.
- **Enforcement**: `compiler.test.ts` (determinism tests use fixed `now`)
- **Violation severity**: HIGH — non-determinism makes debugging impossible
- **Known exception**: If embeddings are generated via OpenAI at compile time (not pre-stored), the embedding may vary slightly. In practice, embeddings are stored at decision creation time.

**INV-5: Status Penalty Application**
- **Statement**: Superseded decisions MUST be scored with penalty factor 0.4 (if profile includes superseded) or 0.1 (if excluded). Reverted decisions MUST be scored with penalty 0.05. Active decisions MUST receive no penalty (factor 1.0).
- **Enforcement**: `scoring.test.ts` (penalty-specific tests)
- **Violation severity**: HIGH — wrong penalties cause stale decisions to dominate context

**INV-6: Package Boundary Integrity**
- **Statement**: `@nexus-ai/core` MUST NOT import from `hono`, `@nexus-ai/server`, or `@nexus-ai/sdk`. `@nexus-ai/sdk` MUST NOT import `pg` at runtime (only in devDependencies for tests). `@nexus-ai/server` MUST NOT contain business logic that belongs in core.
- **Enforcement**: `package.json` dependency declarations, TypeScript build (import errors)
- **Violation severity**: HIGH — boundary violations create circular dependencies and split concerns
- **See**: SKILL-PACKAGE-BOUNDARY-ENFORCEMENT for detailed rules

**INV-7: Budget Respect**
- **Statement**: `packIntoBudget()` MUST NOT produce a `PackResult` where `totalTokens > maxTokens` (except by the margin of a single item's tokens, since items are packed greedily).
- **Enforcement**: `compiler.test.ts` (packer tests)
- **Violation severity**: MEDIUM — budget overflow wastes context window

**INV-8: Graph Expansion Monotonicity**
- **Statement**: `expandGraphContext()` MUST NOT remove or downgrade existing scored decisions. It may only add new decisions or replace lower-scored entries with higher ones.
- **Enforcement**: `compiler.test.ts` (graph expansion tests)
- **Violation severity**: MEDIUM — violating this causes scored decisions to "disappear"

**INV-9: Cascade Deletion**
- **Statement**: Deleting a project MUST cascade-delete all agents, decisions, edges, artifacts, and notifications belonging to that project. No orphaned rows.
- **Enforcement**: SQL FK constraints (`ON DELETE CASCADE`), route test cleanup
- **Violation severity**: HIGH — orphaned data corrupts future queries

**INV-10: Locked Decisions**
- **Statement**: Decisions listed as LOCKED in `NEXUS-LOCKED-DECISIONS.md` cannot be changed by any agent without explicit operator override. Includes: TypeScript strict, Node.js 22, PostgreSQL + pgvector, raw pg driver (no Supabase), Hono, Vitest, Turborepo + pnpm.
- **Enforcement**: LOCKED-DECISIONS.md review during architectural decisions
- **Violation severity**: CRITICAL — locked decisions define the system identity

---

### Invariant Verification Protocol

When reviewing any change:

1. **Identify which invariants the change could affect.** Use this mapping:
   - Touches `scoring.ts` → check INV-1, INV-2, INV-5
   - Touches `compiler.ts` → check INV-1, INV-4, INV-7, INV-8
   - Touches `app.ts` routes → check INV-3
   - Touches `packer.ts` → check INV-7
   - Touches `package.json` → check INV-6
   - Touches migrations → check INV-9
   - Proposes stack change → check INV-10

2. **Run the specific test files** that enforce those invariants.

3. **If a test fails**, determine: Is this an invariant violation (bug) or an intentional invariant change (requires operator approval)?

4. **Invariant changes require explicit operator approval** and must update: the test, the invariant documentation, and this registry.

### Do NOT Do This

- **Do not weaken a test to make it pass.** If `scoring.test.ts` expects `0.607` and you get `0.605`, the implementation is wrong, not the test.
- **Do not add "skip" to invariant tests.** They are proof artifacts, not convenience tests.
- **Do not reason about invariants from first principles** when the test suite already encodes them. Run the tests.
- **Do not merge code that violates an invariant** with a comment "will fix later." Invariant violations are blocking.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| Role differentiation broken | Signal weight change made scores identical | `role-differentiation.test.ts` fails | Revert weight change; verify with worked examples |
| Error envelope inconsistent | New route throws plain Error | `routes.test.ts` error tests fail | Use `AppError` class |
| Determinism broken | `new Date()` used instead of `options.now` | Flaky compiler tests | Pass `now` parameter |
| Package boundary violated | SDK imports pg at runtime | TypeScript build may succeed but runtime fails in pg-less environment | Move import to devDependencies test code only |
| Locked decision violated | Agent proposes alternative to locked stack choice | Architectural review catches it | Reject proposal; reference LOCKED-DECISIONS.md |

## Exit Criteria

- All 10 invariants hold after the change
- Relevant test files pass (not just "all tests pass" — specifically the invariant tests)
- No invariant test weakened or skipped
- If an invariant is intentionally changed: operator approval documented, test updated, registry updated
