# PHASE-9-HARDENING-PLAN.md — Nexus v1

**Phase**: 9 — Hardening
**Objective**: Close correctness, security, startup, health-check, contract-integrity, and performance-enforcement gaps between "built" and "safe to call complete."
**Created**: 2026-04-02 11:39 UTC+8
**Approval**: "Proceed to Phase 9: Hardening" — 2026-04-02 11:39 UTC+8

---

## Work Items

### H-1: Timing-Safe Auth Key Comparison (SB-1)

**Type**: Implementation
**Backlog ref**: SB-1
**File**: `packages/server/src/middleware/auth.ts` line 36
**Problem**: `token !== apiKey` uses short-circuit string comparison — timing side-channel.
**Fix**: Replace with `crypto.timingSafeEqual(Buffer.from(token), Buffer.from(apiKey))`. Handle length mismatch (different-length strings must not reach `timingSafeEqual`; compare lengths first, but still call `timingSafeEqual` with padded/fixed buffer to avoid length-based timing leak).
**Test**: Unit test confirming middleware accepts valid key, rejects invalid key, rejects missing header. Existing route tests already exercise the happy path.
**Lines changed**: ~8
**Risk**: Low. Pure middleware change, no downstream effects.
**Exit criteria**: `timingSafeEqual` used for all key comparisons. No `===` or `!==` on secrets anywhere in codebase.

---

### H-2: Generic HTTP 500 Response Body (SB-2)

**Type**: Implementation
**Backlog ref**: SB-2
**File**: `packages/server/src/middleware/errors.ts` — `registerErrorHandler` unhandled error path
**Problem**: Raw `err.message` returned in HTTP 500 response. Leaks database URLs, file paths, query fragments.
**Fix**: Replace the dynamic message with static `'Internal server error'`. The `console.error` already logs the full error to stderr — that stays.
**Before**:
```typescript
const message = err instanceof Error ? err.message : 'Internal server error';
```
**After**:
```typescript
// Raw detail preserved in console.error above; never returned to client
const message = 'Internal server error';
```
**Test**: Add test that triggers unhandled error and asserts response body contains only `'Internal server error'`, not the raw error message.
**Lines changed**: ~1 production, ~10 test
**Risk**: Low. Intentional information loss in responses; no behavior change for AppError paths.
**Exit criteria**: No unhandled error path returns raw error messages. Verified by test.

---

### H-3: Startup Migration Before HTTP (SB-3)

**Type**: Implementation
**Backlog ref**: SB-3
**File**: `packages/server/src/index.ts`
**Problem**: Server entry point has no startup logic. A fresh deployment serves requests against an un-migrated database.
**Fix**: Add `startServer()` function:
1. Create pool from `DATABASE_URL`
2. Call `migrate(pool, migrationsDir)` — exit process on failure
3. Call `createApp({ pool })`
4. Start HTTP listener via `@hono/node-server` (or `Bun.serve`)
5. Log startup confirmation with port and migration status

The existing `createApp` factory remains pure (no side effects) for test use. `startServer()` is the production entry point.
**Dependencies**: `@hono/node-server` must be added to server package.json (or use Bun-native serve).
**Lines changed**: ~25 production
**Risk**: Medium. Introduces a runtime dependency and startup sequence. Must not break test imports (tests use `createApp` directly, not `startServer`).
**Exit criteria**: `startServer()` exists, calls `migrate()` before listening, exits on migration failure. Test imports unaffected.

---

### H-4: Health Endpoint Auth Exemption (SB-4)

**Type**: Implementation
**Backlog ref**: SB-4
**File**: `packages/server/src/middleware/auth.ts`, `packages/server/src/app.ts`
**Problem**: `/api/health` sits behind auth middleware. Container health checks (Docker HEALTHCHECK, k8s liveness) cannot provide Bearer tokens.
**Fix**: Add path exemption in auth middleware:
```typescript
// Health endpoint must be accessible without auth for container health checks
const exemptPaths = ['/api/health'];
if (exemptPaths.includes(c.req.path)) {
  await next();
  return;
}
```
**Test**: Set `NEXUS_API_KEY`, call `/api/health` without Authorization header, assert 200.
**Lines changed**: ~5 production, ~8 test
**Risk**: Low. Health endpoint returns only DB connection status (boolean), no sensitive data.
**Exit criteria**: `/api/health` returns 200 without auth when `NEXUS_API_KEY` is set. Verified by test.

---

### H-5: Row Parser Centralization (Contract Integrity)

**Type**: Implementation
**Problem**: `parseDecisionRow` exists in 2 locations (`graph.ts:176`, `compiler.ts:421`) with identical implementations. `parseAgentRow` exists in 2 locations (`propagator.ts:202`, `app.ts:390`) with divergent implementations (core returns typed `Agent`, server returns `Record<string, unknown>` via different logic). `parseArtifactRow` in `compiler.ts:444`, `parseEdgeRow` in `queries.ts:108`, `parseSubscriptionRow` in `subscriptions.ts:95` are single-location (no drift risk).

**Drift risk assessment**:
- `parseDecisionRow` × 2: **High** — identical now, but any field addition to `Decision` type requires changes in two files. One will be missed.
- `parseAgentRow` × 2: **Already diverged** — core version parses `relevance_profile` and returns typed `Agent`; server version uses generic `parseRow` base and returns untyped `Record`. If `Agent` type gains a JSON field, server won't parse it.

