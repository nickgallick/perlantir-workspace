# PHASE-10-V1-COMPLETION-GATE.md — Nexus v1

**Created**: 2026-04-02 12:11 UTC+8
**Purpose**: Hard ship line for Nexus v1. Defines done, proves done, blocks drift.

---

## 1. Canonical V1 Definition

**What Nexus v1 is:**
A TypeScript library + REST API + SDK that compiles decision-aware, role-differentiated context for multi-agent teams — scoring decisions by relevance, freshness, and role, packing them into token budgets, expanding via graph traversal, and propagating changes to affected agents.

**What Nexus v1 is not:**
An orchestration framework, an agent runtime, a chat UI, a cloud service, a marketplace product, or a general-purpose AI platform. It is a context compiler with a data layer. Nothing more.

---

## 2. V1 Complete Criteria

### Core System

| ID | Criterion | Evidence Required | Status |
|----|-----------|-------------------|--------|
| C-1 | Decision CRUD (create, get, list, updateStatus) | Unit + integration tests | COMPLETE |
| C-2 | Edge CRUD (create, list by source/target/decision, delete) | Unit + integration tests | COMPLETE |
| C-3 | 5-signal scoring (directAffect, tagMatching, roleRelevance, semanticSimilarity, freshness) | 43 scoring tests with exact numeric expectations | COMPLETE |
| C-4 | Status penalty (superseded 0.4/0.1, reverted 0.05) | Scoring tests | COMPLETE |
| C-5 | Context compiler pipeline (fetch → score → expand → pack → format) | 25 compiler tests + 12 integration | COMPLETE |
| C-6 | Graph expansion with score decay (0.6^depth) | Compiler integration tests | COMPLETE |
| C-7 | Token budget packing (priority cascade 10/55/30/5) | 8 packer tests | COMPLETE |
| C-8 | Markdown + JSON formatters | 5 formatter tests | COMPLETE |
| C-9 | Change propagator (created/superseded/reverted → role notifications) | 13 change-propagator tests | COMPLETE |
| C-10 | Subscription management (create/upsert/list/findMatching/delete) | 5 subscription tests | COMPLETE |
| C-11 | Migration runner (idempotent, transaction-wrapped) | 3 migrator tests | COMPLETE |
| C-12 | Schema: 9 tables, 2 functions, 3 triggers | `001_initial_schema.sql` applied and tested | COMPLETE |
| C-13 | Role templates (8 roles with relevance profiles) | Setup tests + role-differentiation proof | COMPLETE |
| C-14 | Row parsers centralized (no duplicates) | `packages/core/src/db/parsers.ts` is sole location | COMPLETE |

### API

| ID | Criterion | Evidence Required | Status |
|----|-----------|-------------------|--------|
| A-1 | All CRUD routes (projects, agents, decisions, edges, artifacts) | 27 server route tests | COMPLETE |
| A-2 | Compile endpoint | Route test + SDK E2E | COMPLETE |
| A-3 | Notifications endpoint (list, mark read) | Route tests | COMPLETE |
| A-4 | Health endpoint (unauthenticated) | Route test with NEXUS_API_KEY set | COMPLETE |
| A-5 | Auth middleware (Bearer token, timing-safe) | Auth tests | COMPLETE |
| A-6 | Consistent error envelope (all error paths) | Error tests + SDK NexusApiError | COMPLETE |
| A-7 | Generic 500 responses (no raw error leak) | Dedicated sanitization test | COMPLETE |
| A-8 | Startup migration before HTTP | `startServer()` in index.ts | COMPLETE |

### SDK

| ID | Criterion | Evidence Required | Status |
|----|-----------|-------------------|--------|
| S-1 | Full server surface coverage (every route has SDK method) | 8 client unit tests | COMPLETE |
| S-2 | Typed error handling (NexusApiError) | SDK E2E tests | COMPLETE |
| S-3 | Convenience helpers (createRoleAgent, compileForAgent, recordDecisionWithEdges) | Client tests | COMPLETE |
| S-4 | Core type re-exports | SDK index.ts barrel | COMPLETE |
| S-5 | Seed demo function (seedSoftwareTeamDemo) | Client tests | COMPLETE |
| S-6 | SDK E2E through real Hono app + real DB | 27 E2E tests | COMPLETE |

