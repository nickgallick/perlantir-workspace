# Nexus v1 — Capability Layer Plan

**Purpose:** Define every capability file that must exist before Nexus code is written, and the full execution phase structure through launch.

**Built against:** Complete 56-page spec (`projects/nexus-v1-spec.txt`) — all code, schema, types, algorithms, build order, testing strategy, and launch checklist.

---

## What Nexus Is

A TypeScript library + lightweight server that gives multi-agent systems structured project memory with zero handoff loss. Three components:

1. **Decision Graph** — directed graph of project decisions with typed relationships
2. **Context Compiler** — assembles the RIGHT context for the RIGHT agent for the RIGHT task, within a token budget (core innovation)
3. **Change Propagator** — when a decision changes, affected agents learn automatically with role-appropriate notifications

Tech: TypeScript strict, Hono server, PostgreSQL 16 + pgvector, OpenAI embeddings, Turborepo + pnpm monorepo, Docker self-hosting.

---

## Phase 1A — Pre-Execution Capability Layer

**What this is:** 12 agent capability files + 4 project templates that must exist before any Nexus code is written. These give each specialist the Nexus-specific decision frameworks, constraints, and rubrics they need to execute well — not generic process docs.

**Why it must come first:** Without these, agents will make spec-contradicting decisions, duplicate effort, or produce work that fails review gates. The spec is 56 pages of dense implementation detail — each agent needs a distilled, role-appropriate view.

### Agent Capability Files (12)

Each file lives at `agents/<agent>/capabilities/NEXUS.md`.

| # | Agent | File | What It Contains |
|---|-------|------|-----------------|
| 1 | **Architect** | `agents/architect/capabilities/NEXUS.md` | Architecture constraints from spec: monorepo structure, 3-package boundary (core/server/sdk), Supabase + pgvector data layer, Hono API, WebSocket propagation, embedding pipeline. Component dependency graph. Integration points. Decisions that are LOCKED (spec-defined) vs. open. |
| 2 | **Backend** | `agents/backend/capabilities/NEXUS.md` | Spec-to-code mapping: which spec sections produce which files. Implementation sequence aligned to 15-day build order. Known spec artifacts (truncated lines in role templates, missing comma in graph expansion). Coding patterns required (Supabase client, embedding calls, cosine similarity). |
| 3 | **Product** | `agents/product/capabilities/NEXUS.md` | v1 scope boundary: what's in (core lib, REST API, SDK, 8 role templates, Docker, comparison demo) vs. what's explicitly out (Python SDK, LangChain/CrewAI adapters, visual explorer, cloud hosted, RBAC, analytics, conversation distillery as default). Success criteria. Post-launch roadmap triggers. |
| 4 | **QA** | `agents/qa/capabilities/NEXUS.md` | Executable test plan from spec §20. Unit test file mapping. 5 scenario tests with specific assertions. Performance targets (100 decisions < 2s, cache hit < 100ms). Test infrastructure (Vitest, PostgreSQL test container). Coverage expectations. |
| 5 | **DevOps** | `agents/devops/capabilities/NEXUS.md` | Docker compose topology (nexus + postgres services). Dockerfile multi-stage build. Required env vars (OPENAI_API_KEY, POSTGRES_PASSWORD, optional ANTHROPIC_API_KEY). CI/CD: GitHub Actions for test-on-PR, publish-on-tag. npm package config (@nexus-ai/core, @nexus-ai/server, @nexus-ai/sdk). pgvector image requirement. |
| 6 | **Docs** | `agents/docs/capabilities/NEXUS.md` | Documentation deliverables: quickstart.md, concepts.md, context-compiler.md, decision-model.md, demo-walkthrough.md, CONTRIBUTING.md. README structure and key messaging lines (from spec §18). Audience: developers building multi-agent systems. |
| 7 | **GTM** | `agents/gtm/capabilities/NEXUS.md` | Launch timeline (Day 15 schedule). Content deliverables: blog post ("Why Multi-Agent Memory Is Broken"), tweet thread (8-10), HN post + first comment, Reddit drafts (r/LocalLLaMA, r/MachineLearning), LinkedIn. Key differentiators vs. Letta/Mem0/Zep/LangGraph. Reference: arxiv 2603.10062. |
| 8 | **Security** | `agents/security/capabilities/NEXUS.md` | Threat model scope: API key management (hashed storage, bearer auth), SQL injection surface (pgvector queries, RPC calls), rate limiting spec (middleware), input validation (decision/artifact payloads), WebSocket auth. Argon2id not in scope (mentioned in demo seed only). |
| 9 | **Frontend** | `agents/frontend/capabilities/NEXUS.md` | No UI in v1. Frontend owns demo UX: comparison script output format, terminal formatting, seed data presentation. Demo must clearly show baseline (vector) vs. Nexus (role-aware) difference. Examples directory structure. |
| 10 | **Design** | `agents/design/capabilities/NEXUS.md` | No visual UI in v1. Design scope limited to: README visual hierarchy, demo output formatting, comparison table layout, documentation information architecture. Post-launch: visual graph explorer (after 500+ stars). |
| 11 | **Analytics** | `agents/analytics/capabilities/NEXUS.md` | No analytics in v1. Scope: define success metrics for launch (GitHub stars, npm downloads, HN rank, demo completions). Post-launch trigger: analytics dashboard after enterprise request. |
| 12 | **Governor** | `agents/governor/capabilities/NEXUS.md` | Nexus-specific governance: phase gate criteria mapped to spec deliverables, approval checkpoints per build day, risk thresholds (core algorithm correctness = critical, demo polish = standard), escalation triggers (spec ambiguity, performance miss, scope creep). |

