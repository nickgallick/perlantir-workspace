# NEXUS-ARCHITECTURE-BRIEF.md

Distilled architecture from the Nexus v1 spec. This is what Architect needs to know to align all specialists without re-reading 56 pages.

---

## System Overview

Three components, one database, one API layer:

```
┌─────────────────────────────────────────────────────┐
│                    @nexus-ai/sdk                     │
│            (NexusClient — convenience)               │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼──────────────────────────────┐
│                  @nexus-ai/server                     │
│        Hono API (13+ routes) + WS handler            │
└──────────────────────┬──────────────────────────────┘
                       │ imports
┌──────────────────────▼──────────────────────────────┐
│                   @nexus-ai/core                      │
│  ContextCompiler │ ChangePropagator │ DecisionGraph  │
│  TokenPacker │ Formatter │ Distillery │ Temporal     │
└──────────────────────┬──────────────────────────────┘
                       │ Supabase client
┌──────────────────────▼──────────────────────────────┐
│           PostgreSQL 16 + pgvector                    │
│  9 tables │ 2 functions │ 3 triggers │ IVFFlat index │
└─────────────────────────────────────────────────────┘
```

**External dependencies:** OpenAI Embeddings API (text-embedding-3-small, 1536 dims). Optional: Anthropic Claude Sonnet 4.6 (distillery, post-launch only).

**Database access:** Raw `pg` (node-postgres) driver with connection pool (`pg.Pool`). All queries are parameterized SQL. No ORM, no query builder, no Supabase client. (AMB-1 decision: see `projects/nexus-v1/AMB-1-SUPABASE-VS-POSTGRES-DECISION.md`)

## Package Boundaries (Spec §3)

| Package | Responsibility | Depends On |
|---------|---------------|-----------|
| `@nexus-ai/core` | All business logic: decision graph CRUD, context compilation, scoring, packing, formatting, change propagation, freshness, embeddings | PostgreSQL via `pg` (node-postgres) Pool, OpenAI API |
| `@nexus-ai/server` | HTTP API + WebSocket. Thin routing layer that delegates to core | `@nexus-ai/core` |
| `@nexus-ai/sdk` | Client library for consuming the API. Convenience helpers | None (HTTP client only) |

**Boundary rule:** Server imports core. SDK imports nothing (HTTP only). Core never imports server or SDK.

## Data Layer (Spec §4)

9 tables:

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `projects` | Project container | id, name, metadata |
| `agents` | Registered agents per project | project_id, name, role, relevance_profile, context_budget_tokens |
| `decisions` | Graph nodes | project_id, title, description, reasoning, made_by, confidence, status, affects[], tags[], embedding vector(1536) |
| `decision_edges` | Graph edges | source_id, target_id, relationship (5 types), no self-edges |
| `artifacts` | Project artifacts | project_id, name, artifact_type (7 types), produced_by, related_decision_ids[], embedding |
| `session_summaries` | Distilled conversations (opt-in) | project_id, agent_name, topic, summary, assumptions[], open_questions[] |
| `subscriptions` | Agent topic subscriptions | agent_id, topic, notify_on[] |
| `notifications` | Change notifications | agent_id, decision_id, notification_type, message, role_context |
| `context_cache` | Compiled context cache | agent_id, task_hash, compiled_context JSONB, expires 1h |
| `api_keys` | API authentication | key_hash, project_id |

2 functions: `get_connected_decisions(start_id, max_depth)` (recursive CTE for graph traversal), `cleanup_expired_cache()`.

## Core Algorithm Flow (Spec §7)

The Context Compiler's `compile()` method:

1. Get agent + relevance profile
2. Embed task description
3. Get all project decisions (filtered by status per profile)
4. **Score every decision** — 4 signals combined: direct affect (0.4), tag matching (0.2), role relevance (0.15), semantic similarity (0.25), then status penalty
5. **Combine:** 70% relevance + 30% freshness = combined score
6. **Expand graph** — high-scoring decisions pull in neighbors via `get_connected_decisions`, decayed by 0.6^depth
7. **Apply freshness preference** — validated_first boosts validated decisions by 1.2x
8. Score artifacts similarly
9. Get pending notifications
10. Get relevant sessions (opt-in)
11. **Pack into token budget** — 10% notifs, 55% decisions, 30% artifacts, 5% sessions
12. Format as markdown + JSON, cache result

## Service Topology (Spec §16)

Docker compose: 2 services.
- `nexus`: Node.js app (multi-stage Dockerfile), port 3000
- `postgres`: `pgvector/pgvector:pg16`, port 5432, health check via `pg_isready`, migrations via init.d mount

## API Surface (Spec §14)

13+ routes across: projects (CRUD), agents (register, list), decisions (CRUD + edges + graph traversal), artifacts (CRUD), notifications (list + mark read), compile (POST /api/compile — the key endpoint), health.

## Real-Time (Spec §10)

WebSocket connections per agent. On decision change → propagator generates role-specific notification text → pushes via WS if connected → stores in notifications table → invalidates context cache.

---

## What this changes in execution

Architect can immediately orient any specialist: "your work touches @nexus-ai/core, table X, step Y of the compiler." No need to derive architecture from raw spec. Eliminates: specialists asking "how does this fit together?", building in the wrong package, misunderstanding data flow. Architect's review authority is grounded in concrete structure, not abstract principles.
