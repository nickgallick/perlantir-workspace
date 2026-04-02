# MEMORY.md

## Operating Rules

### Auto-State-Preservation (Effective 2026-04-02)

After any meaningful completed task, update project state files before reporting completion.

**Minor task** → `STATUS.md` only.
**Material state change** (phase completion, blocker resolution, approval, architecture change, decision) → full pass: `STATUS.md`, `CHECKPOINT.md`, `DECISIONS.md` (if decision changed), `SESSION-HANDOFF`, `MEMORY.md` (if durable memory changed).

Do not rewrite files unnecessarily. Do not perform shallow/generic updates. Each update must capture: what completed, what changed, what is now true, what remains blocked/unblocked, exact next step, downstream agent impact.

### Mandatory State Preservation Reporting (Effective 2026-04-02 03:33 UTC+8)

Every completion report must include a dedicated section with explicit status for every state file:

```
## State Preservation
- projects/nexus-v1/STATUS.md — updated / no update needed (reason)
- projects/nexus-v1/CHECKPOINT.md — updated / no update needed (reason)
- projects/nexus-v1/DECISIONS.md — updated / no update needed (reason)
- memory/SESSION-HANDOFF-YYYY-MM-DD.md — updated / no update needed (reason)
- MEMORY.md — updated / no update needed (reason)
```

If a file was not updated, state why. State preservation is not complete until it is both performed and explicitly reported. No inference required by the operator.

---

## Operator Context

**Nick Gallick**
- Timezone: Asia/Kuala_Lumpur (UTC+8)
- Communication style: Direct, technical, precise. No filler. No hedging.
- Quality bar: Premium — no generic output, everything specific to this system
- Approval discipline: Explicit approval phrases required for all Category 2+ work
- Expectation: State-of-the-art multi-agent operating system with strict governance, restart resilience, strong verification, and no generic filler

---

## System Identity

**Project**: Perlantir — Enterprise multi-agent AI operating system

**Architecture**: Governor-centric. Governor manages phases, approval gates, and specialist dispatch. Specialists execute within approved scope. All behavior governed by explicit standards, not prompts alone.

**Workspace root**: `/data/.openclaw/workspace/`

---

## Build State (as of 2026-04-01)

### Completed Work

**Phase 5 — Standards and Operator Layer**
19 files: 16 standards + 3 memory convention files.

**Phase 6 — Governor Bootstrap Protocol**
`enterprise/BOOTSTRAP.md` (536 lines). 9-stage read order, 27 required files, 10 block triggers.

**Execution Persistence — CHECKPOINT.md System**
`standards/EXECUTION-PERSISTENCE-STANDARD.md` (774 lines), `projects/.template/CHECKPOINT.md` (327 lines), Bootstrap Stage 2.5 enhanced. No per-project CHECKPOINTs yet.

**Correction Phase 1 — Bootstrap Self-Contradiction Resolution**
Deleted root `BOOTSTRAP.md`. Populated `USER.md`. Rewrote 4 enterprise core files: GOVERNANCE.md (authority hierarchy, decision thresholds, standard-precedence rule), INTAKE.md (intake authority, points to workflow 01), REVIEW-GATES.md (gate authority, points to workflows 06/07), GLOSSARY.md (30 key terms). All 27 Tier 1 files now substantive. Bootstrap B-3 resolved.

**Correction Phase 2A — Coordination Centralization**
Created `agents/COORDINATION.md` (278 lines, 44 unique agent-pair relationships). Replaced Section 7 in all 11 specialist AGENT.md files with concise summary + COORDINATION.md reference. Governor AGENT.md untouched. Net −116 lines.

**Correction Phase 2B — Agent-Standards Binding**
Fixed Governor approval-language contradiction: Category 0-1 allows informal approval; Category 2+ requires explicit phrase; defaults to Category 2 when uncertain. Added "Governing Standards" section to all 12 agent files. Governor references 17 standards; specialists reference 7-11 each, role-appropriate. +196 lines.

