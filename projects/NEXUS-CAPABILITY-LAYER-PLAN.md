# Nexus v1 — Elite Capability Layer Planning Pass

**Date:** 2026-04-01  
**Status:** Plan only — no files modified. Awaiting approval.  
**Source of truth:** `projects/nexus-v1-spec.txt` (56 pages, complete) + `TOOLS.md` (runtime inventory)

---

## Overview

Each priority agent currently has one file: AGENT.md. These define role, authority, inputs, outputs, quality bar, decision rules, escalation triggers, and governing standards. They are excellent governance scaffolding. They are **zero** percent Nexus-ready.

The gap is not process — it's knowledge. No agent knows what Nexus is, what the spec says, what the code looks like, what the constraints are, or what decisions are already locked. Without a capability layer, every agent will:

- Ask questions the spec already answers (token waste)
- Make decisions the spec already made (conflict)
- Produce generic output instead of spec-aligned output (mediocre quality)
- Fail review gates because they didn't know the standard (rework)

This plan closes those gaps for 8 agents across 6 dimensions.

---

# AGENT-BY-AGENT ANALYSIS

---

## 1. ARCHITECT

### 1.1 Mission-Critical Gaps

Architect currently knows nothing about:
- The 3-package monorepo structure (core/server/sdk) and why it's designed that way
- The Supabase + pgvector data layer and the 9-table schema
- The recursive graph traversal function and its performance implications
- The embedding pipeline (OpenAI text-embedding-3-small, 1536 dimensions)
- The Context Compiler's 12-step algorithm and how it drives the entire system
- What decisions are LOCKED by the spec vs. what architectural choices remain open
- The Hono + WebSocket real-time propagation topology
- The Docker compose service topology (nexus service → postgres with pgvector)

Without this, Architect will try to "design" things the spec already designed. Or worse, propose alternatives that contradict locked decisions.

**Critical risk:** Architect proposing architectural changes to spec-locked decisions wastes phases and creates governance friction.

### 1.2 Internal Capability Assets

| Asset | Type | Purpose | Why It Matters | Timing |
|-------|------|---------|---------------|--------|
| `NEXUS-ARCHITECTURE-BRIEF.md` | Implementation guide | Distilled architecture from spec: component map, data flows, service boundaries, locked decisions, open decisions | Architect can immediately identify what's fixed vs. what needs design work | Pre-project critical |
| `NEXUS-LOCKED-DECISIONS.md` | Decision framework | Explicit list of every architectural decision the spec makes with rationale. Tagged: LOCKED (no change without operator override) vs. OPEN (Architect may propose) | Prevents wasted effort challenging decided things | Pre-project critical |
| `NEXUS-COMPONENT-DEPENDENCY-MAP.md` | Reference | Which spec component depends on which other. Build order constraints. What can be parallelized vs. what's sequential | Enables correct phase planning and prevents blocked-dependency surprises | Pre-project critical |
| `NEXUS-INTEGRATION-POINTS.md` | Implementation guide | External dependencies (Supabase client, OpenAI embeddings API, WebSocket protocol), their behavior contracts, error modes, rate limits | Prevents naive integration that breaks under real conditions | Phase 1B |

### 1.3 Knowledge Base / Reference Layer

