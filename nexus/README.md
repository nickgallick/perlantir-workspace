# Nexus

**Give each agent the right context.**

Nexus decides what each agent should know before it acts. Same project state. Different agents. Different compiled context — scored by relevance, shaped by role, packed into token budgets.

---

## The Problem

Multiple AI agents work on the same project. They all see the same context. A backend builder gets launch copy. A security reviewer gets deployment timelines. A docs writer gets database internals.

The context is large, expensive, and wrong.

## Before / After

**Before** — every agent gets the same list:
```
Builder  → [JWT auth, Token rotation, SSO delay, Rate limiting, Audit logging, ...]
Reviewer → [JWT auth, Token rotation, SSO delay, Rate limiting, Audit logging, ...]
Launch   → [JWT auth, Token rotation, SSO delay, Rate limiting, Audit logging, ...]
```

**With Nexus** — each agent gets decisions ranked by role relevance:
```
Builder  → JWT auth (0.91) → Token rotation (0.88) → Rate limiting (0.85)
Reviewer → Argon2id hashing (0.93) → Token rotation (0.89) → Rate limiting (0.87)
Launch   → SSO delay (0.86) → Legacy deprecation (0.82) → Feature flags (0.79)
```
Different scores. Different order. Different included decisions.

When a decision is superseded, affected agents get role-appropriate notifications. The old decision drops to ×0.1 penalty. The new one appears at full relevance.

## Best For

- **Multi-agent teams** where agents have distinct roles (builder, reviewer, product, docs, ops)
- **Decision-heavy projects** where context windows matter and not everything is relevant to everyone
- **Systems that need change propagation** — when a decision changes, the right agents learn about it with the right framing
- **OpenClaw workspaces** or any multi-agent system that needs a context layer upstream of execution

## Why Not...

**Vector search?** Finds *similar* content. Nexus finds *relevant* content — weighted by role, penalized by staleness, expanded via decision graphs. Similarity ≠ relevance.

**Shared memory?** Treats all agents the same. Nexus differentiates — same decision, different score for builder vs reviewer vs launch.

**Orchestration?** Dispatches tasks. Nexus compiles context *for* agents, upstream of whatever orchestrator runs them.

## What Nexus Is / What Nexus Is Not

**Is:** A context compiler. Decisions in, role-differentiated context packages out.

**Is not:** An agent runtime, orchestration framework, chat UI, vector database, or cloud platform.

---

## Try It in 5 Minutes

### 1. Start

```bash
docker compose up -d
curl http://localhost:3000/api/health
```

### 2. Seed + compile

```typescript
import { NexusClient } from '@nexus-ai/sdk';

const nx = new NexusClient({ url: 'http://localhost:3000' });

// Seed: 6 agents, 10 decisions, 4 edges
const { project } = await nx.seedSoftwareTeamDemo();

// Compile for two different roles
const builder  = await nx.compileForAgent('builder',  'Implement auth middleware', project.id);
const reviewer = await nx.compileForAgent('reviewer', 'Review auth for security', project.id);

// Different #1 decision. Different scores. Different order.
console.log('Builder:',  builder.decisions[0].decision.title,  builder.decisions[0].combined_score);
console.log('Reviewer:', reviewer.decisions[0].decision.title, reviewer.decisions[0].combined_score);
```

### 3. Run the full demo

```bash
npx tsx examples/software-team/comparison.ts
```

Role differentiation, change propagation, and score-driven context — proven in your terminal.

---

## Using Nexus with OpenClaw