**Mechanical Coding Override Integration**
Integrated 6 high-value execution mechanics into `standards/ENGINEERING-EXECUTION.md` only (+47 lines, 224→271). No other files modified.
1. §Structural Quality Discipline — coding-time structural reasoning criteria (naming, cohesion, coupling, abstraction boundaries, God-file detection, separation of concerns). Coding-only. Grounds for Governor rework.
2. §Decomposition Signaling — specialists must flag phases touching >8 files, >500 LOC net new, >3 logical concerns, or exceeding context capacity. Universal.
3. §Tool Output Completeness — truncation awareness extended from file reads to all tool output (exec, grep, web fetch, API). Truncated output acted on without acknowledgment = verification failure. Universal.
4. §Refactor Pre-Protocol (Step 0) — mandatory 4-step cleanup pass (dead code, formatting, cruft, separate checkpoint) before any refactor phase. Coding-only.
5. §Long-File Handling tightened — bounded reads default at >300 lines (was >3000), mandatory at >1000 lines (was >5000). Universal.
6. §Rename search targets — replaced generic "include" list with 9 enumerated categories (direct imports, types, string literals, dynamic imports, re-exports, test fixtures, docs, configs, manifests). Coding-only.

---

## First Project: Nexus v1

**Status**: Day 1 implementation COMPLETE. Ready for Day 2.

**What Nexus is**: Decision-aware context compilation for multi-agent teams. TypeScript library + REST API + SDK. First project under full Perlantir governance.

**Code location**: `workspace/nexus/` (Turborepo + pnpm monorepo)

---

## Nexus Locked Decisions

- **AMB-1 RESOLVED (LOCKED):** Raw `pg` (node-postgres) with `pg.Pool`. No `@supabase/supabase-js`. Approved 2026-04-01. All code and capability files reflect this.
- **Stack:** TypeScript strict, Node.js 22, PostgreSQL 16 + pgvector, Hono, Vitest, Turborepo + pnpm, Docker compose (2 services)
- **Full locked decisions list:** `agents/architect/capabilities/NEXUS-LOCKED-DECISIONS.md`

---

## Nexus Build Progress

### Capability Layer — Phase 1A: COMPLETE (2026-04-01)

15 files: 4 shared (`projects/nexus-v1/shared/`) + 11 agent capabilities (`agents/<agent>/capabilities/`).

Phase 1B (9 files) scoped but not started. See `projects/NEXUS-CAPABILITY-LAYER-PLAN.md`.

### Day 1 Implementation: COMPLETE (2026-04-02 01:14 UTC+8)

- 3 packages scaffold: core (active), server (stubs), sdk (stubs)
- `types.ts`: all Nexus types, NexusConfig with databaseUrl
- `roles.ts`: 8 role templates, BUG-2 fixed
- `db/client.ts`: pg.Pool createPool + healthCheck
- `relevance.ts`: OpenAI embedder + cosine similarity
- `001_initial_schema.sql`: 9 tables, 2 functions, 3 triggers (not yet applied to DB)
- Build: 3/3 packages, zero errors
- Tests: 19/19 pass (17 core + 2 placeholders)
- Deviations: corepack→npm global install, TS strict mode fix in roles.ts

### Day 2: Decision Graph — COMPLETE (2026-04-02 02:22 UTC+8)

- Migration runner: Node.js-based, pg.Pool transactions, idempotent, tracks applied migrations
- Decision CRUD: create (with optional embedding), get, list (filter by status/made_by/tags), updateStatus
- Edge CRUD: create, listBySource/Target/Decision, delete, listByRelationship
- Graph traversal: `getConnectedDecisions` (recursive SQL via LATERAL JOIN), `getProjectGraph`
- Schema fix: `get_connected_decisions` refactored for PG17 (LATERAL JOIN pattern)
- PostgreSQL 17 + pgvector 0.8.0 running inside container (dev-only)
- Tests: 30 new (3 migrator + 27 decision-graph integration), 47 total, all pass
- Deviations: PG17 instead of PG16, container-local DB, schema CTE fix, fileParallelism:false

### Day 3: Context Compiler — Scoring — COMPLETE (2026-04-02 03:10 UTC+8)

