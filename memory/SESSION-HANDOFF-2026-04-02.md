# Session Handoff — 2026-04-02

## Current State

**Nexus v1: COMPLETE.** All ship blockers closed. Core, API, SDK, proof layer, demo, docs, and operations packaging delivered.

**Current phase**: Post-v1. No active implementation phase.

## What Shipped

| Layer | Summary | Tests |
|-------|---------|-------|
| Core | Decision CRUD, edge CRUD, 5-signal scoring, context compiler pipeline, graph expansion, token budget packer, markdown/JSON formatters, change propagator, subscription management, migration runner, role templates, centralized row parsers | 150 |
| API | Hono REST API — all CRUD routes, compile endpoint, graph traversal, notifications, health (unauthenticated). Auth (timing-safe), generic 500 body, startup migration. | 29 |
| SDK | Full server surface coverage, NexusApiError, convenience helpers, seed demo, core type re-exports | 35 |
| Proof | Role-differentiation (11 assertions), scoring formula fidelity (43 tests), determinism, budget respect, graph monotonicity, 10 system invariants, THE scenario test (5 scenarios) | — |
| Demo | 4-section comparison script, seedSoftwareTeamDemo (6 agents, 10 decisions, 4 edges) | — |
| Docs | README.md (setup, architecture, API reference, SDK quickstart, scoring, config, dev setup), .env.example | — |
| Ops | Dockerfile (multi-stage, healthcheck), docker-compose.yml (app + pgvector/pg17) | — |
| Skills | 33 execution skills across 8 agents + 10 system invariants | — |

**Build**: 3/3 packages, zero errors
**Tests**: 214/214 pass (11 test files)

## Phases Completed

| Phase | Scope |
|-------|-------|
| 1–7 | Capability layer + Days 1–7 implementation |
| 8 | Skill layer (33 skills, 8 agents) |
| 9 | Hardening (SB-1–4 resolved, row parser centralization, PB-1 design) |
| 10 | V1 completion gate (audit, ship recommendation) |
| Ship closure | Stubs cleaned, Dockerfile, docker-compose, README, final verification |

## Key Decisions (Locked)

- AMB-1: Raw pg driver, no Supabase client
- Stack: TypeScript strict, Node.js 22, PG17 + pgvector, Hono, Vitest, Turborepo + pnpm
- PG17 + pgvector 0.8.0 inside container (dev-only)
- Start PG: `sudo -n pg_ctlcluster 17 main start`
- DATABASE_URL: `postgresql://nexus:nexus_dev@localhost:5432/nexus`

## Resolved Follow-Ups

| ID | Item | Resolved In |
|----|------|-------------|
| SB-1 | timingSafeEqual for auth key | Phase 9 (H-1) |
| SB-2 | Generic 500 body | Phase 9 (H-2) |
| SB-3 | Startup migration | Phase 9 (H-3) |
| SB-4 | Health auth exemption | Phase 9 (H-4) |

## Deferred (Not in V1)

| Item | Target Phase |
|------|-------------|
| Hermes integration | Post-v1: Platform Integration |
| ruflo integration | Post-v1: Platform Integration |
| Orchestration layer ("go build X") | Post-v1: Platform Layer |
| Cloud / marketplace / hosted service | Post-v1: Commercialization |
| UI / dashboard | Post-v1: Tooling |
| Per-project API keys / rate limiting | Post-v1: Production Hardening |
| WebSocket real-time push | Post-v1: Real-time |
| Conversation distillery | Post-v1: Intelligence Layer |
| PB-1 implementation (perf test file) | Post-v1: CI/CD |
| Input validation (lengths, bounds, enums) | Post-v1: Production Hardening |

## Repo State

```
nexus/                     — Monorepo root (Dockerfile, docker-compose.yml, README.md)
nexus/packages/core/       — types, roles, db (client, migrator, parsers), decision-graph, context-compiler, change-propagator
nexus/packages/sdk/        — NexusClient, NexusApiError, type re-exports
nexus/packages/server/     — Hono app, middleware (auth, errors, validate), startServer()
nexus/examples/            — software-team comparison demo
nexus/supabase/migrations/ — 001_initial_schema.sql
agents/*/skills/           — 33 execution skills (Phase 8)
agents/*/capabilities/     — 11 capability files (Phase 1A)
projects/nexus-v1/         — STATUS, CHECKPOINT, DECISIONS, gate docs, shared/
```

## Next-Step Options

Requires explicit operator approval:
1. **Presentation polish** — live demo recording, deck, walkthrough script
2. **OpenClaw operator workflow** — wire Nexus into Perlantir's own agent coordination
3. **Future integrations** — Hermes/ruflo protocol design, orchestration layer scoping