### Proof / Invariants

| ID | Criterion | Evidence Required | Status |
|----|-----------|-------------------|--------|
| P-1 | Role differentiation proven (3 agents, same project, different output) | 11 regression assertions + proof doc | COMPLETE |
| P-2 | Scoring formula matches spec exactly | 43 tests with 3-decimal precision | COMPLETE |
| P-3 | Compilation determinism (fixed now → identical output) | Compiler determinism tests | COMPLETE |
| P-4 | Budget respect | Packer budget tests | COMPLETE |
| P-5 | Graph expansion monotonicity | Compiler expansion tests | COMPLETE |
| P-6 | 10 system invariants documented | `NEXUS-SYSTEM-INVARIANTS.md` | COMPLETE |
| P-7 | THE scenario test (5 scenarios, 10 decisions, 3 agents) | 11 scenario tests | COMPLETE |

### Demo

| ID | Criterion | Evidence Required | Status |
|----|-----------|-------------------|--------|
| D-1 | Comparison demo script (baseline vs Nexus vs change propagation vs SDK) | `examples/software-team/comparison.ts` | COMPLETE |
| D-2 | Seed data for software team demo (6 agents, 10 decisions, 4 edges) | `seedSoftwareTeamDemo()` | COMPLETE |

### Docs

| ID | Criterion | Evidence Required | Status |
|----|-----------|-------------------|--------|
| X-1 | README with setup, usage, and API overview | `nexus/README.md` | MISSING |
| X-2 | .env.example with required variables | `nexus/.env.example` | COMPLETE |
| X-3 | API reference (routes, request/response shapes) | Standalone doc or README section | MISSING |
| X-4 | SDK quickstart | Standalone doc or README section | MISSING |

### Self-Host / Operations

| ID | Criterion | Evidence Required | Status |
|----|-----------|-------------------|--------|
| O-1 | docker-compose.yml (app + postgres) | `nexus/docker-compose.yml` | MISSING |
| O-2 | Dockerfile for server | `nexus/Dockerfile` | MISSING |
| O-3 | Database setup documented (migrations, extensions) | README or dedicated doc | MISSING |
| O-4 | NEXUS_API_KEY auth documented | README or dedicated doc | MISSING |

---

## 3. Ship Blockers

These must be complete before v1 is done. No exceptions.

| # | Blocker | Deliverable | Maps To |
|---|---------|-------------|---------|
| B-1 | No README | `nexus/README.md` — setup, architecture, API summary, SDK quickstart, self-host instructions | X-1, X-3, X-4, O-3, O-4 |
| B-2 | No docker-compose.yml | `nexus/docker-compose.yml` — app + postgres + pgvector, volume mounts, env vars, health check | O-1 |
| B-3 | No Dockerfile | `nexus/Dockerfile` — multi-stage build, production-ready | O-2 |
| B-4 | Stub files not cleaned | Remove empty stub files: `distillery/index.ts`, `temporal/index.ts`, `nexus.ts` | Code hygiene |
| B-5 | Placeholder tests not cleaned | Remove `server/tests/placeholder.test.ts`, `sdk/tests/placeholder.test.ts` | Test hygiene |
| B-6 | STATUS.md security backlog stale | SB-1 through SB-4 show "Tracked — not yet implemented" but are resolved. Must update. | Tracking accuracy |

---

## 4. Explicitly Deferred / Not in V1