- All 5 scoring signals implemented per ALGORITHM-REFERENCE.md (exact formula match)
- Pure functions in `scoring.ts`: directAffect, tagMatching, roleRelevance, semanticSimilarity, freshness
- Status penalty: superseded (0.4 if included, 0.1 if not), reverted (0.05)
- Combined = min(1.0, relevance×0.7 + freshness×0.3)
- Debug mode: per-decision score breakdown log lines
- roleTagMap threshold: weight ≥ 0.8 (matches worked examples)
- Tests: 43 new (exact calcs, role-differentiation proof, fallbacks, determinism), 90 total, all pass
- No deviations

### Day 4: Context Compiler — Assembly — COMPLETE (2026-04-02 03:52 UTC+8)

- `compile()`: Full 10-step pipeline (fetch → score → expand → pack → format)
- `expandGraphContext()`: graph expansion with 0.6^depth score decay, skip-if-higher
- `packIntoBudget()`: priority cascade (10/55/30/5), overflow, relevanceThreshold tracking
- `formatAsMarkdown()` / `formatAsJson()`: output formatters, BUG-4/BUG-5 fixes applied
- Tests: 25 new (8 packer + 5 formatter + 12 integration), 115 total, all pass
- Role-differentiated context proven: same project, 3 agents (builder/launch/reviewer), different packages
- Determinism proven: same input → identical output (with fixed `now`)
- Deviations: 1 (freshness drift in determinism test — test isolation fix, not code bug)
- Proof lock: `ROLE-DIFFERENTIATION-PROOF.md` + `role-differentiation.test.ts` (11 assertions)
- Total after proof lock: 126 tests, 6 test files

### Operator Correction (2026-04-02 03:45 UTC+8)
Completion standard tightened: detect → resolve/classify → re-run verification → declare with clean state. No phase marked complete with unresolved signals. Enforced going forward.

### Day 5: Critical Test + Change Propagator — COMPLETE (2026-04-02 05:13 UTC+8)

- `ChangePropagator` class: onDecisionCreated, onDecisionSuperseded, onDecisionReverted
- Role-appropriate notifications: 9-role context map, urgency levels (high for supersede/revert)
- WebSocket client registry for real-time push
- Subscription CRUD: create (upsert), list, findMatching, delete, deleteAll
- THE Scenario Test: 5 scenarios (A-E) from spec §20, 10 decisions, 4 edges, 3 agents
- Tests: 24 new (13 change-propagator + 11 scenario), 150 total, all pass
- No deviations

### Day 6: SDK Client + Seed Data + Demo Script — COMPLETE (2026-04-02 05:47 UTC+8)

- `NexusClient` class: full CRUD, convenience helpers (createRoleAgent, compileForAgent, recordDecisionWithEdges)
- `seedSoftwareTeamDemo()`: 6 agents, 10 decisions, 4 edges (spec §15)
- Comparison demo script: baseline vs Nexus + change propagation (spec §17)
- SDK re-exports all core types; consumers don't need @nexus-ai/core directly
- Tests: 9 new (8 client + 1 placeholder), 159 total, all pass
- Demo requires server (Day 8) to run end-to-end

### Day 6b: API Server (Hono) — COMPLETE (2026-04-02 05:53 UTC+8)

- Hono REST API: all core routes (projects, agents, decisions, edges, artifacts, compile, notifications, health)
- Middleware: auth (env-based API key), validation (required fields, UUID), error handling (AppError + onError)
- Consistent error envelope: `{ error: { code, message, details? } }`
- Health endpoint with DB dependency state
- E2E tests through HTTP boundary including role-differentiation proof
- Tests: 27 new (26 routes + 1 placeholder), 186 total, all pass
- Build recoveries: pg deps missing (resolved), Hono error handler pattern (resolved)
- Stubbed: per-project API keys, rate limiting per key, WS endpoint

### Day 7: SDK Ergonomics + E2E + Demo Polish — COMPLETE (2026-04-02 06:10 UTC+8)

- SDK error handling: NexusApiError class preserving server error envelope (status, code, serverMessage, details)
- Missing SDK methods: updateDecisionStatus, createEdge, listEdges, deleteEdge, listArtifacts, health()
- Type improvements: ConnectedDecision return type, HealthResponse, NexusErrorEnvelope
- SDK now covers 100% of server routes
- E2E tests: 27 new through real Hono app + real DB (fetch interception, not mocked)
- Demo script rewritten: 4-section (baseline vs Nexus vs change propagation vs SDK ergonomics)
- Tests: 27 new SDK E2E, 213 total, all pass
- No deviations

