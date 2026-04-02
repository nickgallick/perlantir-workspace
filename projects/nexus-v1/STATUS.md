# STATUS — Nexus v1

**Current Phase**: Phase 8 — Skill Layer Construction — IN PROGRESS
**Batch**: 2/8 (Architect) COMPLETE, Batch 3 (QA) next
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
