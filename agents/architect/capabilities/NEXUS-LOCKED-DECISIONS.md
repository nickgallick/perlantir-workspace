# NEXUS-LOCKED-DECISIONS.md

Decisions made in the Nexus v1 spec that are LOCKED. No agent may propose alternatives without explicit operator override.

---

## How to Use This File

If a decision is listed as **LOCKED**, treat it as a hard constraint. Don't evaluate it, don't suggest alternatives, don't debate it. Implement it.

If a decision is listed as **OPEN**, Architect may propose specifics within the spec's intent.

---

## LOCKED Decisions

### Stack (Spec §2)
- **LOCKED:** TypeScript strict mode
- **LOCKED:** Node.js 20+ runtime (we run 22.22.2)
- **LOCKED:** PostgreSQL 16 + pgvector (1536-dim vectors, IVFFlat index, cosine ops)
- **LOCKED:** Hono for API framework
- **LOCKED:** OpenAI text-embedding-3-small for embeddings
- **LOCKED:** `ws` library for WebSocket
- **LOCKED:** Vitest for testing
- **LOCKED:** Turborepo + pnpm for monorepo
- **LOCKED:** Docker + docker-compose for deployment

### Package Structure (Spec §3)
- **LOCKED:** 3 packages: `@nexus-ai/core`, `@nexus-ai/server`, `@nexus-ai/sdk`
- **LOCKED:** Directory structure as specified in §3 (all paths, all file names)
- **LOCKED:** Core contains all business logic; Server is thin routing; SDK is HTTP-only client

### Database Schema (Spec §4)
- **LOCKED:** 9 tables with exact column definitions
- **LOCKED:** `get_connected_decisions()` recursive CTE function
- **LOCKED:** IVFFlat index with lists=100 on embedding columns
- **LOCKED:** All constraints (unique, check, foreign key) as defined
- **LOCKED:** `update_updated_at()` trigger on projects, agents, decisions, artifacts

### Types (Spec §5)
- **LOCKED:** All interface definitions (`Decision`, `Agent`, `ContextPackage`, etc.)
- **LOCKED:** All enum-like string unions (`EdgeRelationship`, `ArtifactType`, confidence/status values)

### Role Templates (Spec §6)
- **LOCKED:** 8 role templates with exact weight maps
- **LOCKED:** `getRoleTemplate()`, `listRoleTemplates()`, `inspectRoleTemplate()` API

### Scoring Algorithm (Spec §7)
- **LOCKED:** 4 scoring signals with weights: direct affect (0.4), tag matching (0.2), role relevance (0.15), semantic similarity (0.25)
- **LOCKED:** Status penalties: superseded × 0.4 (if profile includes) or × 0.1; reverted × 0.05
- **LOCKED:** Combined score: 70% relevance + 30% freshness, capped at 1.0
- **LOCKED:** Graph expansion threshold: 0.25 combined score
- **LOCKED:** Depth decay: 0.6^depth

### Packer (Spec §8)
- **LOCKED:** Budget allocation: 10% notifications, 55% decisions, 30% artifacts, 5% sessions
- **LOCKED:** Token estimation: `Math.ceil(text.length / 4)`
- **LOCKED:** Overflow flows from unused category to next

### Formatter (Spec §9)
- **LOCKED:** Dual output: markdown + JSON
- **LOCKED:** Markdown format structure (section headers, badges, fields)

### Change Propagator (Spec §10)
- **LOCKED:** Three event types: created, superseded, reverted
- **LOCKED:** Role-specific notification text map (builder, reviewer, product, docs, launch, ops, blockchain, challenge, legal)
- **LOCKED:** Cache invalidation on every change event

### API Routes (Spec §14)
- **LOCKED:** All route paths and HTTP methods
- **LOCKED:** POST /api/compile as the key endpoint
- **LOCKED:** Auto-embedding on decision/artifact creation
- **LOCKED:** Auto-supersede status update + edge creation

### Docker (Spec §16)
- **LOCKED:** 2-service compose (nexus + postgres)
- **LOCKED:** `pgvector/pgvector:pg16` image
- **LOCKED:** Multi-stage Dockerfile (builder + runner)
- **LOCKED:** Health check: `pg_isready -U nexus`

### Demo (Spec §17)
- **LOCKED:** Comparison structure: baseline (vector) vs. Nexus (role-aware) vs. change propagation
- **LOCKED:** 3 demo agents: builder, reviewer, launch

---

## OPEN Decisions (Architect May Propose)

| Area | What's Open | Constraint |
|------|------------|-----------|
| Error handling patterns | How to structure error responses beyond "return 400 with message" | Must include actionable error info |
| Connection pooling | Supabase client connection strategy | Must handle concurrent requests |
| Rate limiting implementation | Spec mentions middleware but doesn't fully implement | Must exist before launch |
| WebSocket authentication | Spec doesn't specify how WS connections are authed | Must exist; design is open |
| Embedding retry/fallback | What happens when OpenAI API fails mid-request | Must handle gracefully |
| Logging strategy | What to log, at what level, in what format | Must support debugging in production |
| Environment validation | How to validate required env vars at startup | Must fail fast with clear messages |
| Cache warming strategy | Whether to pre-warm context cache | Optional; cache works cold |

---

## What this changes in execution

Architect cannot waste phases re-evaluating locked decisions. The 8 open areas are the only places where architectural judgment is needed. Every other agent can treat locked decisions as implementation requirements, not discussion topics. Eliminates: "should we consider Express?", "what about using Drizzle ORM?", "maybe a different embedding model?", "let's reconsider the scoring weights."