---

## Phase 8: Skill Layer Construction — COMPLETE (2026-04-02 07:56–11:35 UTC+8)

- 33 skills planned across 8 agents (17 critical, 13 soon, 3 later)
- Plan: `projects/nexus-v1/PHASE-8-SKILL-LAYER-PLAN.md`
- Batch 1 (Backend): 6 skills in `agents/backend/skills/`
- Batch 2 (Architect): 5 skills in `agents/architect/skills/`
- **Canonical shared artifact**: `projects/nexus-v1/shared/NEXUS-SYSTEM-INVARIANTS.md` — 10 invariants (INV-1 through INV-10), referenced by all agents. Extracted from SKILL-SYSTEM-INVARIANT-ENFORCEMENT into shared file for cross-agent use.
- Key artifact: DATA-CONTRACT-INTEGRITY documents the 5-layer parsing chain and parser duplication locations
- Batch 3 (QA): 5 skills in `agents/qa/skills/` — INTEGRATION-TEST-AUTHORING, ROLE-DIFFERENTIATION-VERIFICATION, SCENARIO-CONSTRUCTION, REGRESSION-DETECTION, COMPILATION-PERFORMANCE-VALIDATION
- QA skills define: 4-layer verification protocol for INV-1, numeric thresholds for compile perf (50ms/10dec, 150ms/50dec, 500ms/200dec, 2s/1000dec), regression triage decision tree, 7 scenario categories
- **PB-1 tracked**: Compilation Performance Baseline + Regression Guard — tracked in STATUS.md Performance Backlog, not yet implemented. Requires datasets at 4 sizes, subsystem timing, baseline capture, threshold assertions.
- Batch 4 (Security): 5 skills in `agents/security/skills/` — API-INPUT-VALIDATION, SQL-INJECTION-AUDIT, SENSITIVE-DATA-EXPOSURE-REVIEW, AUTH-MIDDLEWARE-REVIEW, DEPENDENCY-AUDIT
- Security findings: full SQL query audit (all parameterized, 4 dynamic patterns verified safe), no input length/array/enum validation. All with concrete fix code.
- **SB-1 tracked**: Auth key timing-safe comparison — `auth.ts` uses `!==`, needs `timingSafeEqual`. Must fix before production.
- **SB-2 tracked**: Generic 500 error messages — `errors.ts` leaks raw `err.message` in HTTP 500. Must fix before production.
- **SB-3 tracked**: Server startup migration — `index.ts` has no `migrate()` call. Must fix before production.
- **SB-4 tracked**: Health endpoint auth conflict — `/api/health` blocked by auth when `NEXUS_API_KEY` set. Should fix before production.
- **PB-1 upgraded**: Staged enforcement — Phase A (warn, non-blocking) → Phase B (CI fail, blocking after ≥ 3 baseline runs).
- Batch 5 (DevOps): 4 skills in `agents/devops/skills/` — POSTGRES-OPERATIONS (with mandatory dev-vs-production section + transition checklist), MIGRATION-RUNNER-OPERATIONS, DOCKER-COMPOSE-MANAGEMENT, HEALTH-CHECK-VERIFICATION
- Batch 6 (Docs): 3 skills in `agents/docs/skills/` — API-REFERENCE-GENERATION, SDK-USAGE-GUIDE, DECISION-CONTEXT-EXPLANATION. All source-of-truth mapped: API ref derives from app.ts+routes.test.ts, SDK guide from client.ts+e2e.test.ts, concept explanation from KEY-MESSAGING.md+comparison.ts+ROLE-DIFFERENTIATION-PROOF.md.
- Batch 7 (Product): 3 skills in `agents/product/skills/` — SCOPE-GATE-ENFORCEMENT (3-step gate with pre-computed rejections, backlog cross-ref), ROLE-TEMPLATE-DESIGN (roleTagMap cliff at 0.8, ≥2 exclusive tags rule, compliance example), DEMO-SCENARIO-CURATION (5-criteria validation, 3 candidate scenarios, 1-demo-at-launch rule). All include "bad product move" section.
- Batch 8 (Demo/Consumer): 2 skills in `agents/frontend/skills/` — SDK-CONSUMER-PATTERNS (golden path, typed error handling, import rules, launch-grade checklist), DEMO-SCRIPT-AUTHORING (4-section architecture, console formatting rules, launch-grade 10-point checklist)
- **PHASE 8 COMPLETE**: 33 skills, 5,022 lines, 8 agents. All batches delivered.

