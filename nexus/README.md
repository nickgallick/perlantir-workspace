# Nexus

**Give each agent the right context. Not all the context — the *right* context.**

---

## The Problem

When multiple AI agents work on the same project, they all see the same blob of context. Every decision, every document, every conversation — dumped into every agent's context window regardless of role.

A backend builder gets launch copy. A security reviewer gets deployment timelines. A docs writer gets database internals. The context is large, expensive, and wrong.

**Nexus fixes this.** Same project. Same decisions. Different agents. Different compiled context — scored by relevance, shaped by role, packed into token budgets.

## Before / After

**Before Nexus** — vector search retrieval:
```
Builder  → [JWT auth, Token rotation, SSO delay, Rate limiting, Audit logging, ...]
Reviewer → [JWT auth, Token rotation, SSO delay, Rate limiting, Audit logging, ...]
Launch   → [JWT auth, Token rotation, SSO delay, Rate limiting, Audit logging, ...]
```
Every agent gets the same list. Same order. Same weight. No role awareness.

**With Nexus** — role-differentiated compilation:
```
Builder  → JWT auth (0.91) → Token rotation (0.88) → Rate limiting (0.85) → ...
Reviewer → Argon2id hashing (0.93) → Token rotation (0.89) → Rate limiting (0.87) → ...
Launch   → SSO delay (0.86) → Legacy deprecation (0.82) → Feature flags (0.79) → ...
```
Each agent gets decisions ranked by how much they matter *to that role*. Scores differ. Order differs. Some decisions don't appear at all.

## What the Compile Output Looks Like

```json
{
  "agent": { "name": "builder", "role": "builder" },
  "task": "Implement the auth middleware",
  "decisions_considered": 10,
  "decisions_included": 7,
  "token_count": 3847,
  "budget_used_pct": 7.69,
  "compilation_time_ms": 12,
  "decisions": [
    {
      "decision": {
        "title": "Use stateless JWT for API authentication",
        "reasoning": "Scalability and statelessness for distributed deployment",
        "made_by": "architect",
        "status": "active",
        "affects": ["builder", "reviewer", "ops"]
      },
      "relevance_score": 0.912,
      "freshness_score": 0.98,
      "combined_score": 0.912,
      "inclusion_reason": "directly_affects"
    }
  ]
}
```

Compile the same project for a **reviewer** with a different task, and the scores change. The ordering changes. The included decisions change.

## Why Not...

**Vector search?** Vector search finds *similar* content. Nexus finds *relevant* content — weighted by role, penalized by staleness, expanded via decision graphs. Similarity ≠ relevance.

**Shared memory / context windows?** Shared memory treats all agents the same. Nexus differentiates. A 10-decision project might give a builder 7 decisions and a reviewer 5 — different 5, different order, different scores.

**Orchestration frameworks?** Orchestrators dispatch tasks. Nexus doesn't dispatch anything — it compiles context *for* agents, regardless of what orchestrator (or none) runs them. It sits upstream: before the agent acts, Nexus decides what it should know.

## What Nexus Is / What Nexus Is Not

**Nexus is** a context compiler. It takes a project's decisions, an agent's role, and a task description — and produces a scored, budget-packed, role-differentiated context package.

**Nexus is not** an agent runtime, an orchestration framework, a chat UI, a vector database, or a cloud platform. It is a library with an API. It compiles context. That's it.

---

## Try It in 5 Minutes

### 1. Start the server

```bash
git clone <your-repo> nexus && cd nexus
docker compose up -d
```

Verify it's running:

```bash
curl http://localhost:3000/api/health
```

### 2. Seed demo data

```bash
# Create a project with 6 agents, 10 decisions, 4 edges
curl -s -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "demo"}' | jq .id
# → copy the project ID
```

Or use the SDK (faster):

```typescript
import { NexusClient } from '@nexus-ai/sdk';

const nx = new NexusClient({ url: 'http://localhost:3000' });
const { project, agents } = await nx.seedSoftwareTeamDemo();
```

### 3. Compile for two different roles

```typescript
// Builder context for auth work
const builderCtx = await nx.compileForAgent('builder', 'Implement auth middleware', project.id);

// Reviewer context for the same project
const reviewerCtx = await nx.compileForAgent('reviewer', 'Review auth for security', project.id);

// Different scores, different order, different included decisions
console.log('Builder #1:', builderCtx.decisions[0].decision.title,
            '→', builderCtx.decisions[0].combined_score.toFixed(3));
console.log('Reviewer #1:', reviewerCtx.decisions[0].decision.title,
            '→', reviewerCtx.decisions[0].combined_score.toFixed(3));
```

### 4. Run the full demo

```bash
# Start the server, then:
npx tsx examples/software-team/comparison.ts
```

The demo proves role differentiation, change propagation, and score-driven context in your terminal.

---

## Using Nexus with OpenClaw