**Fix**:
1. Create `packages/core/src/db/parsers.ts` — canonical home for all row parsers
2. Export: `parseDecisionRow`, `parseAgentRow`, `parseEdgeRow`, `parseArtifactRow`, `parseSubscriptionRow`, `parseNotificationRow`
3. Remove duplicates from `graph.ts`, `compiler.ts`, `propagator.ts`
4. Server imports from `@nexus-ai/core` (already a dependency) instead of maintaining its own parsers. Server's `parseRow` generic helper is deleted.
5. Barrel-export from `packages/core/src/db/index.ts`

**Test**: Existing tests cover all parse paths. No new tests needed — regressions caught by 213 existing tests.
**Lines changed**: ~60 new (parsers.ts), ~80 deleted (duplicates), net −20
**Risk**: Medium. Cross-module refactor touching 4 files. Must verify all imports resolve. `§Refactor Pre-Protocol` (Step 0) applies: dead code sweep, formatting pass, separate checkpoint before main change.
**Exit criteria**: Zero duplicate row parsers. `grep -rn "function parse.*Row" packages/` shows only `packages/core/src/db/parsers.ts`. All 213 tests pass.

---

### H-6: Performance Enforcement — Staged Model (PB-1)

**Type**: Tracking + Design (implementation deferred)
**Backlog ref**: PB-1
**Problem**: No automated performance regression detection. Thresholds defined in skills/docs but not enforced.

**Staged enforcement design**:

#### Phase A: Warn Threshold (Non-Blocking)

- Performance test file: `packages/core/tests/performance.test.ts`
- Datasets: 4 sizes (10, 50, 200, 1000 decisions with proportional edges/artifacts/agents)
- Dataset generation: deterministic seed function (no DB required — pure scoring/packing path)
- Measurements: total `compile()` wall time, per-subsystem breakdown via `performance.now()`
- Thresholds (conservative 2× expected):
  | Size | Warn | Fail (Phase B) |
  |------|------|-----------------|
  | 10   | 100ms | 50ms |
  | 50   | 300ms | 150ms |
  | 200  | 1000ms | 500ms |
  | 1000 | 4000ms | 2000ms |
- Assertion: `console.warn` if exceeded, test still passes
- Scaling check: `time(200) / time(50) < 6` (sub-quadratic)
- Output: timing results logged, baseline captured in `projects/nexus-v1/PERFORMANCE-BASELINE.md`

#### Phase B: CI Fail (Blocking) — Triggers After:
1. ≥ 3 consecutive Phase A runs with stable baselines
2. Explicit operator approval to promote
3. Thresholds tightened to "Fail" column

**What this phase delivers**: The complete Phase A + B design document above, committed to this plan. Actual test file creation is a separate implementation task (can be Phase 9 scope or deferred — operator decides).

**Risk**: Low for design. Implementation risk is hardware-dependent timing variability (mitigated by 2× conservative thresholds).
**Exit criteria**: Staged enforcement model documented with explicit thresholds, promotion criteria, and Phase A vs B distinction. If operator approves implementation: test file exists, Phase A assertions active, baseline document created.

---

## Execution Order

```
H-1  Timing-safe auth         [security, no deps]          ~15 min
H-2  Generic 500 body         [security, no deps]          ~10 min
H-4  Health auth exemption    [startup, no deps]           ~15 min
H-3  Startup migration        [startup, deps: H-4]         ~20 min
H-5  Row parser centralize    [contract, Step 0 first]     ~30 min
H-6  Perf enforcement design  [tracking, no deps]          ~10 min (design only)
```

**Rationale**:
- H-1 and H-2 are independent security fixes, smallest blast radius — go first.
- H-4 before H-3: health exemption must be in place before startup wiring, because startup health checks would fail otherwise.
- H-5 is the largest refactor — Step 0 applies. Goes after security/startup are stable.
- H-6 is design/tracking — can happen any time, placed last to not block implementation items.

**Total estimated**: ~1.5 hours implementation + verification

---

## Risks

| Risk | Mitigation |
|------|------------|
| H-3 introduces runtime dep (`@hono/node-server`) | Verify it's already in use or pick Bun-native. Test imports isolated from startup. |
| H-5 refactor breaks imports | Step 0 cleanup first. Run full test suite after each file change, not just at end. |
| H-6 perf thresholds too tight/loose | 2× conservative in Phase A. Phase B requires 3 stable runs before promotion. |
| timingSafeEqual buffer length mismatch | Fixed-length comparison with early-return on missing token (already handled by scheme check). |

---

## Exit Criteria — Phase 9 Complete When:

1. ✅ `crypto.timingSafeEqual` used for all secret comparisons — no `===`/`!==` on keys
2. ✅ HTTP 500 responses return only `'Internal server error'` — verified by test
3. ✅ `startServer()` calls `migrate()` before accepting requests — exits on failure
4. ✅ `/api/health` accessible without auth — verified by test with `NEXUS_API_KEY` set
5. ✅ Zero duplicate row parsers — single canonical location in `packages/core/src/db/parsers.ts`
6. ✅ PB-1 staged enforcement model documented with thresholds, promotion criteria, Phase A/B distinction
7. ✅ All existing tests pass (213+), no regressions
8. ✅ New tests added for H-1, H-2, H-4 security/startup behaviors