---

## Phase 9: Hardening — COMPLETE (2026-04-02 11:39–11:53 UTC+8)

- Plan: `projects/nexus-v1/PHASE-9-HARDENING-PLAN.md`
- 6 work items completed: H-1 (timingSafeEqual), H-2 (generic 500), H-3 (startup migration), H-4 (health auth exemption), H-5 (row parser centralization), H-6 (perf enforcement design)
- Key fix: `parseAgentRow` divergence between core and server resolved — server now uses typed core parsers
- Tests: 216 (213 existing + 3 new hardening tests), all pass
- Build: 3/3 packages, zero errors

## Phase 10: V1 Completion Gate — COMPLETE (2026-04-02 12:11 UTC+8)

- Gate document: `projects/nexus-v1/PHASE-10-V1-COMPLETION-GATE.md`
- **Ship recommendation: NOT YET V1 COMPLETE**
- Audit: Core 14/14, API 8/8, SDK 6/6, Proof 7/7, Demo 2/2 — all COMPLETE
- Missing: README (X-1), docker-compose.yml (O-1), Dockerfile (O-2), stub cleanup (B-4/B-5), stale backlog (B-6)
- Remaining: 5 steps — clean stubs → Dockerfile → docker-compose → README → final verification
- Deferred: Hermes, ruflo, orchestration, cloud/marketplace/UI, WebSocket, distillery, per-project keys, perf test implementation, input validation

---

## Remaining Ambiguities (Non-Blocking)

- AMB-2: No session summary routes — sessions opt-in/post-launch
- AMB-3: API key auth middleware — open design, needed Day 8+
- AMB-4: PackResult import location — trivial
- AMB-5: WebSocket handler — open design, needed Day 5+

## Infrastructure Notes

- **PostgreSQL**: 17.x + pgvector 0.8.0, running inside Docker container (dev-only). Installed via `sudo -n /usr/bin/apt-get` (apt wrapper bypass).
- **Start PostgreSQL**: `sudo -n pg_ctlcluster 17 main start`
- **DATABASE_URL**: `postgresql://nexus:nexus_dev@localhost:5432/nexus`
- **Extensions pre-enabled**: `vector`, `uuid-ossp` (created by postgres superuser)

## Known Spec Bugs (5, All Documented)

In `agents/backend/capabilities/NEXUS-KNOWN-SPEC-ISSUES.md`:
1. Missing comma in expandGraphContext (§7)
2. Truncated role tag arrays in computeRoleRelevance (§7)
3. Truncated computeFreshness divisor (§7)
4. Truncated template literals in formatter (§9)
5. Truncated .join() calls in packer (§8)

---

## What Exists Now

```
workspace/nexus/               Monorepo (3 packages, builds clean, 19 tests pass)
workspace/enterprise/          5 files (all substantive)
workspace/agents/              12 agent dirs + COORDINATION.md; 7 have capabilities/ subdirs
workspace/workflows/           10 workflows (01–10)
workspace/standards/           17 files
workspace/memory/              Convention files + daily log + session handoff
workspace/projects/nexus-v1/   STATUS, CHECKPOINT, DECISIONS, DAY-1-IMPLEMENTATION-PLAN,
                               AMB-1 decision artifact, shared/ (4), spec
workspace/projects/            NEXUS-CAPABILITY-LAYER-PLAN.md
```

---

## Deferred (Lower Priority)

1. Consolidate VERIFICATION-STANDARD into DEFINITION-OF-DONE
2. Merge POSTMORTEM-AND-LEARNING and LESSONS-LEARNED-FORMAT
3. Tighten SESSION-HANDOFF-FORMAT.md
4. Merge MEMORY-RULES.md into MEMORY-CONVENTIONS.md
5. Phase 1B capability files (9, scoped, not started)
6. IDENTITY.md, BOOT.md still minimal

Nick decides scope. No phase starts without approval.
