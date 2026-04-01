# CHECKPOINT — Nexus v1

---

## Schema and Provenance

```
schema-version      : 1.0.0
checkpoint-id       : 006
prior-checkpoint-id : 005
last-writer         : Governor
last-updated        : 2026-04-02 05:13 UTC+8
active-owner        : Governor
lock-status         : UNLOCKED
```

---

## Project and Phase

```
project             : Nexus v1
phase               : Day 5 — Critical Test + Change Propagator
approval-category   : 2
approval-phrase     : "Proceed with Day 5"
approval-timestamp  : 2026-04-02 04:58 UTC+8
approved-scope      : ChangePropagator class, subscription management, scenario test (5 scenarios, 10 decisions, 3 agents)
approval-freshness  : FRESH
lifecycle           : COMPLETED
status              : PHASE-COMPLETE
session-termination : CLEAN
recovery-mode       : NORMAL
```

---

## Deliverables

### Day 5 Output (4 new files, 2 updated)

**Change Propagator:**
- [x] `packages/core/src/change-propagator/propagator.ts` — ChangePropagator class (3 event handlers, role-context map, WS push, DB persist)
- [x] `packages/core/src/change-propagator/subscriptions.ts` — Subscription CRUD (create/upsert, list, findMatching, delete, deleteAll)

**Exports:**
- [x] `packages/core/src/change-propagator/index.ts` — Barrel exports
- [x] `packages/core/src/index.ts` — Updated public API

**Tests:**
- [x] `packages/core/tests/change-propagator.test.ts` — 13 tests (8 propagator + 5 subscription)
- [x] `packages/core/tests/scenario.test.ts` — 11 tests (5 scenarios from spec §20)

### Verification

- Build: 3/3 packages, zero TypeScript errors
- Tests: 150/150 pass (17 setup + 3 migrator + 27 decision-graph + 43 scoring + 25 compiler + 11 role-differentiation + 13 change-propagator + 11 scenario)
- No regressions in any prior test file

---

## Deviations

None. All implementation matches spec §10 exactly, adapted for pg.Pool per AMB-1.

---

## Next Phase

Day 6: Seed Data + Demo Script (spec §15, §17).
Requires explicit approval.

---

## Architecture Notes

### ChangePropagator
- Constructor: `(pool: pg.Pool, wsClients?: Map<string, WebSocket>)`
- Event handlers: `onDecisionCreated`, `onDecisionSuperseded`, `onDecisionReverted`
- Each handler builds a `ChangeEvent` and calls `propagate()`
- `propagate()`: finds agents by name → generates role notification → persists to DB → pushes via WS → (cache invalidation deferred, no context_cache table yet)
- `generateRoleNotification()`: message varies by event type, role_context varies by agent role (9-role map from spec)
- Urgency: `high` for supersede/revert, `medium` for create

### Scenario Test Topology
- 10 decisions (from spec seed data pattern)
- 4 edges: JWT→rotate(requires), splitAuth→JWT(informs), rateLimit→argon2(requires), featureFlags→deprecation(informs)
- 3 agents: builder, reviewer, launch
- 5 scenarios: A(role differentiation), B(supersession), C(notification targeting), D(graph expansion), E(baseline comparison)