| Resource | Type | Classification |
|----------|------|---------------|
| Supabase JS client docs (https://supabase.com/docs/reference/javascript/) | Official docs | Document reference URL before start; no need to clone |
| pgvector documentation (https://github.com/pgvector/pgvector) | Official docs | Document reference URL; key behavior: IVFFlat index, cosine distance ops |
| Hono framework docs (https://hono.dev/) | Official docs | Document reference URL; agent needs routing patterns, middleware, error handling |
| PostgreSQL 16 recursive CTE docs | Official docs | Document reference URL; critical for understanding `get_connected_decisions` |
| Turborepo monorepo docs (https://turbo.build/repo/docs) | Official docs | Document reference URL; workspace structure, task pipeline, caching |

**Strategy:** Reference URLs in capability files. Do not clone repos. Agent can fetch docs at execution time if needed.

### 1.4 Tools / Runtime Leverage

- **No Docker CLI** inside container → Architect must design for "docker compose tested externally" or accept that Docker compose validation happens at deployment, not during dev
- **No DB client CLIs** → All schema verification must happen through Node.js drivers or test suites, not psql commands
- **grep -r only** (no ripgrep) → Architecture docs must use precise file paths, not assume agents can quickly search the codebase
- **pnpm via corepack** → Turborepo + pnpm workspace is the monorepo tool. Architect must specify pnpm workspace config, not npm workspaces

### 1.5 Preferred Patterns and Anti-Patterns

**Excellent looks like:**
- Architecture brief that maps 1:1 to spec sections with no creative reinterpretation of locked decisions
- Clear articulation of what's open (caching strategy details, error retry policies, connection pooling) vs. what's closed (Hono, Supabase, pgvector, 3-package split)
- Dependency map that Backend can use to plan implementation order without asking

**Anti-patterns:**
- Proposing alternative databases or frameworks ("have we considered Drizzle instead of Supabase?") — spec is locked
- Over-designing things the spec already has complete code for (the compiler algorithm, the packer, the formatter)
- Under-specifying the integration contracts (embedding API failure modes, Supabase connection limits)
- Producing generic architecture docs that don't reference specific spec sections

### 1.6 Evaluation Layer

**Rubric for Architect output on Nexus:**
- Does it acknowledge all locked decisions without attempting to override?
- Does it correctly identify remaining open architectural decisions?
- Does the dependency map match the actual spec's build order?
- Can Backend read the architecture brief and know exactly what to build first without asking?
- Are integration points specified with error modes, not just happy paths?

**Required evidence:** Architecture brief cross-referenced against spec section numbers.

---

## 2. BACKEND

### 2.1 Mission-Critical Gaps

Backend is the heaviest-lift agent for Nexus. It currently knows nothing about:
- The complete TypeScript type system (30+ interfaces/types in `types.ts`)
- The Context Compiler algorithm (12 steps, 5 scoring signals with specific weights: 0.4 direct affect, 0.2 tag matching, 0.15 role relevance, 0.25 semantic similarity)
- The graph expansion with depth decay (0.6^depth)
- The Token Budget Packer allocation (10% notifications, 55% decisions, 30% artifacts, 5% sessions with overflow)
- The Change Propagator lifecycle (create → supersede → revert, with role-specific notification text)
- The specific Supabase query patterns used throughout (`.from().select().eq().single()`, `.rpc()`, `.upsert()`)
- The embedding pipeline: when to embed (decision creation, artifact creation), what text to embed, model used
- Known spec issues: truncated lines in role template code, missing comma in graph expansion object literal
- The Hono route structure (13+ routes across 6 route files)
- The `estimateTokens()` heuristic (chars / 4)

Without this, Backend will either blindly copy spec code (missing the bugs) or reimplement from scratch (wasting time and diverging from spec).

**Critical risk:** The spec has at least 2 syntax bugs in the code listings (truncated lines in role weights, missing comma in `expandGraphContext` object literal). Backend must know these exist before implementation, not discover them during debugging.

### 2.2 Internal Capability Assets

| Asset | Type | Purpose | Why It Matters | Timing |
|-------|------|---------|---------------|--------|
| `NEXUS-SPEC-TO-CODE-MAP.md` | Implementation guide | Maps every spec section → exact output file(s) with line-count estimates and dependency order | Backend knows exactly what to build, in what order, without guessing | Pre-project critical |
| `NEXUS-KNOWN-SPEC-ISSUES.md` | Anti-pattern catalog | Documents every known bug, truncation, ambiguity, or inconsistency in the spec's code listings | Prevents debugging sessions for known issues; Backend fixes proactively | Pre-project critical |
| `NEXUS-IMPLEMENTATION-PATTERNS.md` | Implementation guide | Canonical patterns for: Supabase client usage, embedding calls, cosine similarity, error handling, type narrowing, test setup/teardown | Backend writes consistent, spec-aligned code from the start | Pre-project critical |
| `NEXUS-ALGORITHM-REFERENCE.md` | Reference | The Context Compiler scoring formula with worked examples. Input: decisions + agent profile + task embedding → output: scored, packed, formatted context package. Step-by-step with concrete numbers | Backend understands the algorithm deeply enough to implement correctly AND debug edge cases | Pre-project critical |
| `NEXUS-TEST-FIXTURES.md` | Starter asset | Pre-defined test data: 3 agents (builder/reviewer/launch), 10 decisions with known scores, expected compiler output for each agent. Ready to paste into test files | Tests are meaningful from day 1, not "assert true === true" placeholders | Phase 1B |
| `NEXUS-DATABASE-OPERATIONS.md` | Implementation guide | Every database operation in the spec: which table, what query pattern, which indexes matter, what the RPC function does, migration strategy | Backend doesn't invent query patterns; uses the ones the schema was designed for | Phase 1B |

### 2.3 Knowledge Base / Reference Layer

| Resource | Type | Classification |
|----------|------|---------------|
| Supabase JS client v2 docs | Official docs | Document reference URL before start |
| pgvector usage patterns (nearest-neighbor queries, index tuning) | Technical reference | Document reference URL; key for embedding queries |
| Hono v4 API reference (routing, middleware, context, error handling) | Official docs | Document reference URL before start |
| Vitest docs (test lifecycle, mocking, assertions) | Official docs | Document reference URL before start |
| TypeScript strict mode behavior (strict null checks, type narrowing) | Official docs | Document reference URL; Backend must write strict-mode compliant code |
| OpenAI Embeddings API reference (rate limits, dimensions, error codes) | Official docs | Document reference URL; Backend calls this for every decision/artifact creation |

**Strategy:** URLs in capability files. Backend should be able to look up any of these mid-implementation without a research phase.

### 2.4 Tools / Runtime Leverage

- **Node 22.22.2** → Supports all modern TypeScript/ESM features. No need for Babel or legacy transforms
- **No global TypeScript** → Must `pnpm add -D typescript` in workspace root. This is in the spec's setup (Day 1)
- **No DB client CLIs** → Schema verification via Vitest integration tests, not psql. Test containers or Supabase local dev
- **corepack for pnpm** → `corepack enable && corepack prepare pnpm@latest --activate` must be first setup step
- **No Docker-in-Docker** → Cannot test docker compose from inside container. Backend develops against a running Postgres (either external or network-accessible). Tests need a real Postgres with pgvector, not SQLite mocks
- **grep -r for search** → When searching codebase during development, expect slower results. Keep file naming extremely clear to minimize search needs

### 2.5 Preferred Patterns and Anti-Patterns

**Excellent looks like:**
- Code that matches spec structure exactly (same file names, same function signatures, same class names)
- Spec bugs fixed with inline comments explaining the fix and referencing the spec issue
- Embedding calls wrapped in a single utility with retry logic and error handling (not raw fetch scattered across files)
- Test files that prove the core claim: same project, different roles → different context
- Type-safe Supabase client usage (no `as any` escapes)

**Anti-patterns:**
- **Reinterpreting the spec** — "I think a better approach would be..." unless it's a genuine bug fix
- **Mock-heavy tests** — The scenario tests MUST hit a real database with pgvector. Mocking defeats the purpose
- **Ignoring token budget math** — The packer's allocation percentages are specific. Don't eyeball them
- **Skipping graph expansion tests** — The recursive CTE + depth decay is the most complex piece. Must be tested with real multi-hop graphs
- **Generic error messages** — "Something went wrong" is unacceptable. Error messages must identify which operation failed and why
- **Premature optimization** — Don't optimize the embedding pipeline before proving the algorithm works correctly

### 2.6 Evaluation Layer

**Rubric for Backend output on Nexus:**
- Does the code match spec file structure exactly?
- Do type definitions match `types.ts` from spec §5?
- Does the scoring algorithm produce correct weights (0.4/0.2/0.15/0.25)?
- Does graph expansion use 0.6^depth decay?
- Does the packer respect 10/55/30/5 allocation?
- Do tests prove the core claim (different roles → different context from same data)?
- Are known spec bugs fixed with documented reasoning?
- Does the API server expose all routes from spec §14?
- Do error responses include actionable information?

**Required evidence:** Test output showing two agents getting materially different context packages from the same project data. This is the single most important verification.

---

## 3. PRODUCT

### 3.1 Mission-Critical Gaps

Product needs to know:
- What's in v1 vs. what's explicitly deferred (Python SDK, adapters, visual explorer, cloud, RBAC, analytics, distillery-as-default)
- The post-launch roadmap triggers (Python SDK at 10+ requests, visual explorer at 500+ stars, cloud at 1000+ stars)
- The competitive differentiation vs. Letta/Mem0/Zep/LangGraph (single-agent memory vs. multi-agent coordination)
- The success metrics that matter at launch
- The 15-day build timeline and what's at risk if days slip

**Critical risk:** Product expanding scope beyond v1 boundaries or accepting feature requests that break the timeline.

### 3.2 Internal Capability Assets

| Asset | Type | Purpose | Timing |
|-------|------|---------|--------|
| `NEXUS-SCOPE-BOUNDARY.md` | Decision framework | Explicit in/out list for v1. Every "NOT in v1" item from spec with the reason and trigger for inclusion. Product uses this to reject scope creep instantly | Pre-project critical |
| `NEXUS-SUCCESS-CRITERIA.md` | Rubric | Measurable launch success: what GitHub stars / npm downloads / HN rank / demo completions would indicate success. Ties to post-launch roadmap triggers | Pre-project critical |
| `NEXUS-COMPETITIVE-POSITIONING.md` | Reference | How Nexus differs from every named competitor. What claims we can make. What we can't. Evidence for each claim | Phase 1B |

### 3.3 Knowledge Base / Reference Layer

| Resource | Classification |
|----------|---------------|
| Letta (formerly MemGPT) — what it does, where it falls short for multi-agent | Document URL now, deep-dive deferred |
| Mem0 — shared memory layer, single-agent focus | Document URL now |
| Zep — long-term memory for assistants | Document URL now |
| LangGraph — stateful multi-actor orchestration | Document URL now |
| arxiv 2603.10062 (March 2026 position paper referenced in spec §19 Day 14) | Must locate and document before launch content phase |

### 3.4 Preferred Patterns and Anti-Patterns

**Excellent:** Scope questions answered in under 30 seconds by referencing the boundary doc. Competitive claims backed by specific technical differences, not marketing fluff.

**Anti-patterns:**
- "Let's also add X since we're already building Y" — scope creep
- Vague success criteria ("lots of stars")
- Competitive positioning that claims Nexus does things it doesn't in v1

### 3.5 Evaluation Layer

**Rubric:** Can Product answer "is this in v1?" for any proposed feature within one lookup? Are success criteria measurable and time-bound? Is competitive positioning defensible with spec evidence?

---

## 4. DEVOPS

### 4.1 Mission-Critical Gaps

- Docker compose topology is defined in spec (nexus + postgres services) but DevOps doesn't know it
- Dockerfile is multi-stage (builder + runner) — specific to Turborepo + pnpm build
- pgvector/pgvector:pg16 is a specific image requirement (not standard postgres)
- Health check pattern (pg_isready)
- **Runtime constraint:** No Docker-in-Docker. DevOps cannot test docker compose from inside this container. Must plan for external validation or accept compose is tested at deploy time
- CI/CD: GitHub Actions for test-on-PR, publish-on-tag with @nexus-ai scoped npm packages
- Environment variables: which are required (OPENAI_API_KEY, POSTGRES_PASSWORD), which are optional (ANTHROPIC_API_KEY, PORT, NEXUS_API_KEY)

### 4.2 Internal Capability Assets

| Asset | Type | Purpose | Timing |
|-------|------|---------|--------|
| `NEXUS-INFRASTRUCTURE-SPEC.md` | Implementation guide | Docker compose, Dockerfile, env vars, service topology, health checks, volume mounts — all from spec §16 | Pre-project critical |
| `NEXUS-CI-CD-PLAN.md` | Playbook | GitHub Actions workflow specs, npm publish pipeline, test matrix, pgvector test container setup | Phase 1B |
| `NEXUS-RUNTIME-CONSTRAINTS.md` | Anti-pattern catalog | What DevOps CANNOT do from inside this container (no Docker-in-Docker, no kubectl). How to work around each constraint | Pre-project critical |

### 4.3 Knowledge Base / Reference Layer

| Resource | Classification |
|----------|---------------|
| pgvector Docker image docs | Document URL before start |
| GitHub Actions docs for pnpm + Turborepo monorepos | Document URL before start |
| npm publish scoped packages (@nexus-ai/*) | Document URL before start |

### 4.4 Tools / Runtime Leverage

- **corepack** is available → use it to enable pnpm without global install
- **No Docker CLI** → compose files are written and tested externally. DevOps defines the specs; validation is a deploy-time gate
- **Git available** → GitHub Actions workflow files can be created and committed
- **Make available** → Can create Makefile for common dev tasks (setup, test, build, clean)

### 4.5 Preferred Patterns and Anti-Patterns

**Excellent:** Infrastructure specs that match the spec exactly. CI pipeline that catches pgvector-dependent test failures (not just TypeScript compilation).

**Anti-patterns:**
- SQLite test database instead of real pgvector Postgres (tests will pass but miss vector query bugs)
- Docker compose that doesn't wait for Postgres health before starting nexus service
- CI that doesn't test with real embeddings (mocked embeddings hide dimension mismatches)

### 4.6 Evaluation Layer

**Rubric:** Does `docker compose up -d` produce a working system with healthy Postgres? Does CI catch real failures? Are all env vars documented with required/optional classification?

---

## 5. SECURITY

### 5.1 Mission-Critical Gaps

- API key management: hashed storage in `api_keys` table, bearer auth in middleware
- SQL injection surface: Supabase client parameterizes by default, but RPC calls (`get_connected_decisions`) need review
- Rate limiting: spec mentions middleware but doesn't fully implement it
- Input validation: decision/artifact payloads accept JSONB metadata and text arrays — injection surface
- WebSocket authentication: spec doesn't specify how WS connections are authenticated
- Embedding API key exposure: OpenAI API key is used server-side for every decision/artifact creation
- **What's NOT a security concern for v1:** Argon2id is in the demo seed data only (fake auth scenario), not in actual Nexus code. RBAC is post-launch. No user-facing auth flow exists in v1

### 5.2 Internal Capability Assets

| Asset | Type | Purpose | Timing |
|-------|------|---------|--------|
| `NEXUS-THREAT-MODEL.md` | Implementation guide | Nexus-specific threat surface: API endpoints, WebSocket, database, embedding pipeline. What's attackable, what's not, what needs hardening vs. what's fine for v1 | Pre-project critical |
| `NEXUS-INPUT-VALIDATION-SPEC.md` | Checklist | Every API endpoint with its input fields, what validation is needed, what injection vectors exist. Security signs off on this before Backend implements routes | Pre-project critical |
| `NEXUS-SECURITY-REVIEW-CHECKLIST.md` | Review guide | What Security checks before each phase gate: API key handling, query parameterization, error message leakage, rate limiting, CORS config | Phase 1B |

### 5.3 Knowledge Base / Reference Layer

| Resource | Classification |
|----------|---------------|
| Supabase security model (RLS, service key vs. anon key) | Document URL before start — critical for understanding trust boundaries |
| Hono security middleware (CORS, rate limiting, helmet equivalent) | Document URL before start |
| OWASP API Security Top 10 (2023) | Document URL as reference standard |

### 5.4 Preferred Patterns and Anti-Patterns

**Excellent:** Threat model scoped to v1 reality (not enterprise paranoia). Input validation specs that Backend can implement directly without interpretation.

**Anti-patterns:**
- Generic OWASP checklist that doesn't address Nexus-specific surfaces
- Demanding RBAC/audit/compliance features that are explicitly post-launch
- Treating the service key as if it's user-facing (it's server-side only in v1)
- Blocking launch over theoretical threats with no realistic attack vector for a self-hosted tool

### 5.5 Evaluation Layer

**Rubric:** Does the threat model identify real v1 attack surfaces (not generic web app threats)? Are input validation specs specific enough for Backend to implement without asking follow-up questions? Is Security distinguishing between "fix before launch" and "address post-launch"?

---

## 6. QA

### 6.1 Mission-Critical Gaps

- The testing strategy from spec §20 is detailed but QA doesn't know it
- Unit test file mapping (5 test files, specific assertions)
- The 5 scenario tests and their exact verification criteria
- Performance targets: 100 decisions compile in <2s, cache hit in <100ms
- The single most important test: same project, two agents → materially different context packages
- Test infrastructure: Vitest, real PostgreSQL with pgvector (not SQLite mocks), real or stubbed embeddings
- **Runtime constraint:** No Docker-in-Docker means test database must be either external or started via Node.js test setup

### 6.2 Internal Capability Assets

| Asset | Type | Purpose | Timing |
|-------|------|---------|--------|
| `NEXUS-TEST-PLAN.md` | Playbook | Complete test plan from spec §20, expanded with: test data setup, assertion specifics, infrastructure requirements, execution order | Pre-project critical |
| `NEXUS-SCENARIO-DEFINITIONS.md` | Template/starter asset | All 5 scenario tests fully specified: setup data, action, expected output with concrete numbers (e.g., "builder gets decisions A, C, E; reviewer gets A, B, D") | Pre-project critical |
| `NEXUS-PERFORMANCE-BASELINE.md` | Rubric | Performance targets with measurement methodology: how to time compilation, what counts as "100 decisions", how to measure cache hit latency | Phase 1B |

### 6.3 Knowledge Base / Reference Layer

| Resource | Classification |
|----------|---------------|
| Vitest docs (especially: test lifecycle, setup/teardown, database integration) | Document URL before start |
| testcontainers-node (for spinning up pgvector Postgres in tests) | Evaluate before start — may solve the "no Docker-in-Docker" problem if tests run in CI, not inside this container |
| pgvector test patterns | Document URL if good examples exist |

### 6.4 Preferred Patterns and Anti-Patterns

**Excellent:** Scenario tests that prove the core product claim with real data. Performance tests that measure what matters (compile latency, not HTTP overhead).

**Anti-patterns:**
- Mocking the database (defeats the purpose — vector queries and recursive CTEs must hit real pgvector)
- Testing only happy paths (the compiler must handle: 0 decisions, 500 decisions, superseded-only decisions, no embeddings)
- Snapshot tests for formatted output (brittle; test structure and scores instead)
- Treating performance targets as aspirational instead of as pass/fail gates

### 6.5 Evaluation Layer

**Rubric:** Do tests prove the core claim? Do scenario tests use realistic data? Is the test infrastructure documented well enough that Backend can run tests without asking QA how? Are performance targets tested, not just documented?

---

## 7. DOCS

### 7.1 Mission-Critical Gaps

- 5 documentation deliverables specified in spec (quickstart, concepts, context-compiler, decision-model, demo-walkthrough)
- README structure and key messaging lines (spec §18)
- CONTRIBUTING.md requirements
- Audience: developers building multi-agent systems (technical, likely experienced with LangChain/CrewAI/similar)
- The demo walkthrough must explain WHY the output is different per role, not just show it

### 7.2 Internal Capability Assets

| Asset | Type | Purpose | Timing |
|-------|------|---------|--------|
| `NEXUS-DOCS-PLAN.md` | Playbook | Each deliverable with: audience, structure, key messages, length target, what to emphasize, what to skip | Pre-project critical |
| `NEXUS-KEY-MESSAGING.md` | Reference | The exact phrases from spec §18 that must appear in README and docs. Headline, subhead, demo message, differentiation line. Non-negotiable messaging | Pre-project critical |

### 7.3 Knowledge Base / Reference Layer

| Resource | Classification |
|----------|---------------|
| Best-in-class open source READMEs (Hono, tRPC, Drizzle) as structural references | Document URLs; don't clone |
| "Readme Driven Development" (Tom Preston-Werner) | Reference for README-first quality bar |

### 7.4 Preferred Patterns and Anti-Patterns

**Excellent:** Quickstart that gets to first `compile()` call in under 5 minutes. Concepts doc that a LangChain user can grok in 10 minutes. Demo walkthrough that builds conviction, not just comprehension.

**Anti-patterns:**
- Auto-generated API docs with no narrative
- Quickstart that requires 20 minutes of setup before anything interesting happens
- Concepts doc that explains graph theory instead of "here's why your agents get different context"
- Demo walkthrough that just shows output without explaining significance

### 7.5 Evaluation Layer

**Rubric:** Can a developer go from zero to running the demo in under 10 minutes using only the docs? Does the README make the value proposition clear in 30 seconds? Does each doc serve a distinct purpose (no duplication)?

---

## 8. FRONTEND

### 8.1 Mission-Critical Gaps

Frontend's scope on Nexus v1 is minimal — no UI. But it's not zero:
- The comparison demo (`examples/software-team/comparison.ts`) is the primary user-facing artifact
- Terminal output formatting must be compelling — this IS the sales pitch
- The demo must clearly show baseline (same results for every agent) vs. Nexus (different context per role)
- The seed data must be realistic enough to be convincing

### 8.2 Internal Capability Assets

| Asset | Type | Purpose | Timing |
|-------|------|---------|--------|
| `NEXUS-DEMO-UX-SPEC.md` | Implementation guide | Demo output structure, terminal formatting, section headers, what to show vs. hide, timing of output. The demo is the product pitch — Frontend treats it like UI | Phase 1B |

### 8.3 Preferred Patterns and Anti-Patterns

**Excellent:** Demo output that a developer screenshots and shares on Twitter. Clear visual separation between baseline and Nexus sections.

**Anti-patterns:**
- Wall of unformatted JSON
- No clear "before vs. after" structure
- Demo that takes more than 30 seconds to run

---

# SHARED CAPABILITY FOUNDATION

Files that live outside individual agent folders, serving multiple agents.

## Shared Nexus-Wide Files

| File | Location | Purpose | Serves |
|------|----------|---------|--------|
| `NEXUS-ARCHITECTURE-GLOSSARY.md` | `projects/nexus-v1/shared/` | Canonical definitions: Decision Graph, Context Compiler, Change Propagator, Relevance Profile, Token Budget Packer, Scored Decision, Context Package, Role Template, Edge Relationship, Freshness Score. Every agent uses the same terms the same way | All agents |
| `NEXUS-SPEC-INDEX.md` | `projects/nexus-v1/shared/` | Quick-reference index mapping concepts to spec sections. "Where is the packer?" → §8. "Where are the routes?" → §14. Prevents agents from searching the 56-page spec | All agents |
| `NEXUS-IMPLEMENTATION-CONSTRAINTS.md` | `projects/nexus-v1/shared/` | Runtime constraints from TOOLS.md applied to Nexus: no Docker-in-Docker, no DB CLIs, TypeScript must be project-local, pnpm via corepack, grep-only search. Every agent reads this once | All agents |
| `NEXUS-SUCCESS-RUBRIC.md` | `projects/nexus-v1/shared/` | The 5 things that must be true for Nexus to launch: (1) different roles get different context, (2) change propagation works, (3) demo is compelling, (4) docs are clear, (5) one-command setup works | All agents |

---

# DIRECTORY STRUCTURE

```
projects/nexus-v1/
├── shared/                              # Cross-agent Nexus capability files
│   ├── NEXUS-ARCHITECTURE-GLOSSARY.md
│   ├── NEXUS-SPEC-INDEX.md
│   ├── NEXUS-IMPLEMENTATION-CONSTRAINTS.md
│   └── NEXUS-SUCCESS-RUBRIC.md
├── nexus-v1-spec.txt                    # The spec (already exists at projects/ level; move here)
├── BRIEF.md                             # (Phase 1B — project instantiation)
├── PLAN.md                              # (Phase 1B)
├── CHECKPOINT.md                        # (Phase 1B)
├── STATUS.md                            # (Phase 1B)
└── DECISIONS.md                         # (Phase 1B)

agents/
├── architect/
│   ├── AGENT.md                         # (exists)
│   └── capabilities/
│       ├── NEXUS-ARCHITECTURE-BRIEF.md
│       ├── NEXUS-LOCKED-DECISIONS.md
│       └── NEXUS-COMPONENT-DEPENDENCY-MAP.md
├── backend/
│   ├── AGENT.md                         # (exists)
│   └── capabilities/
│       ├── NEXUS-SPEC-TO-CODE-MAP.md
│       ├── NEXUS-KNOWN-SPEC-ISSUES.md
│       ├── NEXUS-IMPLEMENTATION-PATTERNS.md
│       └── NEXUS-ALGORITHM-REFERENCE.md
├── product/
│   ├── AGENT.md                         # (exists)
│   └── capabilities/
│       ├── NEXUS-SCOPE-BOUNDARY.md
│       └── NEXUS-SUCCESS-CRITERIA.md
├── devops/
│   ├── AGENT.md                         # (exists)
│   └── capabilities/
│       ├── NEXUS-INFRASTRUCTURE-SPEC.md
│       └── NEXUS-RUNTIME-CONSTRAINTS.md
├── security/
│   ├── AGENT.md                         # (exists)
│   └── capabilities/
│       ├── NEXUS-THREAT-MODEL.md
│       └── NEXUS-INPUT-VALIDATION-SPEC.md
├── qa/
│   ├── AGENT.md                         # (exists)
│   └── capabilities/
│       ├── NEXUS-TEST-PLAN.md
│       └── NEXUS-SCENARIO-DEFINITIONS.md
├── docs/
│   ├── AGENT.md                         # (exists)
│   └── capabilities/
│       ├── NEXUS-DOCS-PLAN.md
│       └── NEXUS-KEY-MESSAGING.md
└── frontend/
    ├── AGENT.md                         # (exists)
    └── capabilities/
        └── (Phase 1B: NEXUS-DEMO-UX-SPEC.md)
```

---

# PHASED EXECUTION

## Phase 1A — Pre-Project Critical (Approve This Only)

**20 files total: 4 shared + 16 agent capability files**

Must exist before any Nexus execution begins. Highest leverage: prevents the most token waste, rework, spec-contradiction, and governance friction.

### Shared (4 files)
1. `projects/nexus-v1/shared/NEXUS-ARCHITECTURE-GLOSSARY.md`
2. `projects/nexus-v1/shared/NEXUS-SPEC-INDEX.md`
3. `projects/nexus-v1/shared/NEXUS-IMPLEMENTATION-CONSTRAINTS.md`
4. `projects/nexus-v1/shared/NEXUS-SUCCESS-RUBRIC.md`

### Architect (3 files)
5. `agents/architect/capabilities/NEXUS-ARCHITECTURE-BRIEF.md`
6. `agents/architect/capabilities/NEXUS-LOCKED-DECISIONS.md`
7. `agents/architect/capabilities/NEXUS-COMPONENT-DEPENDENCY-MAP.md`

### Backend (4 files)
8. `agents/backend/capabilities/NEXUS-SPEC-TO-CODE-MAP.md`
9. `agents/backend/capabilities/NEXUS-KNOWN-SPEC-ISSUES.md`
10. `agents/backend/capabilities/NEXUS-IMPLEMENTATION-PATTERNS.md`
11. `agents/backend/capabilities/NEXUS-ALGORITHM-REFERENCE.md`

### Product (2 files)
12. `agents/product/capabilities/NEXUS-SCOPE-BOUNDARY.md`
13. `agents/product/capabilities/NEXUS-SUCCESS-CRITERIA.md`

### DevOps (2 files)
14. `agents/devops/capabilities/NEXUS-INFRASTRUCTURE-SPEC.md`
15. `agents/devops/capabilities/NEXUS-RUNTIME-CONSTRAINTS.md`

### Security (2 files)
16. `agents/security/capabilities/NEXUS-THREAT-MODEL.md`
17. `agents/security/capabilities/NEXUS-INPUT-VALIDATION-SPEC.md`

### QA (2 files)
18. `agents/qa/capabilities/NEXUS-TEST-PLAN.md`
19. `agents/qa/capabilities/NEXUS-SCENARIO-DEFINITIONS.md`

### Docs (1 file)
20. `agents/docs/capabilities/NEXUS-KEY-MESSAGING.md`

---

## Phase 1B — Pre-Implementation (After 1A, Before Major Code)

**9 files**

Still needed before major implementation, but can be built after 1A establishes the foundation.

### Architect (1 file)
- `agents/architect/capabilities/NEXUS-INTEGRATION-POINTS.md`

### Backend (2 files)
- `agents/backend/capabilities/NEXUS-TEST-FIXTURES.md`
- `agents/backend/capabilities/NEXUS-DATABASE-OPERATIONS.md`

### Product (1 file)
- `agents/product/capabilities/NEXUS-COMPETITIVE-POSITIONING.md`

### DevOps (1 file)
- `agents/devops/capabilities/NEXUS-CI-CD-PLAN.md`

### Security (1 file)
- `agents/security/capabilities/NEXUS-SECURITY-REVIEW-CHECKLIST.md`

### QA (1 file)
- `agents/qa/capabilities/NEXUS-PERFORMANCE-BASELINE.md`

### Docs (1 file)
- `agents/docs/capabilities/NEXUS-DOCS-PLAN.md`

### Frontend (1 file)
- `agents/frontend/capabilities/NEXUS-DEMO-UX-SPEC.md`

---

## Phase 1C — Deferred / Post-Implementation

Built during or after Nexus execution, when practical experience reveals what's actually needed:

- **Post-launch competitive analysis** — compare actual Nexus output to actual competitor output, not marketing claims
- **Operational runbook** — after the system exists and DevOps has real operational experience
- **Performance tuning guide** — after baseline performance is measured, not before
- **Adapter integration guides** — only if/when Python SDK, LangChain, CrewAI adapters are built
- **Detailed API reference** — auto-generated from running server, not hand-written before routes are finalized

---

# RESOURCE CURATION STRATEGY

## Document Now (URLs in capability files)
- Supabase JS client docs
- pgvector GitHub repo + docs
- Hono framework docs
- Vitest docs
- Turborepo docs
- OpenAI Embeddings API reference
- PostgreSQL 16 docs (CTEs, functions)
- GitHub Actions docs
- npm scoped packages docs
- OWASP API Security Top 10

## Evaluate Before Start (may need deeper curation)
- testcontainers-node — needed if QA/Backend want pgvector in CI tests
- arxiv 2603.10062 — must locate for launch content
- Competitor products (Letta, Mem0, Zep, LangGraph) — URLs for Product positioning

## Never Clone / Download
- Full framework source repos (Hono, Supabase, Turborepo) — reference docs, don't clone
- Competitor source code — analyze from docs and public APIs only
- Generic TypeScript boilerplate repos — the spec IS the boilerplate
- LLM framework source (LangChain, CrewAI) — only relevant post-launch for adapters

---

# STATE-OF-THE-ART BAR

## What makes this truly top .001%

- Every capability file is written FROM the spec, with spec section references. Not generic, not derived from "best practices," not restatements of the agent's AGENT.md
- Backend has a worked-example algorithm reference with concrete numbers — not "the compiler scores decisions" but "decision X gets 0.4 (direct affect) + 0.12 (tag match: architecture=1.0, security=0.6 averaged * 0.2) + 0.075 (role relevance: 2 matching tags * 0.25 capped at 0.15) + 0.175 (0.7 cosine similarity * 0.25) = 0.77 before freshness"
- Known spec bugs are documented BEFORE implementation starts — Backend doesn't waste time debugging known issues
- QA has scenario tests with expected outputs before a single line of code is written — tests drive implementation, not the reverse
- Security's threat model is scoped to v1 reality, not enterprise paranoia — it won't block launch over theoretical threats
- Every shared file serves multiple agents and eliminates repeated questions — glossary prevents terminology drift, spec index prevents spec-searching, constraints prevent runtime surprises

## What would make it merely "good"

- Capability files that summarize the spec without adding execution leverage
- Generic implementation patterns not specific to Supabase/Hono/pgvector
- Test plans that list what to test without specifying expected outputs
- Threat models that list OWASP categories without analyzing Nexus-specific surfaces
- Missing known spec issues — Backend discovers bugs during implementation

## What to avoid (generic filler)

- "Best practices for TypeScript monorepos" — the spec defines the monorepo structure
- "How to write good tests" — QA already has standards; it needs Nexus-specific test definitions
- "Security checklist for web APIs" — Security needs Nexus's actual attack surface, not a generic list
- Capability files that restate the AGENT.md's quality bar in Nexus terminology — that adds zero execution leverage
- Reference indexes with 50+ URLs that no agent will read — curate ruthlessly, 3-5 per agent max

---

**End of planning pass. Awaiting approval for Phase 1A (20 files).**
