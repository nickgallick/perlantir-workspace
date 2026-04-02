# Phase 8 — Skill Layer Construction Plan

**Objective**: Transform agents into elite Nexus operators using system-specific execution skills derived from real implementation (Days 1–7), constraints, proof artifacts, and failure modes.

**Status**: IN PROGRESS — Batches 1-5 (Backend, Architect, QA, Security, DevOps) complete, Batch 6 (Docs) next.

---

## 1. Skill Directory Structure

```
agents/<agent>/skills/
  SKILL-<NAME>.md
```

Each skill is a standalone Markdown file in the agent's `skills/` directory. No subdirectories, no shared files between agents. Skills reference capability files and source code by path but don't duplicate them.

```
agents/backend/skills/
  SKILL-DECISION-CRUD.md
  SKILL-SCORING-IMPLEMENTATION.md
  SKILL-MIGRATION-AUTHORING.md
  SKILL-CONTEXT-COMPILER-PIPELINE.md
  SKILL-CHANGE-PROPAGATOR.md

agents/architect/skills/
  SKILL-SCHEMA-EVOLUTION.md
  SKILL-API-CONTRACT-DESIGN.md
  SKILL-GRAPH-MODEL-EXTENSION.md
  SKILL-SCORING-FORMULA-TUNING.md
  SKILL-PACKAGE-BOUNDARY-ENFORCEMENT.md

agents/qa/skills/
  SKILL-INTEGRATION-TEST-AUTHORING.md
  SKILL-ROLE-DIFFERENTIATION-VERIFICATION.md
  SKILL-SCENARIO-CONSTRUCTION.md
  SKILL-REGRESSION-DETECTION.md

agents/security/skills/
  SKILL-API-INPUT-VALIDATION.md
  SKILL-AUTH-MIDDLEWARE-REVIEW.md
  SKILL-SQL-INJECTION-AUDIT.md
  SKILL-DEPENDENCY-AUDIT.md

agents/devops/skills/
  SKILL-POSTGRES-OPERATIONS.md
  SKILL-DOCKER-COMPOSE-MANAGEMENT.md
  SKILL-MIGRATION-RUNNER-OPERATIONS.md
  SKILL-HEALTH-CHECK-VERIFICATION.md

agents/docs/skills/
  SKILL-API-REFERENCE-GENERATION.md
  SKILL-SDK-USAGE-GUIDE.md
  SKILL-DECISION-CONTEXT-EXPLANATION.md
  SKILL-CHANGELOG-FROM-CHECKPOINTS.md

agents/product/skills/
  SKILL-SCOPE-GATE-ENFORCEMENT.md
  SKILL-ROLE-TEMPLATE-DESIGN.md
  SKILL-DEMO-SCENARIO-CURATION.md

agents/frontend/skills/
  SKILL-SDK-CONSUMER-PATTERNS.md
  SKILL-DEMO-SCRIPT-AUTHORING.md
```

---

## 2. Skill List by Agent (Execution Order)

---

### A. Backend (5 skills)

#### A1. SKILL-DECISION-CRUD
- **Purpose**: Implement and extend decision CRUD operations with correct pg.Pool patterns, embedding integration, and status lifecycle.
- **Why it made the cut**: Decision CRUD is the most-touched code path. Days 2, 5, 6b all modified it. Every new feature touches `createDecision`, `getDecision`, `listDecisions`, `updateDecisionStatus`. Getting this wrong cascades to scoring, compilation, and propagation.
- **Trigger conditions**: Any task involving decision creation, retrieval, filtering, or status change. Any feature adding fields to decisions. Any bug in decision persistence.
- **Internal sources**:
  - `packages/core/src/decision-graph/queries.ts` — all CRUD implementations
  - `packages/core/src/decision-graph/graph.ts` — graph model types
  - `packages/core/src/types.ts` — Decision, CreateDecisionInput types
  - `packages/server/src/app.ts` — route handlers for decisions
  - `supabase/migrations/001_initial_schema.sql` — decisions table schema
  - `packages/core/tests/decision-graph.test.ts` — 27 tests as pattern reference
  - `agents/backend/capabilities/NEXUS-KNOWN-SPEC-ISSUES.md` — known bugs