Nexus is designed as the context layer for multi-agent systems like [OpenClaw](https://openclaw.ai). In an OpenClaw workspace:

1. **Decisions are recorded** as agents work — architectural choices, scope changes, trade-offs
2. **Each agent compiles its own context** before acting, using its role and current task
3. **When decisions change** (superseded, reverted), affected agents get role-appropriate notifications

This replaces the pattern of stuffing the same `MEMORY.md` or `AGENTS.md` into every agent's context. Each agent gets what it needs — nothing more.

---

## How Scoring Works

Each decision is scored per agent using 5 signals:

| Signal | Weight | What It Measures |
|--------|--------|-----------------|
| Direct Affect | 0.40 | Decision's `affects` list includes this agent's role |
| Tag Matching | 0.20 | Decision tags match agent's relevance profile |
| Role Relevance | 0.15 | Agent's role template has high affinity for the tags |
| Semantic Similarity | 0.25 | Cosine similarity between task description and decision embedding |
| Freshness | blended | Exponential decay — 30-day half-life (validated), 7-day (unvalidated) |

**Combined**: `min(1.0, relevance × 0.7 + freshness × 0.3)`

**Status penalties**: Superseded decisions score ×0.4 (if the agent's profile includes superseded) or ×0.1 (if not). Reverted decisions score ×0.05. Active decisions: no penalty.

The same decision gets a different score for a builder vs a reviewer vs a launch coordinator. That's the point.

## Architecture

```
┌─────────────────────────────────────────────┐
│                @nexus-ai/sdk                │  Consumer client — no DB dependency
├─────────────────────────────────────────────┤
│              @nexus-ai/server               │  REST API (Hono) — routes, auth, validation
├─────────────────────────────────────────────┤
│               @nexus-ai/core                │  Engine — scoring, compilation, graph, propagation
├─────────────────────────────────────────────┤
│          PostgreSQL 17 + pgvector           │  Decisions, edges, embeddings, notifications
└─────────────────────────────────────────────┘
```

Three packages. `core` has no HTTP dependencies. `sdk` has no database dependencies. Clean boundaries.

## API Reference

All endpoints return JSON. Errors: `{ error: { code, message, details? } }`.

### Projects

| Method | Path | Body / Query |
|--------|------|-------------|
| `POST` | `/api/projects` | `{ name, description?, metadata? }` |
| `GET` | `/api/projects/:id` | — |

### Agents

| Method | Path | Body / Query |
|--------|------|-------------|
| `POST` | `/api/projects/:id/agents` | `{ name, role, relevance_profile }` |
| `GET` | `/api/projects/:id/agents` | — |

### Decisions

| Method | Path | Body / Query |
|--------|------|-------------|
| `POST` | `/api/projects/:id/decisions` | `{ title, description, reasoning, made_by, status?, tags?, affects?, alternatives_considered?, metadata? }` |
| `GET` | `/api/projects/:id/decisions` | `?status=&made_by=&tag=` |
| `GET` | `/api/projects/:id/decisions/:did` | — |
| `PATCH` | `/api/decisions/:id` | `{ status }` |

### Edges

| Method | Path | Body / Query |
|--------|------|-------------|
| `POST` | `/api/decisions/:id/edges` | `{ target_id, relationship, description? }` |
| `GET` | `/api/decisions/:id/edges` | — |
| `DELETE` | `/api/edges/:id` | — |

### Artifacts

| Method | Path | Body / Query |
|--------|------|-------------|
| `POST` | `/api/projects/:id/artifacts` | `{ name, artifact_type, produced_by, description?, path?, content_summary?, related_decision_ids?, metadata? }` |
| `GET` | `/api/projects/:id/artifacts` | — |

### Compile

| Method | Path | Body / Query |
|--------|------|-------------|
| `POST` | `/api/compile` | `{ agent_id, task_description, max_tokens? }` |

### Graph / Notifications / Health

| Method | Path | Body / Query |
|--------|------|-------------|
| `GET` | `/api/decisions/:id/graph` | `?depth=&relationship=` |
| `GET` | `/api/agents/:id/notifications` | `?unread=true` |
| `PATCH` | `/api/notifications/:id/read` | — |
| `GET` | `/api/health` | — (no auth required) |

## SDK

```typescript
import { NexusClient, NexusApiError } from '@nexus-ai/sdk';

const nx = new NexusClient({ url: 'http://localhost:3000' });

// Seed a complete demo project
const { project, agents, decisions } = await nx.seedSoftwareTeamDemo();

// Compile context — the core operation
const ctx = await nx.compileForAgent('builder', 'Implement auth middleware', project.id);

// Typed error handling
try {
  await nx.getProject('nonexistent-id');
} catch (err) {
  if (err instanceof NexusApiError) {
    console.log(err.status, err.code, err.serverMessage);
  }
}
```

Full SDK methods: `createProject`, `registerAgent`, `createRoleAgent`, `recordDecision`, `supersedeDecision`, `updateDecisionStatus`, `createEdge`, `listEdges`, `deleteEdge`, `registerArtifact`, `listArtifacts`, `compileContext`, `compileForAgent`, `getDecisionGraph`, `getNotifications`, `markNotificationRead`, `health`, `seedSoftwareTeamDemo`.

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `PORT` | No | `3000` | HTTP server port |
| `NEXUS_API_KEY` | No | — | Bearer auth key. Unset = dev mode (no auth). |
| `OPENAI_API_KEY` | No | — | For semantic similarity embeddings. Unset = semantic scoring returns 0. |

## Development

```bash
# Prerequisites: Node.js 22+, pnpm 10+, PostgreSQL 17 with pgvector

pnpm install
cp .env.example .env  # edit DATABASE_URL

# Database setup
createdb nexus
psql nexus -c "CREATE EXTENSION IF NOT EXISTS vector"
psql nexus -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\""

# Build + test
npx turbo build
npx turbo test  # 214 tests across 3 packages
```

## License

Proprietary. All rights reserved.