### Project Templates (4)

Each lives at `projects/nexus-v1/templates/`.

| # | Template | Purpose |
|---|----------|---------|
| 13 | `DECISION-RECORD.md` | Record Nexus implementation decisions. Fields: title, description, reasoning, alternatives rejected, affects (agents/components), tags, confidence, edges to related decisions. Mirrors the Decision type from the spec. |
| 14 | `PHASE-GATE.md` | Phase completion checklist. Maps to spec deliverables per build day. Includes: code complete, tests pass, spec compliance verified, no regressions, documentation updated. |
| 15 | `CODE-REVIEW.md` | Nexus-specific review rubric. Checks: spec compliance (does code match spec sections?), type safety (strict mode), embedding handling, Supabase query patterns, error handling, token estimation accuracy. |
| 16 | `TEST-SCENARIO.md` | Template for scenario test definition. Fields: setup (project + agents + decisions), action (compile/propagate/traverse), expected outcome (which agent gets what), verification method. |

### Phase 1A Deliverable

16 files total. All written from the spec — no guessing, no generic content. Each file is the distilled, role-appropriate view of what that agent needs to know about Nexus before touching code.

---

## Phase 1B — Project Instantiation

**What:** Populate the 5 standard project files from `.template/`.

| File | Content |
|------|---------|
| `projects/nexus-v1/BRIEF.md` | Project brief: what Nexus is, why it matters, success criteria, team composition, timeline |
| `projects/nexus-v1/PLAN.md` | Phased build plan mapped from spec §19 (15-day build order), with Perlantir governance gates |
| `projects/nexus-v1/CHECKPOINT.md` | First real checkpoint — initial state, no phases completed |
| `projects/nexus-v1/STATUS.md` | Current status tracker |
| `projects/nexus-v1/DECISIONS.md` | Decision log (starts empty, populated during execution) |

---

## Phase 2 — Week 1 Build: Core Proof (Days 1–5)

Nexus works locally. The core algorithm is proven.

| Day | Deliverable | Spec Sections | Key Files |
|-----|------------|---------------|-----------|
| 1 | **Setup** — Monorepo, types, roles, DB, embeddings | §2-4, §6, §13 | `types.ts`, `roles.ts`, `001_initial_schema.sql`, `relevance.ts` |
| 2 | **Decision Graph** — CRUD + edges + traversal | §4, §7 (graph parts) | `graph.ts`, `traversal.ts`, `queries.ts`, `decision-graph.test.ts` |
| 3 | **Scoring** — All 5 relevance signals | §7 (scoreDecisions) | `compiler.ts` (scoring), `context-compiler.test.ts` (scoring tests) |
| 4 | **Assembly** — Expand + pack + format + compile() | §7-9 | `compiler.ts` (full), `packer.ts`, `formatter.ts` |
| 5 | **Critical Test + Propagator** — THE scenario test, change propagation | §10, §20 | `scenario.test.ts`, `propagator.ts`, `subscriptions.ts`, `change-propagator.test.ts` |

**Phase 2 Gate:** `compile()` returns different context for different roles from the same project data. Change propagation generates role-appropriate notifications. All unit + scenario tests pass.

---

## Phase 3 — Week 2 Build: Demo + Server (Days 6–10)

Nexus is demoable via API.

| Day | Deliverable | Spec Sections | Key Files |
|-----|------------|---------------|-----------|
| 6 | **Seed + Demo** — seedSoftwareTeamDemo(), comparison script | §15 (seed), §17 | `comparison.ts`, SDK seed method |
| 7 | **Polish + Artifacts** — Tune weights, artifact CRUD | §7 (artifacts), §17 | Demo output review, artifact integration |
| 8 | **API Server** — All Hono routes | §14 | `app.ts`, all route files, `routes.test.ts` |
| 9 | **SDK** — NexusClient + convenience helpers | §15 | `client.ts`, `client.test.ts` |
| 10 | **Docker** — Compose + Dockerfile + one-command demo | §16 | `docker-compose.yml`, `Dockerfile`, `.env.example` |

**Phase 3 Gate:** `docker compose up -d && pnpm demo:compare` runs end-to-end. All API endpoints work. SDK tests pass.

---

## Phase 4 — Week 3 Polish + Ship (Days 11–15)

Nexus goes public.

| Day | Deliverable | Spec Sections | Key Files |
|-----|------------|---------------|-----------|
| 11 | **README** — Full README with demo screenshots, comparison table | §18 | `README.md` |
| 12 | **Docs** — 5 documentation files | §18 | `docs/*.md`, `CONTRIBUTING.md` |
| 13 | **CI/CD + Packaging** — GitHub Actions, npm config, final test pass | §19 (Day 13) | `.github/workflows/`, `LICENSE` |
| 14 | **Launch Content** — Blog, tweets, HN, Reddit, LinkedIn | §19 (Day 14) | Launch content files |
| 15 | **LAUNCH** — Push public, publish npm, post everywhere | §21 | Everything |

**Phase 4 Gate:** Full launch checklist from spec §21 — all items checked.

---

## Recommendation

**Approve Phase 1A only.** 16 files. No code. No external actions. Pure preparation that de-risks everything after it.

Phase 1A can be built without any external dependencies — it's distillation of the spec into agent-consumable capability files. Everything after Phase 1A requires Phase 1A to exist.

---

## What This Plan Does NOT Include

- Generic capability files (every file is Nexus-specific)
- Premature repo cloning or npm setup
- Stack research or evaluation (spec already decided the stack)
- Capability files for agents with zero Nexus scope (all 12 have defined scope, even if minimal)