- **External sources**:
  - `node-postgres` docs (https://node-postgres.com/) — reference only, document URL
  - PostgreSQL 17 JSON/Array docs — reference only, document URL
- **Priority**: Critical now
- **Skill format**: Decision lifecycle state machine, pg.Pool query patterns, embedding integration decision tree, failure modes (constraint violations, missing projects, duplicate edges)

#### A2. SKILL-SCORING-IMPLEMENTATION
- **Purpose**: Implement, debug, and extend the 5-signal scoring formula with exact numeric precision.
- **Why it made the cut**: Scoring is the mathematical core of Nexus. Day 3 proved exact formula match is required. Any deviation produces wrong role-differentiation. 43 tests validate specific numeric outputs.
- **Trigger conditions**: Any task touching relevance calculation. Adding a new scoring signal. Tuning weights. Debugging why an agent gets wrong context. Any roleTagMap change.
- **Internal sources**:
  - `packages/core/src/context-compiler/scoring.ts` — all 5 scoring functions
  - `agents/backend/capabilities/NEXUS-ALGORITHM-REFERENCE.md` — formula spec with worked examples
  - `packages/core/src/roles.ts` — role templates and roleTagMap (threshold ≥ 0.8)
  - `packages/core/tests/scoring.test.ts` — 43 tests with exact expected values
  - `agents/backend/capabilities/NEXUS-KNOWN-SPEC-ISSUES.md` — BUG-2 (truncated roleTagMap), BUG-3 (truncated freshness divisor)
- **External sources**: None required.
- **Priority**: Critical now

#### A3. SKILL-MIGRATION-AUTHORING
- **Purpose**: Author and apply PostgreSQL migrations using the Nexus migrator pattern, with pgvector awareness.
- **Why it made the cut**: Schema evolution is the next frontier. Any Day 8+ feature (context_cache, session_summaries, per-project API keys) requires new migrations. The migrator is custom-built with idempotent tracking — agents must know its contract.
- **Trigger conditions**: Any task requiring schema change. Adding tables, columns, indexes, or functions. Fixing schema bugs.
- **Internal sources**:
  - `packages/core/src/db/migrator.ts` — migration runner implementation
  - `supabase/migrations/001_initial_schema.sql` — existing schema
  - `packages/core/tests/migrator.test.ts` — 3 tests
  - `packages/core/src/db/client.ts` — pool creation, health check
- **External sources**:
  - pgvector docs (https://github.com/pgvector/pgvector) — reference only, document URL
  - PostgreSQL 17 DDL reference — reference only, document URL
- **Priority**: Critical now

#### A4. SKILL-CONTEXT-COMPILER-PIPELINE
- **Purpose**: Understand and extend the 10-step compile() pipeline: fetch → score → expand → pack → format.
- **Why it made the cut**: The compiler is the product's core value. It touches every subsystem (DB, scoring, graph, packer, formatter). Day 4 proved integration complexity. Any new feature (artifact scoring, session inclusion, cache) requires modifying compile().
- **Trigger conditions**: Any task modifying compilation output. Adding a new data source to context. Changing pack priorities. Debugging compilation results. Performance optimization.
- **Internal sources**:
  - `packages/core/src/context-compiler/compiler.ts` — compile() implementation
  - `packages/core/src/context-compiler/packer.ts` — priority cascade (10/55/30/5)
  - `packages/core/src/context-compiler/formatter.ts` — markdown and JSON output
  - `packages/core/src/context-compiler/scoring.ts` — score computation
  - `packages/core/src/decision-graph/traversal.ts` — graph expansion with 0.6^depth decay
  - `packages/core/tests/compiler.test.ts` — 25 tests
  - `packages/core/tests/role-differentiation.test.ts` — 11 proof assertions
  - `agents/backend/capabilities/NEXUS-KNOWN-SPEC-ISSUES.md` — BUG-4 (formatter), BUG-5 (packer)
- **External sources**: None required.
- **Priority**: Critical now

#### A5. SKILL-CHANGE-PROPAGATOR
- **Purpose**: Extend and debug the change propagation system: event detection, subscription matching, role-appropriate notification generation, WebSocket push.
- **Why it made the cut**: Change propagation is the differentiator between Nexus and static context. Day 5 implemented it; Day 6b routes it through API. Any notification bug breaks the demo's most compelling section.
- **Trigger conditions**: Any task involving notifications. Adding new event types. Modifying role_context generation. Implementing WebSocket endpoint. Debugging missing/wrong notifications.
- **Internal sources**:
  - `packages/core/src/change-propagator/propagator.ts` — ChangePropagator class
  - `packages/core/src/change-propagator/subscriptions.ts` — subscription CRUD
  - `packages/core/tests/change-propagator.test.ts` — 13 tests
  - `packages/core/tests/scenario.test.ts` — 11 scenario tests including propagation
  - `packages/server/src/app.ts` — notification routes
- **External sources**: None required.
- **Priority**: Useful soon

---

### B. Architect (5 skills)

#### B1. SKILL-SCHEMA-EVOLUTION
- **Purpose**: Design schema changes that maintain backward compatibility, preserve existing data, and work within pgvector + PostgreSQL 17 constraints.
- **Why it made the cut**: Every planned feature (context_cache, session_summaries, api_keys, artifact scoring) requires schema changes. Architect must reason about foreign keys, indexes, migration ordering, and pgvector column interactions.
- **Trigger conditions**: Any feature requiring new tables or columns. Schema refactoring. Index strategy changes. Any migration that touches existing tables.
- **Internal sources**:
  - `supabase/migrations/001_initial_schema.sql` — complete current schema (9 tables, 2 functions, 3 triggers)
  - `agents/architect/capabilities/NEXUS-ARCHITECTURE-BRIEF.md` — system topology
  - `agents/architect/capabilities/NEXUS-LOCKED-DECISIONS.md` — stack constraints
  - `packages/core/src/types.ts` — TypeScript types that must match schema
- **External sources**:
  - PostgreSQL 17 ALTER TABLE docs — reference only, document URL
  - pgvector index types (IVFFlat vs HNSW) — reference only, document URL
- **Priority**: Critical now

#### B2. SKILL-API-CONTRACT-DESIGN
- **Purpose**: Design new API endpoints that are consistent with existing Nexus patterns: route structure, error envelope, request validation, response shape.
- **Why it made the cut**: Day 6b established a strict API contract pattern. New routes must follow it exactly (error envelope, UUID validation, auth middleware). Inconsistency breaks SDK expectations.
- **Trigger conditions**: Any feature requiring new API routes. API redesign. Adding query parameters or response fields. Any route that handles new entity types.
- **Internal sources**:
  - `packages/server/src/app.ts` — all route patterns
  - `packages/server/src/middleware/errors.ts` — AppError, error envelope format
  - `packages/server/src/middleware/validate.ts` — requireFields, requireUUID
  - `packages/server/src/middleware/auth.ts` — auth pattern
  - `packages/sdk/src/client.ts` — SDK method patterns that must match
  - `packages/server/tests/routes.test.ts` — E2E test patterns
- **External sources**:
  - Hono routing docs (https://hono.dev/docs/api/routing) — reference only, document URL
- **Priority**: Critical now

#### B3. SKILL-GRAPH-MODEL-EXTENSION
- **Purpose**: Extend the decision graph model with new edge types, node metadata, or traversal algorithms while preserving existing graph behavior.
- **Why it made the cut**: Graph expansion (0.6^depth decay, LATERAL JOIN traversal) is architecturally complex. Day 2 had a PG17 compatibility issue. Any extension must not break existing traversal or scoring.
- **Trigger conditions**: Adding new edge relationships. Adding metadata to graph nodes. Changing traversal depth or decay. Adding weighted edges. Implementing graph visualization data.
- **Internal sources**:
  - `packages/core/src/decision-graph/traversal.ts` — getConnectedDecisions, getProjectGraph
  - `packages/core/src/decision-graph/queries.ts` — edge CRUD
  - `packages/core/src/context-compiler/compiler.ts` — expandGraphContext
  - `supabase/migrations/001_initial_schema.sql` — decision_edges table, get_connected_decisions function
  - `packages/core/tests/decision-graph.test.ts` — 27 tests
- **External sources**:
  - PostgreSQL recursive CTE docs — reference only, document URL
- **Priority**: Useful soon

#### B4. SKILL-SCORING-FORMULA-TUNING
- **Purpose**: Design scoring formula modifications (new signals, weight adjustments, penalty changes) with impact analysis across all 8 role templates.
- **Why it made the cut**: Scoring tuning is the highest-leverage product lever. A weight change ripples through every agent's context. Architect must reason about second-order effects on role differentiation.
- **Trigger conditions**: Product requests scoring behavior change. Role template feedback indicates wrong prioritization. Adding a new scoring signal. Adjusting freshness decay. Any change to pack priority cascade.
- **Internal sources**:
  - `packages/core/src/context-compiler/scoring.ts` — current formula
  - `packages/core/src/roles.ts` — 8 role templates with weights
  - `agents/backend/capabilities/NEXUS-ALGORITHM-REFERENCE.md` — formula spec
  - `packages/core/tests/scoring.test.ts` — 43 numeric validation tests
  - `packages/core/tests/role-differentiation.test.ts` — 11 proof assertions
  - `projects/nexus-v1/shared/ROLE-DIFFERENTIATION-PROOF.md` — proof methodology
- **External sources**: None required.
- **Priority**: Useful soon

#### B5. SKILL-PACKAGE-BOUNDARY-ENFORCEMENT
- **Purpose**: Enforce and evolve the 3-package monorepo boundary: core (no HTTP), server (no business logic), SDK (no DB).
- **Why it made the cut**: Package boundaries prevent architectural erosion. Day 6b almost leaked pg into SDK. Day 7 added SDK→server dev dependency only for tests. Architect must catch boundary violations.
- **Trigger conditions**: Any PR adding cross-package imports. New package proposals. Shared utility discussions. Any import of pg from SDK or Hono from core.
- **Internal sources**:
  - `packages/core/package.json`, `packages/sdk/package.json`, `packages/server/package.json` — dependency declarations
  - `packages/core/src/index.ts`, `packages/sdk/src/index.ts`, `packages/server/src/index.ts` — public API surfaces
  - `agents/architect/capabilities/NEXUS-ARCHITECTURE-BRIEF.md` — package topology
  - `turbo.json` — build dependency graph
- **External sources**: None required.
- **Priority**: Critical now

---

### C. QA (4 skills)

#### C1. SKILL-INTEGRATION-TEST-AUTHORING
- **Purpose**: Write integration tests against real PostgreSQL that follow Nexus test patterns: pool lifecycle, migration, data isolation, cleanup.
- **Why it made the cut**: Every test file uses the same pattern (pool in beforeAll, migrate, create test project, cleanup in afterAll). Getting this wrong causes test pollution, connection leaks, or flaky tests. Day 4 had a freshness drift bug from bad test isolation.
- **Trigger conditions**: Any new feature requiring tests that touch the database. New test file creation. Test flakiness investigation. Connection pool exhaustion.
- **Internal sources**:
  - `packages/core/tests/decision-graph.test.ts` — canonical integration test pattern
  - `packages/core/tests/compiler.test.ts` — compile pipeline testing
  - `packages/sdk/tests/e2e.test.ts` — SDK→server→DB test pattern
  - `packages/server/tests/routes.test.ts` — Hono app.request() pattern
  - `packages/core/src/db/migrator.ts` — migrate() function
  - All `vitest.config.ts` files — fileParallelism: false, timeouts
- **External sources**:
  - Vitest docs (https://vitest.dev/) — reference only, document URL
- **Priority**: Critical now

#### C2. SKILL-ROLE-DIFFERENTIATION-VERIFICATION
- **Purpose**: Verify that role-differentiated compilation is preserved after any code change. Define what "materially different" means numerically.
- **Why it made the cut**: Role differentiation is THE core claim. It's been proven at 4 levels (scoring, compiler, API, SDK). Any regression here invalidates the product. QA must know exactly what to verify and what thresholds constitute a failure.
- **Trigger conditions**: Any change to scoring.ts, compiler.ts, roles.ts, packer.ts. Any new role template. Any scoring weight change. Post-merge regression check.
- **Internal sources**:
  - `packages/core/tests/role-differentiation.test.ts` — 11 proof assertions
  - `packages/core/tests/scenario.test.ts` — 11 THE Scenario tests
  - `packages/server/tests/routes.test.ts` — API-level role diff test
  - `packages/sdk/tests/e2e.test.ts` — SDK-level role diff test
  - `projects/nexus-v1/shared/ROLE-DIFFERENTIATION-PROOF.md` — proof methodology
  - `agents/qa/capabilities/NEXUS-SCENARIO-DEFINITIONS.md` — scenario data
- **External sources**: None required.
- **Priority**: Critical now

#### C3. SKILL-SCENARIO-CONSTRUCTION
- **Purpose**: Design new test scenarios with realistic decision sets that stress-test specific compiler behaviors (graph depth, tag overlap, superseded chains, budget overflow).
- **Why it made the cut**: THE Scenario (spec §20) covers the happy path. Edge cases (deep graphs, many superseded decisions, zero-match agents, budget overflow) need targeted scenarios. Day 5 proved scenario testing catches integration bugs that unit tests miss.
- **Trigger conditions**: New feature implementation. Investigating a compilation bug. Expanding test coverage for edge cases. Stress testing.
- **Internal sources**:
  - `agents/qa/capabilities/NEXUS-SCENARIO-DEFINITIONS.md` — existing scenarios
  - `packages/core/tests/scenario.test.ts` — scenario implementation pattern
  - `agents/qa/capabilities/NEXUS-TEST-PLAN.md` — test strategy
  - `packages/core/src/context-compiler/packer.ts` — budget/overflow logic to stress-test
- **External sources**: None required.
- **Priority**: Useful soon

#### C4. SKILL-REGRESSION-DETECTION
- **Purpose**: Identify and diagnose regressions in test output: numeric drift in scores, missing decisions in context, changed ordering, broken graph traversal.
- **Why it made the cut**: Nexus tests verify specific numeric values (scores to 3 decimal places). A "passing" test suite could hide subtle regressions if assertions are too loose. QA must know what signals indicate regression vs. expected behavior change.
- **Trigger conditions**: Test failure investigation. Post-refactor verification. Score value changes. Compilation output changes. Any "tests pass but output looks wrong" report.
- **Internal sources**:
  - `packages/core/tests/scoring.test.ts` — 43 tests with exact numeric expectations
  - `packages/core/tests/compiler.test.ts` — output structure assertions
  - `packages/core/tests/role-differentiation.test.ts` — proof lock
  - All test files (pattern: what changes break which assertions)
- **External sources**: None required.
- **Priority**: Useful soon

---

### D. Security (4 skills)

#### D1. SKILL-API-INPUT-VALIDATION
- **Purpose**: Review and extend API input validation for all Nexus endpoints: type coercion, array bounds, JSONB injection, text length limits.
- **Why it made the cut**: Nexus accepts rich JSON input (decisions with arrays, JSONB metadata, text fields). The current validation is field-presence + UUID format only. Missing: length limits, array size limits, nested object validation, type coercion prevention.
- **Trigger conditions**: Any new API endpoint. Security review of existing endpoints. Fuzzing results. Any input that causes unexpected PostgreSQL errors.
- **Internal sources**:
  - `packages/server/src/middleware/validate.ts` — current validation (requireFields, requireUUID)
  - `packages/server/src/app.ts` — all route handlers showing what body fields are used
  - `agents/security/capabilities/NEXUS-THREAT-MODEL.md` — HIGH: API Input Injection
  - `supabase/migrations/001_initial_schema.sql` — column types and constraints
- **External sources**:
  - Hono validator middleware docs — reference only, document URL
  - OWASP Input Validation Cheat Sheet — reference only, document URL
- **Priority**: Critical now

#### D2. SKILL-AUTH-MIDDLEWARE-REVIEW
- **Purpose**: Review and harden the API key authentication middleware: timing attacks, key storage, dev mode bypass safety, per-project isolation path.
- **Why it made the cut**: Current auth is env-based single key with dev mode bypass. The server's own TODO comments list per-project keys, rotation, expiry, and scoped permissions. Security must define the hardening path.
- **Trigger conditions**: Any auth feature work. Moving to per-project keys. Adding rate limiting. Security audit. Production deployment preparation.
- **Internal sources**:
  - `packages/server/src/middleware/auth.ts` — current implementation with TODOs
  - `agents/security/capabilities/NEXUS-THREAT-MODEL.md` — auth section
  - `supabase/migrations/001_initial_schema.sql` — no api_keys table yet
- **External sources**:
  - OWASP Authentication Cheat Sheet — reference only, document URL
  - `crypto.timingSafeEqual` Node.js docs — reference only, document URL
- **Priority**: Useful soon

#### D3. SKILL-SQL-INJECTION-AUDIT
- **Purpose**: Audit all database queries for SQL injection via parameterized query compliance, dynamic query construction safety, and JSONB operator handling.
- **Why it made the cut**: Nexus uses raw `pg.Pool` (not an ORM). All queries are hand-written. Day 6b's notification query has dynamic WHERE clause construction. Any query building strings from user input is a risk.
- **Trigger conditions**: Any new database query. Code review of query changes. Security audit. Any query using string interpolation or template literals with user input.
- **Internal sources**:
  - `packages/core/src/decision-graph/queries.ts` — all CRUD queries
  - `packages/core/src/change-propagator/subscriptions.ts` — subscription queries
  - `packages/server/src/app.ts` — inline queries (projects, agents, artifacts, notifications)
  - `packages/core/src/db/client.ts` — pool wrapper
- **External sources**:
  - node-postgres parameterized queries docs — reference only, document URL
- **Priority**: Critical now

#### D4. SKILL-DEPENDENCY-AUDIT
- **Purpose**: Audit npm dependencies for known vulnerabilities, license compliance, and supply chain risk.
- **Why it made the cut**: Nexus has ~15 direct dependencies across 3 packages. `pg`, `hono`, `openai` are the critical ones. A compromised dependency in a context-compilation tool could exfiltrate decision data.
- **Trigger conditions**: Dependency update. New dependency addition. Security advisory notification. Pre-release audit.
- **Internal sources**:
  - All `package.json` files (root, core, sdk, server)
  - `pnpm-lock.yaml` — full dependency tree
- **External sources**:
  - `npm audit` — reference only (CLI tool)
  - Snyk vulnerability database — reference only, document URL
  - Socket.dev — reference only, document URL
- **Priority**: Useful soon

---

### E. DevOps (4 skills)

#### E1. SKILL-POSTGRES-OPERATIONS
- **Purpose**: Start, stop, configure, and troubleshoot PostgreSQL 17 with pgvector in the Nexus development environment.
- **Why it made the cut**: PostgreSQL is the single critical dependency. Every test run needs it. The current setup is container-local (not Docker-in-Docker). `sudo -n pg_ctlcluster 17 main start` is the start command. Extensions must be pre-enabled by the postgres superuser.
- **Trigger conditions**: PostgreSQL won't start. Connection refused errors. Extension not available. Performance issues. Disk space. Migration failures.
- **Internal sources**:
  - `MEMORY.md` — infrastructure notes (PG17 start command, DATABASE_URL)
  - `packages/core/src/db/client.ts` — createPool, healthCheck
  - `packages/core/src/db/migrator.ts` — migration runner
  - `supabase/migrations/001_initial_schema.sql` — schema requiring vector and uuid-ossp extensions
- **External sources**:
  - PostgreSQL 17 pg_ctlcluster man page — reference only, document URL
  - pgvector installation docs — reference only, document URL
- **Priority**: Critical now

#### E2. SKILL-DOCKER-COMPOSE-MANAGEMENT
- **Purpose**: Build, configure, and troubleshoot the Docker Compose deployment (nexus service + postgres service).
- **Why it made the cut**: Spec §16 defines the production topology. Current dev environment is container-local PG, but production needs Docker Compose. The Dockerfile and compose.yaml don't exist yet.
- **Trigger conditions**: Production deployment preparation. Creating Dockerfile. Creating docker-compose.yaml. Troubleshooting container networking. Volume management.
- **Internal sources**:
  - `agents/devops/capabilities/NEXUS-INFRASTRUCTURE-SPEC.md` — Docker Compose topology
  - `TOOLS.md` — runtime constraints (no Docker-in-Docker)
  - `packages/server/src/index.ts` — server entry point
- **External sources**:
  - Docker Compose v2 docs — reference only, document URL
  - pgvector Docker image (pgvector/pgvector) — reference only, document URL
- **Priority**: Useful soon

#### E3. SKILL-MIGRATION-RUNNER-OPERATIONS
- **Purpose**: Run, verify, and troubleshoot database migrations in dev and production environments.
- **Why it made the cut**: The migrator is custom-built (not Prisma/Drizzle/Knex). It uses a `_migrations` table, runs in transactions, and is idempotent. DevOps must understand its operational behavior: what happens on failure, partial migration, re-run.
- **Trigger conditions**: Deploying schema changes. Migration failure recovery. Fresh environment setup. Database state verification.
- **Internal sources**:
  - `packages/core/src/db/migrator.ts` — implementation
  - `packages/core/tests/migrator.test.ts` — 3 tests
  - `supabase/migrations/` — migration files
- **External sources**: None required.
- **Priority**: Critical now

#### E4. SKILL-HEALTH-CHECK-VERIFICATION
- **Purpose**: Use the `/api/health` endpoint and direct DB checks to verify system health, diagnose degraded state, and determine readiness.
- **Why it made the cut**: Health endpoint exists but only checks DB connectivity. DevOps needs a skill for interpreting health signals, adding checks (migration state, extension availability, pool saturation), and integrating with monitoring.
- **Trigger conditions**: System health investigation. Adding health checks. Monitoring integration. Load testing. Pre-deploy verification.
- **Internal sources**:
  - `packages/server/src/app.ts` — health route implementation
  - `packages/core/src/db/client.ts` — healthCheck function
  - `packages/sdk/src/client.ts` — health() SDK method
- **External sources**: None required.
- **Priority**: Later/optional

---

### F. Docs (4 skills)

#### F1. SKILL-API-REFERENCE-GENERATION
- **Purpose**: Generate accurate API reference documentation from the actual route implementations, including request/response types, error codes, and examples.
- **Why it made the cut**: 14+ API routes exist with no external documentation. SDK consumers need a reference. The server code is the source of truth — docs must be generated from it, not written independently.
- **Trigger conditions**: New API route added. Route behavior changed. SDK method added. Pre-release documentation. Developer onboarding.
- **Internal sources**:
  - `packages/server/src/app.ts` — all routes (source of truth)
  - `packages/server/src/middleware/errors.ts` — error envelope format
  - `packages/server/src/middleware/validate.ts` — validation rules
  - `packages/sdk/src/client.ts` — SDK method signatures (consumer perspective)
  - `packages/server/tests/routes.test.ts` — request/response examples
- **External sources**: None required.
- **Priority**: Useful soon

#### F2. SKILL-SDK-USAGE-GUIDE
- **Purpose**: Write SDK getting-started and usage documentation showing the developer path from install to compilation.
- **Why it made the cut**: The SDK is the primary consumption interface. The demo script proves it works but isn't a guide. Developers need: install, configure, create project, register agents, record decisions, compile, handle errors.
- **Trigger conditions**: SDK API change. New convenience method. Developer feedback. README writing. Pre-release documentation.
- **Internal sources**:
  - `packages/sdk/src/client.ts` — all methods with JSDoc
  - `packages/sdk/src/index.ts` — public API and type exports
  - `examples/software-team/comparison.ts` — usage patterns
  - `packages/sdk/tests/e2e.test.ts` — tested usage patterns
  - `agents/docs/capabilities/NEXUS-KEY-MESSAGING.md` — messaging lines
- **External sources**: None required.
- **Priority**: Useful soon

#### F3. SKILL-DECISION-CONTEXT-EXPLANATION
- **Purpose**: Explain the core Nexus concept (decision-aware context compilation) in user-facing documentation without implementation jargon.
- **Why it made the cut**: The value proposition is technical and requires careful explanation. "Different agents need different context" is the pitch; docs must bridge from pitch to understanding with concrete examples.
- **Trigger conditions**: README writing. Blog post. Landing page copy. Explaining Nexus to a new user. Any "what is Nexus?" context.
- **Internal sources**:
  - `agents/docs/capabilities/NEXUS-KEY-MESSAGING.md` — headline, subhead, one-liner
  - `examples/software-team/comparison.ts` — the comparison that shows the value
  - `projects/nexus-v1/shared/ROLE-DIFFERENTIATION-PROOF.md` — proof data
  - `agents/product/capabilities/NEXUS-SCOPE-BOUNDARY.md` — what Nexus is and isn't
- **External sources**: None required.
- **Priority**: Useful soon

#### F4. SKILL-CHANGELOG-FROM-CHECKPOINTS
- **Purpose**: Generate accurate changelogs and release notes from CHECKPOINT.md history and daily memory files.
- **Why it made the cut**: 9 checkpoints exist with detailed deliverables, deviations, and build recoveries. This is structured data that can be transformed into user-facing release notes automatically.
- **Trigger conditions**: Release preparation. Version bump. Changelog generation. "What changed since X?" questions.
- **Internal sources**:
  - `projects/nexus-v1/CHECKPOINT.md` — current (and implicit history from prior checkpoints in memory)
  - `projects/nexus-v1/STATUS.md` — day-by-day summary
  - `memory/2026-04-02-day*.md` — daily logs
  - `MEMORY.md` — build progress section
- **External sources**: None required.
- **Priority**: Later/optional

---

### G. Product (3 skills)

#### G1. SKILL-SCOPE-GATE-ENFORCEMENT
- **Purpose**: Evaluate any feature request against the Nexus v1 scope boundary and produce an instant accept/reject/defer decision with rationale.
- **Why it made the cut**: Scope creep is the #1 risk for v1 completion. The scope boundary is already defined but Product needs an execution framework to enforce it quickly and consistently. Every "wouldn't it be nice if..." must hit this gate.
- **Trigger conditions**: Any feature request. Scope expansion proposal. "Should we add X?" questions. Backlog prioritization. Architect proposing new capabilities.
- **Internal sources**:
  - `agents/product/capabilities/NEXUS-SCOPE-BOUNDARY.md` — IN v1 / NOT IN v1 / EXPLICITLY OUT
  - `MEMORY.md` — deferred items list
  - `agents/architect/capabilities/NEXUS-LOCKED-DECISIONS.md` — stack constraints
- **External sources**: None required.
- **Priority**: Critical now

#### G2. SKILL-ROLE-TEMPLATE-DESIGN
- **Purpose**: Design new role templates or tune existing ones based on observed compilation behavior and user feedback.
- **Why it made the cut**: 8 role templates exist. Real usage will reveal gaps (custom roles, weight imbalances, missing tag mappings). Product must own the "what roles exist and what do they prioritize" decision.
- **Trigger conditions**: User requests new role. Existing role produces suboptimal context. Adding a domain-specific agent type. roleTagMap needs new entries.
- **Internal sources**:
  - `packages/core/src/roles.ts` — 8 templates + roleTagMap
  - `packages/core/src/context-compiler/scoring.ts` — how weights affect scoring
  - `packages/core/tests/role-differentiation.test.ts` — proof of differentiation
  - `agents/backend/capabilities/NEXUS-ALGORITHM-REFERENCE.md` — formula spec
- **External sources**: None required.
- **Priority**: Useful soon

#### G3. SKILL-DEMO-SCENARIO-CURATION
- **Purpose**: Design demo scenarios that showcase Nexus value with realistic, relatable decision sets for specific audiences.
- **Why it made the cut**: The current demo uses a software team building auth. Future demos may target different audiences (ML teams, compliance, product teams). Each needs curated decisions that make role differentiation obvious.
- **Trigger conditions**: Preparing a demo for a specific audience. Marketing content creation. Conference talk preparation. New seed data needed.
- **Internal sources**:
  - `examples/software-team/comparison.ts` — current demo
  - `packages/sdk/src/client.ts` — seedSoftwareTeamDemo() pattern
  - `agents/qa/capabilities/NEXUS-SCENARIO-DEFINITIONS.md` — test scenario patterns
- **External sources**: None required.
- **Priority**: Later/optional

---

### H. Frontend/Demo (2 skills)

#### H1. SKILL-SDK-CONSUMER-PATTERNS
- **Purpose**: Consume the Nexus SDK correctly from application code: initialization, error handling, type usage, request batching.
- **Why it made the cut**: Frontend (or any SDK consumer) needs patterns for: creating a client, handling NexusApiError, using convenience methods, understanding CompileRequest options. The SDK surface is now stable (Day 7).
- **Trigger conditions**: Building a UI that consumes Nexus. Creating a CLI tool. Integrating Nexus into an agent framework. Writing application-level code that calls the SDK.
- **Internal sources**:
  - `packages/sdk/src/client.ts` — NexusClient API
  - `packages/sdk/src/index.ts` — exported types
  - `examples/software-team/comparison.ts` — usage patterns
  - `packages/sdk/tests/e2e.test.ts` — tested patterns
- **External sources**: None required.
- **Priority**: Useful soon

#### H2. SKILL-DEMO-SCRIPT-AUTHORING
- **Purpose**: Write and maintain demo scripts that showcase Nexus capabilities through the SDK with clear console output.
- **Why it made the cut**: The comparison demo is the primary "show, don't tell" artifact. It must be maintained as the API evolves. Frontend/demo owns the presentation layer of Nexus's value.
- **Trigger conditions**: New Nexus feature to showcase. Demo broken by API change. New audience/scenario. Conference preparation.
- **Internal sources**:
  - `examples/software-team/comparison.ts` — current demo pattern
  - `packages/sdk/src/client.ts` — available SDK methods
  - `agents/docs/capabilities/NEXUS-KEY-MESSAGING.md` — messaging for demo narration
- **External sources**: None required.
- **Priority**: Later/optional

---

## 3. Summary Tables

### Skill Count by Agent

| Agent | Skills | Critical Now | Useful Soon | Later/Optional |
|-------|--------|-------------|-------------|----------------|
| Backend | 5 | 4 | 1 | 0 |
| Architect | 5 | 3 | 2 | 0 |
| QA | 4 | 2 | 2 | 0 |
| Security | 4 | 2 | 2 | 0 |
| DevOps | 4 | 2 | 1 | 1 |
| Docs | 4 | 0 | 3 | 1 |
| Product | 3 | 1 | 1 | 1 |
| Frontend | 2 | 0 | 1 | 1 |
| **Total** | **31** | **14** | **13** | **4** |

### External Sources Summary

| Source | Used By | Classification |
|--------|---------|----------------|
| node-postgres docs | Backend A1 | Reference only, document URL |
| PostgreSQL 17 docs (DDL, JSON/Array, CTE, ALTER TABLE) | Backend A1/A3, Architect B1/B3 | Reference only, document URL |
| pgvector docs/repo | Backend A3, Architect B1, DevOps E1 | Reference only, document URL |
| Hono routing docs | Architect B2 | Reference only, document URL |
| Vitest docs | QA C1 | Reference only, document URL |
| OWASP Input Validation + Auth Cheat Sheets | Security D1/D2 | Reference only, document URL |
| Node.js crypto docs | Security D2 | Reference only, document URL |
| Docker Compose v2 docs | DevOps E2 | Reference only, document URL |
| npm audit / Snyk / Socket.dev | Security D4 | Reference only, document URL |

**No clones or downloads justified.** All external sources are reference documentation accessed via URL when needed.

---

## 4. Recommended Write Order

Priority-ordered within each agent, agents in the specified execution order.

| # | Agent | Skill | Priority |
|---|-------|-------|----------|
| 1 | Backend | A1. SKILL-DECISION-CRUD | Critical now |
| 2 | Backend | A2. SKILL-SCORING-IMPLEMENTATION | Critical now |
| 3 | Backend | A3. SKILL-MIGRATION-AUTHORING | Critical now |
| 4 | Backend | A4. SKILL-CONTEXT-COMPILER-PIPELINE | Critical now |
| 5 | Backend | A5. SKILL-CHANGE-PROPAGATOR | Useful soon |
| 6 | Architect | B1. SKILL-SCHEMA-EVOLUTION | Critical now |
| 7 | Architect | B2. SKILL-API-CONTRACT-DESIGN | Critical now |
| 8 | Architect | B5. SKILL-PACKAGE-BOUNDARY-ENFORCEMENT | Critical now |
| 9 | Architect | B3. SKILL-GRAPH-MODEL-EXTENSION | Useful soon |
| 10 | Architect | B4. SKILL-SCORING-FORMULA-TUNING | Useful soon |
| 11 | QA | C1. SKILL-INTEGRATION-TEST-AUTHORING | Critical now |
| 12 | QA | C2. SKILL-ROLE-DIFFERENTIATION-VERIFICATION | Critical now |
| 13 | QA | C3. SKILL-SCENARIO-CONSTRUCTION | Useful soon |
| 14 | QA | C4. SKILL-REGRESSION-DETECTION | Useful soon |
| 15 | Security | D1. SKILL-API-INPUT-VALIDATION | Critical now |
| 16 | Security | D3. SKILL-SQL-INJECTION-AUDIT | Critical now |
| 17 | Security | D2. SKILL-AUTH-MIDDLEWARE-REVIEW | Useful soon |
| 18 | Security | D4. SKILL-DEPENDENCY-AUDIT | Useful soon |
| 19 | DevOps | E1. SKILL-POSTGRES-OPERATIONS | Critical now |
| 20 | DevOps | E3. SKILL-MIGRATION-RUNNER-OPERATIONS | Critical now |
| 21 | DevOps | E2. SKILL-DOCKER-COMPOSE-MANAGEMENT | Useful soon |
| 22 | DevOps | E4. SKILL-HEALTH-CHECK-VERIFICATION | Later/optional |
| 23 | Docs | F1. SKILL-API-REFERENCE-GENERATION | Useful soon |
| 24 | Docs | F2. SKILL-SDK-USAGE-GUIDE | Useful soon |
| 25 | Docs | F3. SKILL-DECISION-CONTEXT-EXPLANATION | Useful soon |
| 26 | Docs | F4. SKILL-CHANGELOG-FROM-CHECKPOINTS | Later/optional |
| 27 | Product | G1. SKILL-SCOPE-GATE-ENFORCEMENT | Critical now |
| 28 | Product | G2. SKILL-ROLE-TEMPLATE-DESIGN | Useful soon |
| 29 | Product | G3. SKILL-DEMO-SCENARIO-CURATION | Later/optional |
| 30 | Frontend | H1. SKILL-SDK-CONSUMER-PATTERNS | Useful soon |
| 31 | Frontend | H2. SKILL-DEMO-SCRIPT-AUTHORING | Later/optional |

---

## 5. Skill Writing Format (For Execution Phase)

Each skill file will follow this structure:

```markdown
# SKILL-<NAME>

## Purpose
What this skill enables the agent to do.

## When to Use
Trigger conditions — specific situations that activate this skill.

## Inputs Required
What information/files/context the agent needs before executing.

## Execution Method
Step-by-step decision framework or procedure.

## Failure Modes
What can go wrong, how to detect it, how to recover.

## Nexus-Specific Examples
Concrete examples using actual Nexus code, types, and patterns.

## Exit Criteria
How to verify the skill was applied correctly.
```

---

**Awaiting approval to begin writing.**
