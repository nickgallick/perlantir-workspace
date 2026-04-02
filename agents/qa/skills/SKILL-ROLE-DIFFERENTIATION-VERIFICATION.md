# SKILL-ROLE-DIFFERENTIATION-VERIFICATION

## Purpose

Verify that role-differentiated compilation is preserved after any code change. Define precisely what "materially different" means numerically, where the proof exists at each system layer, and what constitutes a passing vs failing verification.

**Enforces**: INV-1 (Role Differentiation) from `projects/nexus-v1/shared/NEXUS-SYSTEM-INVARIANTS.md`

## When to Use

- Any change to `scoring.ts`, `compiler.ts`, `roles.ts`, `packer.ts`, or `formatter.ts`
- Any new role template added or existing template modified
- Any scoring weight or penalty change
- Post-merge regression check on core or server packages
- Investigating "agents are getting the same context" reports

## Inputs Required

- `packages/core/tests/role-differentiation.test.ts` — 11 proof assertions (Layer 1: core)
- `packages/core/tests/scenario.test.ts` — 11 scenario tests (Layer 2: integration)
- `packages/server/tests/routes.test.ts` — role-diff assertion (Layer 3: API)
- `packages/sdk/tests/e2e.test.ts` — 2 role-diff assertions (Layer 4: SDK)
- `projects/nexus-v1/shared/ROLE-DIFFERENTIATION-PROOF.md` — proof methodology
- `projects/nexus-v1/shared/NEXUS-SYSTEM-INVARIANTS.md` — INV-1 definition

## Execution Method

### What "Materially Different" Means (Numeric Criteria)

Role differentiation is verified at 4 layers. Each layer has specific pass/fail criteria:

**Layer 1 — Score Differentiation (core):**
Given the same project with ≥ 4 decisions and ≥ 2 agents with different roles:
- `combined_score` arrays for different roles MUST NOT be identical
- At least 1 decision must have a score difference ≥ 0.05 between two roles
- If `affects` includes one agent's name but not another's, the difference for that decision MUST be ≥ 0.28 (Signal A = 0.4 × RELEVANCE_BLEND 0.7 = 0.28 minimum contribution)

**Layer 2 — Compilation Output Differentiation (integration):**
Given the same project and task description compiled for 3 roles:
- `decisions_included` may differ (roles with narrower profiles may include fewer)
- Decision ordering (by `combined_score`) MUST differ for at least 1 pair of roles
- `formatted_markdown` MUST differ between at least 2 roles (contains agent name/role + different decision order)

**Layer 3 — API Boundary (server):**
- `POST /api/compile` with different `agent_id` values returns different `decisions` arrays
- Score arrays are not identical across roles
- Agent metadata (`agent.role`) matches the requested agent

**Layer 4 — SDK Boundary (sdk):**
- `client.compileForAgent(name, task, projectId)` returns typed `ContextPackage`
- Scores differ across roles
- Formatted markdown differs across roles

### The 4-Layer Verification Protocol

Run all 4 layers in sequence. All must pass:

```bash
# Layer 1: Core scoring + compilation
cd packages/core && npx vitest run tests/role-differentiation.test.ts

# Layer 2: Full scenario integration
cd packages/core && npx vitest run tests/scenario.test.ts

# Layer 3: API boundary
cd packages/server && npx vitest run tests/routes.test.ts

# Layer 4: SDK boundary
cd packages/sdk && npx vitest run tests/e2e.test.ts
```

**Pass**: All 4 layers green. INV-1 holds.
**Fail**: Any layer red. Investigate and fix before merge.

### What Makes Differentiation Work (Root Causes)

The scoring formula produces different results per role through 3 mechanisms:

1. **Signal A (directAffect = 0.4):** A decision with `affects: ['builder']` gives builder 0.4 and launch 0.0. This is the primary differentiator.

2. **Signal B (tagMatching × 0.2):** A decision tagged `['security', 'api']` scores higher for builder (`weights: {security: 0.6, api: 0.9}`) than launch (`weights: {security: 0.1, api: 0.0}`).

3. **Signal C (roleRelevance × 0.15):** Tags matching the role's high-weight tags (≥ 0.8) add role relevance. Builder's roleTagMap includes `architecture, implementation, api, database, framework, code`; launch's includes `positioning, audience, messaging, content, brand, marketing, launch`.

If differentiation breaks, trace through these 3 signals in order.

### Test Data Requirements for Valid Proof

The proof is only valid if test data has sufficient differentiation signal:
- ≥ 4 decisions (prevents degenerate cases where all roles see the same few)
- ≥ 2 decisions with different `affects` arrays (at least one targeting role A, one targeting role B)
- ≥ 2 tag domains represented (e.g., `security/api` AND `marketing/launch`)
- ≥ 3 agent roles tested (builder + launch + reviewer covers technical/marketing/quality)

### Do NOT Do This

- **Do not weaken differentiation assertions to make tests pass.** If `expect(builderScores).not.toEqual(launchScores)` fails, the system is broken — not the test.
- **Do not test differentiation with < 4 decisions.** Small decision sets may not produce differentiation because all decisions may be relevant to all roles.
- **Do not test only at one layer.** Core scoring may work while the API boundary breaks (parseRow drops a field, route returns wrong agent).
- **Do not use identical `affects` arrays for all decisions.** This neutralizes Signal A, making differentiation depend entirely on weaker signals B and C.
- **Do not skip this verification when "only changing the formatter."** Formatter changes can alter `formatted_markdown`, which Layer 2 and Layer 4 assert on.

## Failure Modes

| Failure | Symptom | Root Cause | Fix |
|---------|---------|------------|-----|
| Identical scores across roles | `builderScores === launchScores` | All decisions have same `affects` or empty `affects` | Add role-specific `affects` to test decisions |
| Identical ordering | Same top decision for all roles | Signal A dominates and all roles match | Ensure decisions target different roles in `affects` |
| Identical markdown output | `builderMd === launchMd` | Agent name/role not included in formatter output | Check `formatAsMarkdown` includes agent metadata |
| Layer 1 passes, Layer 3 fails | Scores correct in core, wrong through API | `parseRow` drops or mangles scoring fields | Check `parseDecisionRow` and route response |
| Layer 3 passes, Layer 4 fails | API returns correct data, SDK types wrong | SDK type mismatch or response parsing error | Check SDK method return type and `NexusApiError` handling |
| All layers pass with 3 decisions, fail with 30 | Budget overflow changes inclusion | Packer truncates differently per role at scale | Verify with both small and large decision sets |

## Nexus-Specific Examples

**Minimum viable differentiation proof data:**
```typescript
// Decision 1: targets builder
{ affects: ['builder', 'reviewer'], tags: ['security', 'api', 'architecture'] }

// Decision 2: targets launch
{ affects: ['launch'], tags: ['positioning', 'audience', 'messaging', 'marketing'] }

// Decision 3: targets both (but with builder-heavy tags)
{ affects: ['builder'], tags: ['database', 'architecture', 'infrastructure'] }

// Decision 4: broad (no specific affects, mixed tags)
{ affects: [], tags: ['api', 'architecture'] }
```

Builder scores high on decisions 1, 3, 4. Launch scores high on decision 2. This is sufficient for differentiation proof.

## Exit Criteria

- All 4 verification layers pass
- Score difference ≥ 0.05 for at least 1 decision across 2 roles
- Decision ordering differs for at least 1 role pair
- Formatted markdown differs for at least 2 roles
- Test data has ≥ 4 decisions with ≥ 2 different `affects` targets and ≥ 2 tag domains
- No differentiation assertion weakened or skipped
