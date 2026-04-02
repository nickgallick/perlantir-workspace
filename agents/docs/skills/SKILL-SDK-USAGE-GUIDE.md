# SKILL-SDK-USAGE-GUIDE

## Purpose

Write SDK getting-started and usage documentation showing the developer path from install to role-differentiated compilation, using only patterns proven in tests and the demo script.

## When to Use

- SDK API change (new method, changed signature)
- New convenience method added
- README writing (quickstart section)
- Developer feedback requesting clearer usage patterns
- Pre-release documentation

## Inputs Required

**Source of truth (derive all examples from these):**
- `packages/sdk/src/client.ts` — all methods with JSDoc, `NexusClient` constructor, `NexusApiError`
- `packages/sdk/src/index.ts` — public API surface (what's exported = what's documented)
- `examples/software-team/comparison.ts` — proven end-to-end usage patterns
- `packages/sdk/tests/e2e.test.ts` — 27 tested usage patterns through real Hono app

**Messaging (for framing, not technical content):**
- `agents/docs/capabilities/NEXUS-KEY-MESSAGING.md` — headline, subhead, one-liner

## Execution Method

### SDK Documentation Structure

The guide must cover these sections in order, matching the developer's actual workflow:

**1. Install**
```bash
npm install @nexus-ai/sdk
# or
pnpm add @nexus-ai/sdk
```

Source: `packages/sdk/package.json` — package name is `@nexus-ai/sdk`.

**2. Initialize Client**
```typescript
import { NexusClient } from '@nexus-ai/sdk';

const client = new NexusClient({
  url: 'http://localhost:3000',
  apiKey: 'your-api-key',  // optional in dev mode
});
```

Source: `client.ts` — `NexusClientConfig` interface has `url` (required) and `apiKey` (optional).

**3. Create Project + Agents**
```typescript
const project = await client.createProject({ name: 'My Project' });
const builder = await client.createRoleAgent(project.id, 'builder', 'builder');
const reviewer = await client.createRoleAgent(project.id, 'reviewer', 'reviewer');
```

Source: `e2e.test.ts` — "SDK: Full Developer Lifecycle" test.

**4. Record Decisions**
```typescript
const decision = await client.recordDecision({
  project_id: project.id,
  title: 'Use PostgreSQL for storage',
  description: 'PostgreSQL with pgvector for combined relational + vector storage',
  reasoning: 'Best balance of relational queries and vector similarity',
  made_by: 'architect',
  affects: ['builder', 'reviewer'],
  tags: ['database', 'architecture'],
});
```

Source: `e2e.test.ts` — "SDK: Decisions" tests.

**5. Create Edges**
```typescript
await client.createEdge(decision1.id, {
  target_id: decision2.id,
  relationship: 'requires',
});
```

Source: `e2e.test.ts` — "SDK: Edges" tests.

**6. Compile Context**
```typescript
// By agent ID
const pkg = await client.compileContext({
  agent_id: builder.id,
  task_description: 'Implement the database migration system',
});

// By agent name (convenience)
const pkg = await client.compileForAgent('builder', 'Implement migrations', project.id);
```

Source: `e2e.test.ts` — "SDK: Compile" tests.

**7. Handle Errors**
```typescript
import { NexusClient, NexusApiError } from '@nexus-ai/sdk';

try {
  await client.getProject('nonexistent-uuid');
} catch (e) {
  if (e instanceof NexusApiError) {
    console.error(`${e.status}/${e.code}: ${e.serverMessage}`);
    // e.status: 404
    // e.code: 'NOT_FOUND'
    // e.serverMessage: 'Project not found: ...'
    // e.details: optional structured details
  }
}
```

Source: `e2e.test.ts` — "SDK: Error Handling" tests; `client.ts` — `NexusApiError` class.

**8. Available Types**

List all re-exported types from `sdk/index.ts`:
```typescript
import type {
  Project, Agent, Decision, DecisionEdge, Artifact,
  Notification, CompileRequest, ContextPackage,
  ScoredDecision, RelevanceProfile,
} from '@nexus-ai/sdk';
```

Source: `packages/sdk/src/index.ts` — complete re-export list.

### SDK Method Reference (Quick Table)

Derive from `client.ts` method signatures:

| Method | Returns | Notes |
|--------|---------|-------|
| `createProject(input)` | `Project` | |
| `getProject(id)` | `Project` | |
| `registerAgent(input)` | `Agent` | Low-level |
| `createRoleAgent(projectId, name, role)` | `Agent` | Uses built-in role template |
| `listAgents(projectId)` | `Agent[]` | |
| `recordDecision(input)` | `Decision` | |
| `getDecision(id)` | `Decision` | |
| `listDecisions(projectId, filters?)` | `Decision[]` | Filter by status |
| `updateDecisionStatus(id, status, opts?)` | `Decision` | |
| `supersedeDecision(input)` | `Decision` | Set `supersedes_id` in input |
| `createEdge(sourceId, input)` | `DecisionEdge` | |
| `listEdges(decisionId)` | `DecisionEdge[]` | |
| `deleteEdge(edgeId)` | `{ ok: boolean }` | |
| `registerArtifact(input)` | `Artifact` | |
| `listArtifacts(projectId)` | `Artifact[]` | |
| `compileContext(request)` | `ContextPackage` | Core compilation |
| `compileForAgent(name, task, projectId)` | `ContextPackage` | By agent name |
| `getNotifications(agentId, unreadOnly?)` | `Notification[]` | |
| `markNotificationRead(id)` | `void` | |
| `getDecisionGraph(id, depth?)` | `ConnectedDecision[]` | |
| `health()` | `HealthResponse` | |
| `seedSoftwareTeamDemo()` | `{ project, agents, decisions }` | Demo data |

### Do NOT Do This

- **Do not show import paths into `@nexus-ai/core`.** SDK re-exports everything consumers need. The guide should only import from `@nexus-ai/sdk`.
- **Do not invent examples.** Every code snippet must come from `e2e.test.ts`, `comparison.ts`, or `client.ts` JSDoc.
- **Do not document internal methods** (the private `request()` method). Only public methods.
- **Do not describe the scoring algorithm in SDK docs.** That's implementation detail. SDK docs show what goes in and what comes out.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| Import doesn't work | Type not re-exported in `sdk/index.ts` | TypeScript error | Add to re-export list |
| Example throws at runtime | API changed but example not updated | Run example, get error | Re-derive from current test files |
| Method signature wrong in docs | `client.ts` changed but docs stale | Consumer gets type error | Regenerate from `client.ts` |

## Exit Criteria

- Every public SDK method documented with signature, return type, and example
- Every example derived from test files or demo script (not invented)
- Import examples use `@nexus-ai/sdk` only (not `@nexus-ai/core`)
- Error handling section shows `NexusApiError` usage
- Quick reference table covers all methods
- Guide follows the natural developer workflow: install → init → create → record → compile
