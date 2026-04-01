# CHECKPOINT — Nexus v1

---

## Schema and Provenance

```
schema-version      : 1.0.0
checkpoint-id       : 008
prior-checkpoint-id : 007
last-writer         : Governor
last-updated        : 2026-04-02 05:53 UTC+8
active-owner        : Governor
lock-status         : UNLOCKED
```

---

## Project and Phase

```
project             : Nexus v1
phase               : Day 6 — API Server (operator-scoped)
approval-category   : 2
approval-phrase     : "Proceed to Day 6" (operator scoped as API server)
approval-timestamp  : 2026-04-02 05:44 UTC+8
approved-scope      : Hono API server, all core routes, request validation, error envelope, auth middleware, E2E tests through HTTP boundary
approval-freshness  : FRESH
lifecycle           : COMPLETED
status              : PHASE-COMPLETE
session-termination : CLEAN
recovery-mode       : NORMAL
```

---

## Deliverables

### Day 6b Output — API Server (7 new files, 2 updated)

**Server App:**
- [x] `packages/server/src/app.ts` — Hono app with all routes (createApp factory)
- [x] `packages/server/src/index.ts` — Entry point with exports

**Middleware:**
- [x] `packages/server/src/middleware/errors.ts` — AppError class, onError handler, 404 handler
- [x] `packages/server/src/middleware/auth.ts` — API key auth (env-based, dev mode bypass)
- [x] `packages/server/src/middleware/validate.ts` — requireFields, requireUUID

**Config:**
- [x] `packages/server/vitest.config.ts` — Test configuration
- [x] `packages/server/package.json` — Added pg, @types/pg dependencies

**Tests:**
- [x] `packages/server/tests/routes.test.ts` — 26 tests (health, error envelope, CRUD, compile, E2E)

### Build Recovery

1. **TS2307 pg module not found** — server package missing `pg` + `@types/pg` dependencies. Detected → added to package.json → pnpm install → rebuild → clean. Resolved before tests.
2. **Hono error handler pattern** — initial `errorHandler` as middleware returned text instead of JSON for thrown errors. Hono's `app.onError()` pattern is the correct approach. Detected (5 test failures) → refactored to `registerErrorHandler(app)` using `app.onError()` → all 27 tests pass. Resolved before completion.

### Verification

- Build: 3/3 packages, zero TypeScript errors
- Tests: 186/186 pass (150 core + 9 SDK + 27 server, 12 test files)
- No regressions in any prior test file

---

## Deviations

1. **Error handler pattern**: Used Hono's `app.onError()` instead of middleware-based error catching. Hono's `use()` middleware doesn't properly intercept thrown errors for JSON responses — `onError()` is the documented pattern. Functionally equivalent, API behavior unchanged.

---

## Next Phase

Day 7: Demo polish + artifact CRUD integration.
Requires explicit approval.