In an [OpenClaw](https://openclaw.ai) workspace, Nexus replaces the pattern of stuffing the same `MEMORY.md` into every agent's context:

1. **Decisions are recorded** as agents work — architectural choices, scope changes, trade-offs
2. **Each agent compiles its context** before acting, using its role and current task
3. **When decisions change**, affected agents get role-appropriate notifications

Each agent gets what it needs. Nothing more.

---

## How Scoring Works

Each decision is scored per agent using 5 signals:

| Signal | Weight | Measures |
|--------|--------|---------|
| Direct Affect | 0.40 | Decision's `affects` list includes this role |
| Tag Matching | 0.20 | Decision tags match agent's profile |
| Role Relevance | 0.15 | Role template affinity for the tags |
| Semantic Similarity | 0.25 | Cosine similarity: task ↔ decision embedding |
| Freshness | blended | Exponential decay (30d validated, 7d unvalidated) |

**Combined**: `min(1.0, relevance × 0.7 + freshness × 0.3)`

**Penalties**: Superseded ×0.4 or ×0.1. Reverted ×0.05. Active: no penalty.

<details>
<summary>Compile output shape</summary>

```json
{
  "agent": { "name": "builder", "role": "builder" },
  "task": "Implement the auth middleware",
  "decisions_considered": 10,
  "decisions_included": 7,
  "compilation_time_ms": 12,
  "decisions": [
    {
      "decision": { "title": "Use stateless JWT for API authentication", "status": "active" },
      "relevance_score": 0.912,
      "freshness_score": 0.98,
      "combined_score": 0.912,
      "inclusion_reason": "directly_affects"
    }
  ]
}
```
</details>

## Architecture

```
┌─────────────────────────────────────────────┐
│                @nexus-ai/sdk                │  Client — no DB dependency
├─────────────────────────────────────────────┤
│              @nexus-ai/server               │  REST API (Hono)
├─────────────────────────────────────────────┤
│               @nexus-ai/core                │  Engine — scoring, compilation, graph, propagation
├─────────────────────────────────────────────┤
│          PostgreSQL 17 + pgvector           │  Decisions, edges, embeddings, notifications
└─────────────────────────────────────────────┘
```

## API Reference

All endpoints return JSON. Errors: `{ error: { code, message, details? } }`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/projects` | Create project `{ name, description?, metadata? }` |
| `GET` | `/api/projects/:id` | Get project |
| `POST` | `/api/projects/:id/agents` | Create agent `{ name, role, relevance_profile }` |
| `GET` | `/api/projects/:id/agents` | List agents |
| `POST` | `/api/projects/:id/decisions` | Create decision `{ title, description, reasoning, made_by, ... }` |
| `GET` | `/api/projects/:id/decisions` | List decisions `?status=&made_by=&tag=` |
| `GET` | `/api/projects/:id/decisions/:did` | Get decision |
| `PATCH` | `/api/decisions/:id` | Update status `{ status }` |
| `POST` | `/api/decisions/:id/edges` | Create edge `{ target_id, relationship }` |
| `GET` | `/api/decisions/:id/edges` | List edges |
| `DELETE` | `/api/edges/:id` | Delete edge |
| `POST` | `/api/projects/:id/artifacts` | Create artifact `{ name, artifact_type, produced_by, ... }` |
| `GET` | `/api/projects/:id/artifacts` | List artifacts |
| `POST` | `/api/compile` | **Compile context** `{ agent_id, task_description, max_tokens? }` |
| `GET` | `/api/decisions/:id/graph` | Connected decisions `?depth=&relationship=` |
| `GET` | `/api/agents/:id/notifications` | Notifications `?unread=true` |
| `PATCH` | `/api/notifications/:id/read` | Mark read |
| `GET` | `/api/health` | Health check (no auth) |

## SDK

```typescript
import { NexusClient, NexusApiError } from '@nexus-ai/sdk';

const nx = new NexusClient({ url: 'http://localhost:3000' });
const { project, agents, decisions } = await nx.seedSoftwareTeamDemo();
const ctx = await nx.compileForAgent('builder', 'Implement auth middleware', project.id);
```

All methods: `createProject`, `registerAgent`, `createRoleAgent`, `recordDecision`, `supersedeDecision`, `updateDecisionStatus`, `createEdge`, `listEdges`, `deleteEdge`, `registerArtifact`, `listArtifacts`, `compileContext`, `compileForAgent`, `getDecisionGraph`, `getNotifications`, `markNotificationRead`, `health`, `seedSoftwareTeamDemo`.

Typed errors: `NexusApiError` preserves `status`, `code`, `serverMessage`, `details`.

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `PORT` | No | `3000` | Server port |
| `NEXUS_API_KEY` | No | — | Bearer auth. Unset = no auth (dev mode). |
| `OPENAI_API_KEY` | No | — | Semantic embeddings. Unset = semantic scoring returns 0. |

## Development

```bash
pnpm install && cp .env.example .env
createdb nexus
psql nexus -c "CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
npx turbo build && npx turbo test  # 214 tests
```

## License

Proprietary. All rights reserved.
