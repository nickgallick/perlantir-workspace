# Nexus

**Give each agent the right context.**

Nexus decides what each agent should know before it acts. Same project state, different agents, different compiled context — scored by relevance, shaped by role, packed into token budgets.

A TypeScript library, REST API, and SDK for decision-aware context compilation in multi-agent teams.

---

## What It Does

When multiple AI agents work on the same project, they shouldn't all see the same context. A backend engineer needs different decisions than a product manager. A security reviewer cares about different signals than a launch coordinator.

Nexus solves this:

1. **Records decisions** — what was decided, why, by whom, what it supersedes
2. **Connects them** — edges between decisions (depends_on, supersedes, conflicts_with, enables)
3. **Scores per agent** — 5 signals: direct affect, tag matching, role relevance, semantic similarity, freshness
4. **Packs into budgets** — priority cascade into token-limited context windows
5. **Propagates changes** — when decisions change, affected agents get role-appropriate notifications

## Quick Start

```bash
# Clone and start
git clone <repo-url> nexus && cd nexus
docker compose up
```

The server starts on `http://localhost:3000` with migrations applied automatically.

Verify:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","dependencies":{"database":"connected"}}
```

### With Authentication

Set `NEXUS_API_KEY` in `docker-compose.yml` or pass it as an environment variable:

```bash
NEXUS_API_KEY=your-secret-key docker compose up
```

All endpoints except `/api/health` require `Authorization: Bearer <key>`.

## Architecture

```
┌─────────────────────────────────────────────┐
│                @nexus-ai/sdk                │  ← Consumer-facing client
│  NexusClient, typed errors, convenience     │
│  helpers, seed utilities                    │
├─────────────────────────────────────────────┤
│              @nexus-ai/server               │  ← REST API (Hono)
│  Routes, auth, validation, error envelope   │
├─────────────────────────────────────────────┤
│               @nexus-ai/core                │  ← Engine
│  Decision graph, scoring, compiler,         │
│  packer, formatter, change propagator,      │
│  migrations, role templates                 │
├─────────────────────────────────────────────┤
│          PostgreSQL 17 + pgvector           │  ← Data layer
└─────────────────────────────────────────────┘
```

Three packages in a Turborepo monorepo. `core` has no HTTP dependencies. `sdk` has no database dependencies. `server` bridges them.

## API Reference

All endpoints return JSON. Errors use a consistent envelope: `{ error: { code, message, details? } }`.

### Projects

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects` | Create a project. Body: `{ name, description?, metadata? }` |
| GET | `/api/projects/:id` | Get a project by ID |

### Agents

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects/:id/agents` | Create an agent. Body: `{ name, role, relevance_profile }` |
| GET | `/api/projects/:id/agents` | List agents for a project |

### Decisions

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects/:id/decisions` | Create a decision. Body: `{ title, description, reasoning, made_by, status?, tags?, affects?, alternatives_considered?, metadata? }` |
| GET | `/api/projects/:id/decisions` | List decisions. Query: `?status=&made_by=&tag=` |
| GET | `/api/projects/:id/decisions/:did` | Get a single decision |
| PATCH | `/api/decisions/:id` | Update decision status. Body: `{ status }` |

### Edges

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/decisions/:id/edges` | Create an edge. Body: `{ target_id, relationship, description? }` |
| GET | `/api/decisions/:id/edges` | List edges for a decision |
| DELETE | `/api/edges/:id` | Delete an edge |

### Artifacts

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects/:id/artifacts` | Create an artifact. Body: `{ name, artifact_type, produced_by, description?, path?, content_summary?, related_decision_ids?, metadata? }` |
| GET | `/api/projects/:id/artifacts` | List artifacts for a project |

### Compile

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/compile` | Compile context for an agent. Body: `{ agent_id, task_description, max_tokens? }` |

Returns a `ContextPackage` with scored decisions, artifacts, and notifications — tailored to the agent's role.

### Graph

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/decisions/:id/graph` | Get connected decisions. Query: `?depth=&relationship=` |

### Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/agents/:id/notifications` | List notifications. Query: `?unread=true` |
| PATCH | `/api/notifications/:id/read` | Mark notification as read |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check (no auth required) |

## SDK

Install the SDK to interact with Nexus from TypeScript:

```typescript
import { NexusClient } from '@nexus-ai/sdk';

const client = new NexusClient({
  baseUrl: 'http://localhost:3000',
  apiKey: 'your-secret-key', // optional
});

// Check connection
const health = await client.health();

// Create a project
const project = await client.createProject({
  name: 'My Project',
  description: 'Building something',
});

// Create an agent with a role template
const agent = await client.createRoleAgent(
  project.id,
  'Backend Builder',
  'builder',
);

// Record a decision
const decision = await client.createDecision(project.id, {
  title: 'Use PostgreSQL for persistence',
  description: 'Chosen for pgvector support and reliability',
  reasoning: 'Need vector similarity for semantic scoring',
  made_by: 'architect',
  status: 'active',
  tags: ['database', 'infrastructure'],
  affects: ['builder', 'devops'],
});

// Compile context for the agent
const context = await client.compileForAgent(
  agent.id,
  'Implement the database layer',
);

console.log(context.decisions_included);  // Decisions relevant to this agent + task
console.log(context.compilation_time_ms); // How long compilation took
```

### Error Handling

```typescript
import { NexusApiError } from '@nexus-ai/sdk';

try {
  await client.getDecision('invalid-id');
} catch (err) {
  if (err instanceof NexusApiError) {
    console.log(err.status);        // 400
    console.log(err.code);          // 'VALIDATION_ERROR'
    console.log(err.serverMessage); // 'Invalid UUID for id: invalid-id'
  }
}
```

### Seed Demo Data

```typescript
// Creates 6 agents, 10 decisions, 4 edges — a complete software team scenario
const { project, agents, decisions, edges } = await client.seedSoftwareTeamDemo();
```

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `PORT` | No | `3000` | HTTP server port |
| `NEXUS_API_KEY` | No | — | API key for Bearer auth. If unset, auth is disabled (dev mode). |
| `OPENAI_API_KEY` | No | — | For semantic similarity embeddings. If unset, semantic scoring returns 0. |

## Development

### Prerequisites

- Node.js 22+
- pnpm 10+
- PostgreSQL 17 with pgvector extension

### Setup

```bash
# Install dependencies
pnpm install

# Set up database
createdb nexus
psql nexus -c "CREATE EXTENSION IF NOT EXISTS vector"
psql nexus -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\""

# Configure
cp .env.example .env
# Edit .env with your database URL

# Build all packages
npx turbo build

# Run tests (requires running PostgreSQL)
npx turbo test
```

### Project Structure

```
packages/
  core/       — Decision graph, scoring, compiler, change propagator
  server/     — Hono REST API, middleware, route handlers
  sdk/        — TypeScript client, typed errors, convenience helpers
supabase/
  migrations/ — PostgreSQL schema (applied automatically on startup)
examples/
  software-team/ — Comparison demo script
```

## How Scoring Works

Each decision is scored for each agent using 5 signals:

| Signal | Weight | What It Measures |
|--------|--------|-----------------|
| Direct Affect | 0.40 | Does the decision's `affects` list include this agent's role? |
| Tag Matching | 0.20 | Do the decision's tags match the agent's relevance profile tags? |
| Role Relevance | 0.15 | Does the agent's role template have high affinity for the decision's tags? |
| Semantic Similarity | 0.25 | Cosine similarity between the task description and decision embeddings |
| Freshness | blended | Exponential decay: 30-day half-life (validated), 7-day (unvalidated) |

Combined score: `min(1.0, relevance × 0.7 + freshness × 0.3)`

Status penalties reduce scores for superseded (×0.4 or ×0.1) and reverted (×0.05) decisions.

## License

Proprietary. All rights reserved.
