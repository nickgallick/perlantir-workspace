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

**Canonical source**: `projects/nexus-v1/shared/NEXUS-SYSTEM-INVARIANTS.md`

All 10 invariants (INV-1 through INV-10) are defined there with: ID, statement, enforcement mechanism, and failure signal. Do not duplicate definitions here — read the shared file.

**Severity classification** (supplementary to the shared file):
- CRITICAL (product-invalidating): INV-1 (Role Differentiation), INV-2 (Scoring Fidelity), INV-10 (Locked Decisions)
- HIGH (system-breaking): INV-3 (Error Envelope), INV-4 (Determinism), INV-5 (Status Penalty), INV-6 (Package Boundary), INV-9 (Cascade Deletion)
- MEDIUM (quality-degrading): INV-7 (Budget Respect), INV-8 (Graph Monotonicity)

**What "materially different" means for INV-1**: At least one of: (a) different `combined_score` for the same decision across roles, (b) different top-ranked decision, (c) different number of included decisions. Identical scores for a decision with zero role-differentiating signals (no `affects`, no matching tags) is NOT a violation — it means test data lacks differentiation, not the system.

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