| Item | Why Deferred | Target Phase |
|------|-------------|--------------|
| **Hermes integration** | Hermes is a separate communication agent. Nexus is a context compiler. Integration requires Hermes to exist first and a defined protocol between them. | Post-v1: Platform Integration Phase |
| **ruflo integration** | ruflo is a separate workflow/orchestration system. Nexus provides context, ruflo consumes it. Coupling now would compromise both products' independent viability. | Post-v1: Platform Integration Phase |
| **"Go build X" orchestration** | Nexus compiles context for agents; it does not dispatch, coordinate, or supervise agent execution. Orchestration is a separate system concern. | Post-v1: Platform Layer |
| **Cloud / marketplace / hosted service** | V1 is a self-hosted library + API. Cloud deployment, multi-tenancy, billing, and marketplace listing are product-market concerns, not v1 completeness. | Post-v1: Commercialization Phase |
| **UI / dashboard** | Nexus v1 is API-first. A dashboard for browsing decisions, viewing context packages, or managing agents is a consumer application, not core infrastructure. | Post-v1: Tooling Phase |
| **Per-project API keys / key rotation / rate limiting** | Current single-key auth is sufficient for v1 self-hosted use. Multi-tenant key management is a cloud/production concern. | Post-v1: Production Hardening |
| **WebSocket real-time push** | Change propagator stores notifications in DB. Real-time push requires WS infrastructure, client reconnection, message ordering. Not needed for v1 correctness. | Post-v1: Real-time Phase |
| **Conversation distillery** | Spec §12 feature for summarizing agent sessions into decisions. Requires an LLM integration layer that doesn't exist yet. Not needed for core context compilation. | Post-v1: Intelligence Layer |
| **PB-1 implementation (performance test file)** | Staged enforcement model designed (Phase 9, H-6). Actual test file and baselines are validation work, not core functionality. | Post-v1: CI/CD Phase |
| **Phase 1B capability files (9 remaining)** | Original planning artifacts. Implementation is complete — leftover planning files add no value to the shipped product. | Cancelled (unnecessary) |
| **Input validation (field length, array bounds, enum checking)** | Identified in security audit. Important for production hardening but not blocking v1 self-hosted correctness. | Post-v1: Production Hardening |

---

## 5. Tracked Follow-Ups Classification

### MUST CLOSE BEFORE V1 COMPLETE

| Item | Reason |
|------|--------|
| B-1: README | Cannot ship a library with no documentation |
| B-2: docker-compose.yml | Cannot claim self-hostable without a compose file |
| B-3: Dockerfile | Cannot run docker-compose without a Dockerfile |
| B-4: Remove stub files | Dead code in a shipped product is a defect |
| B-5: Remove placeholder tests | Meaningless tests inflate pass counts |
| B-6: Update stale STATUS.md backlog | Tracking files must reflect reality |

### MAY SHIP AS POST-V1 BACKLOG

| Item | Reason |
|------|--------|
| PB-1: Performance test implementation | Design exists, implementation is CI/CD work |
| Input validation (lengths, bounds, enums) | Correctness not affected; production hardening |
| AMB-2: Session summary routes | Sessions opt-in, post-launch feature |
| AMB-5: WebSocket handler | Notifications stored in DB; push is enhancement |

### FUTURE PLATFORM / INTEGRATION WORK

| Item | Reason |
|------|--------|
| Hermes integration | Separate product, undefined protocol |
| ruflo integration | Separate product, undefined protocol |
| Orchestration layer | Separate system concern |
| Cloud / marketplace | Commercialization, not v1 |
| UI / dashboard | Consumer application |
| Per-project API keys | Multi-tenancy |
| Conversation distillery | LLM integration layer |

---

## 6. Completion Audit

### Core System: 14/14 COMPLETE

All 14 criteria verified against existing test suite (216 tests across 13 files), source code (47 source files, 3,694 LOC), and build output (3/3 packages, zero errors).

### API: 8/8 COMPLETE

All routes implemented in `packages/server/src/app.ts`. Auth hardened (Phase 9 H-1). Error sanitization (Phase 9 H-2). Health exemption (Phase 9 H-4). Startup migration (Phase 9 H-3). Verified by 30 server tests.

