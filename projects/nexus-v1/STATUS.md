# STATUS — Nexus v1

**Current Phase**: Phase 8 — Skill Layer Construction — IN PROGRESS
**Batch**: 5/8 (DevOps) COMPLETE, Batch 6 (Docs) next
**Blockers**: None
**Last Updated**: 2026-04-02 06:10 UTC+8

## Build Health

- **Build**: 3/3 packages, zero errors
- **Tests**: 213/213 pass (13 test files: 8 core + 3 SDK + 2 server)
- **Regressions**: None

## Completed Days

| Day | Scope | Tests | Status |
|-----|-------|-------|--------|
| 1 | Setup + scaffold | 17 | ✅ LOCKED |
| 2 | Decision Graph | 30 | ✅ LOCKED |
| 3 | Scoring Layer | 43 | ✅ LOCKED |
| 4 | Assembly (packer, formatter, compiler, graph expansion) | 25 | ✅ LOCKED |
| 4+ | Proof Lock (role-differentiation regression) | 11 | ✅ LOCKED |
| 5 | Critical Test + Change Propagator | 24 | ✅ LOCKED |
| 6a | SDK Client + Seed Method + Demo Script | 9 | ✅ LOCKED |
| 6b | API Server (Hono) + E2E Tests | 27 | ✅ LOCKED |
| 7 | SDK Ergonomics + E2E + Demo Polish | 27 | ✅ COMPLETE |

## Day 7 Summary — SDK Ergonomics + Demo + Developer Path

### SDK Enhancements
- **Error handling**: `NexusApiError` class preserving server error envelope (status, code, serverMessage, details)
- **Missing methods added**: `updateDecisionStatus`, `createEdge`, `listEdges`, `deleteEdge`, `listArtifacts`, `health()`
- **Type improvements**: `ConnectedDecision` return type for graph, `HealthResponse` type, `NexusErrorEnvelope` type
- **Full server surface coverage**: Every server route now has a corresponding SDK method

### SDK E2E Tests (27 new)
- Health, error handling (3 tests), project CRUD, agent CRUD, decision CRUD (5), edge CRUD (4), artifact CRUD (2), graph (1), compile (3), role differentiation proof (2), notifications (2), full lifecycle (1)
- All tests route through actual Hono app via fetch interception — real DB, real compilation

### Demo Script Polish
- 4-section demo: baseline vs Nexus vs change propagation vs SDK ergonomics
- Health check on startup with typed error handling
- Artifact registration in demo flow
- Edge/graph/error handling showcase sections

### What is fully implemented vs deferred

**Fully implemented:**
- SDK covers 100% of server routes with typed methods
- Typed error handling (NexusApiError preserves server envelope)
- Convenience helpers (createRoleAgent, compileForAgent, recordDecisionWithEdges, seedSoftwareTeamDemo)
- Core type re-exports (consumers don't need @nexus-ai/core directly)
- Role template utilities re-exported
- End-to-end demo script using only SDK
- E2E tests proving SDK boundary works with real DB

**Deferred:**
- Per-project API keys, key rotation, rate limiting, scoped permissions
- WebSocket real-time push endpoint
- Demo requires running server (no in-process mode yet)

---

## Security Backlog

### SB-1: Auth Key Timing-Safe Comparison

**Status**: Tracked — not yet implemented
**Priority**: Must fix before production
**Added**: 2026-04-02 10:17 UTC+8
**File**: `packages/server/src/middleware/auth.ts` line ~36
**Issue**: `token !== apiKey` uses short-circuit string comparison — timing attack surface.
**Fix**: Replace with `crypto.timingSafeEqual(Buffer.from(token), Buffer.from(apiKey))`. ~3 lines changed.
**Reference**: `agents/security/skills/SKILL-AUTH-MIDDLEWARE-REVIEW.md` — Vulnerability 1

### SB-2: Generic 500 Error Messages

**Status**: Tracked — not yet implemented
**Priority**: Must fix before production
**Added**: 2026-04-02 10:17 UTC+8
**File**: `packages/server/src/middleware/errors.ts` — `registerErrorHandler` unhandled error path
**Issue**: Raw `err.message` returned in HTTP 500 responses. Can leak database URLs, file paths, query fragments.
**Fix**: Replace `const message = err instanceof Error ? err.message : 'Internal server error'` with `const message = 'Internal server error'`. Keep `console.error` for stderr logging. ~1 line changed.
**Reference**: `agents/security/skills/SKILL-SENSITIVE-DATA-EXPOSURE-REVIEW.md` — Surface 1

---

## Performance Backlog

### PB-1: Compilation Performance Baseline + Regression Guard

**Status**: Tracked — not yet implemented
**Priority**: Next after Phase 8 skill writing completes
**Added**: 2026-04-02 09:52 UTC+8

**Scope**:
1. Generate test datasets at 4 sizes: 10, 50, 200, 1000 decisions (with edges, artifacts, agents)
2. Measure `compile()` latency broken down by subsystem:
   - Scoring throughput (pure computation, per-decision)
   - Graph traversal cost (recursive SQL, per qualifying decision × depth)
   - Packing time (sort + greedy scan)
   - Total `compilation_time_ms` end-to-end
3. Capture baseline timings on current hardware (8-core x86_64, 31 GiB RAM, PG17 local)
4. Define acceptable thresholds per size:
   - 10 decisions: < 50ms
   - 50 decisions: < 150ms
   - 200 decisions: < 500ms
   - 1000 decisions: < 2000ms
5. Add automated performance test with threshold assertions (non-blocking CI initially)
6. Verify sub-quadratic scaling: 2× decisions should take < 3× time

**References**:
- Skill: `agents/qa/skills/SKILL-COMPILATION-PERFORMANCE-VALIDATION.md`
- Invariants: `projects/nexus-v1/shared/NEXUS-SYSTEM-INVARIANTS.md` (INV-4 Determinism, INV-7 Budget Respect)
- Pipeline: `packages/core/src/context-compiler/compiler.ts`

**Deliverables**:
- Performance test file (`packages/core/tests/performance.test.ts`)
- Baseline measurements document
- Threshold assertions (conservative: 2× expected, to avoid flaky CI)
- Scaling linearity assertion