### SDK: 6/6 COMPLETE

Full surface coverage. Typed errors. Convenience helpers. E2E tests through real app + real DB. 36 SDK tests pass.

### Proof / Invariants: 7/7 COMPLETE

Role-differentiation proven with 11 regression assertions + permanent proof document. 10 system invariants documented with enforcement references. THE scenario test covers 5 scenarios. All verified by test suite.

### Demo: 2/2 COMPLETE

Comparison demo script exists with 4 sections. Seed data function creates 6 agents, 10 decisions, 4 edges.

### Docs: 1/4 COMPLETE

- .env.example: ✅ COMPLETE
- README: ❌ MISSING — no README.md exists
- API reference: ❌ MISSING — no standalone doc
- SDK quickstart: ❌ MISSING — no standalone doc

**Resolution**: A single comprehensive README.md satisfies X-1, X-3, X-4, O-3, and O-4. One file closes 5 criteria.

### Self-Host / Operations: 0/4 COMPLETE

- docker-compose.yml: ❌ MISSING
- Dockerfile: ❌ MISSING
- DB setup docs: ❌ MISSING (covered by README)
- Auth docs: ❌ MISSING (covered by README)

**Resolution**: Dockerfile + docker-compose.yml + README closes all 4.

---

## 7. Ship Recommendation

**NOT YET V1 COMPLETE**

### Shortest Remaining Sequence (ordered, minimal)

```
Step 1: Clean stubs + placeholders
  - Delete packages/core/src/distillery/index.ts
  - Delete packages/core/src/temporal/index.ts
  - Delete packages/core/src/nexus.ts
  - Delete packages/server/tests/placeholder.test.ts
  - Delete packages/sdk/tests/placeholder.test.ts
  - Remove barrel exports for deleted modules
  - Update STATUS.md: mark SB-1 through SB-4 as RESOLVED
  - Verify: build + tests still pass (count will drop by 2 placeholders)

Step 2: Dockerfile
  - Multi-stage (build + runtime)
  - Node.js 22 base
  - pnpm install, turbo build, copy dist
  - Expose PORT, CMD node packages/server/dist/index.js
  - HEALTHCHECK against /api/health

Step 3: docker-compose.yml
  - 2 services: app + postgres (pgvector/pgvector:pg17)
  - Volume for postgres data
  - Environment: DATABASE_URL, NEXUS_API_KEY, PORT
  - Health checks for both services
  - depends_on with health condition

Step 4: README.md
  - What Nexus is (1 paragraph)
  - Quick start (docker compose up)
  - Architecture (3-package diagram)
  - API reference (routes table with request/response shapes)
  - SDK quickstart (install, create client, compile context)
  - Configuration (env vars table)
  - Development setup (local postgres, pnpm, turbo)
  - Running tests

Step 5: Final verification
  - docker compose up — server starts, migrations run, health returns 200
  - demo script runs successfully against containerized server
  - All tests pass with final file count
```

5 steps. No new features. No scope expansion. Pure packaging.

---

## 8. Anti-Drift Rules

**Tempting to add now — do not:**

| Temptation | Why It Weakens V1 |
|------------|-------------------|
| Add a CLI tool for managing decisions | New product surface, not core compiler |
| Build a web UI for the demo | Consumer app, not infrastructure |
| Add OpenTelemetry / structured logging | Observability is post-v1 ops work |
| Implement the conversation distillery | Requires LLM integration layer that doesn't exist |
| Add WebSocket real-time push | Enhancement, not v1 correctness |
| Write integration tests against Docker | CI infrastructure, not product completeness |
| Add input validation (field lengths, enums) | Production hardening, not v1 gate |
| Performance test implementation | CI/CD work, design is sufficient |
| Support multiple embedding providers | Feature expansion |
| Add a migration CLI | Nice-to-have, `startServer()` handles it |

**The rule**: If it requires writing new business logic, designing new APIs, or adding new dependencies beyond Docker/compose, it is not v1 work.
