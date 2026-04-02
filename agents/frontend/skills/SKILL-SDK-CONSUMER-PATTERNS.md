# SKILL-SDK-CONSUMER-PATTERNS

## Purpose

Consume the Nexus SDK correctly from application code: initialization, CRUD workflow, compilation, error handling, type usage, and common anti-patterns. This skill defines how external consumers (CLI tools, agent frameworks, dashboards, scripts) should interact with Nexus through the SDK.

## When to Use

- Building any application that consumes Nexus (UI, CLI, agent integration, script)
- Writing example code for README or documentation
- Reviewing consumer-side code for correctness
- Debugging SDK usage issues reported by users
- Integrating Nexus into an agent framework (LangChain, CrewAI, etc.)

## Inputs Required

**Source of truth (all patterns derived from these):**
- `packages/sdk/src/client.ts` — `NexusClient`, `NexusApiError`, all methods
- `packages/sdk/src/index.ts` — public API surface (exported types and functions)
- `examples/software-team/comparison.ts` — proven end-to-end usage
- `packages/sdk/tests/e2e.test.ts` — 27 tested patterns through real server

## Execution Method

### The Golden Path (Minimum Viable Integration)

Every SDK consumer follows this sequence. Deviation causes bugs.

```typescript
import { NexusClient, NexusApiError } from '@nexus-ai/sdk';
import type { ContextPackage } from '@nexus-ai/sdk';

// 1. Initialize (once per application lifetime)
const client = new NexusClient({
  url: process.env.NEXUS_URL ?? 'http://localhost:3000',
  apiKey: process.env.NEXUS_API_KEY,  // undefined = dev mode
});

// 2. Verify connectivity
const health = await client.health();
if (health.status !== 'ok') throw new Error('Nexus not ready');

// 3. Create or reference project
const project = await client.createProject({ name: 'My Project' });

// 4. Register agents with role templates
const builder = await client.createRoleAgent(project.id, 'builder', 'builder');
const reviewer = await client.createRoleAgent(project.id, 'reviewer', 'reviewer');

// 5. Record decisions as they happen
const decision = await client.recordDecision({
  project_id: project.id,
  title: 'Use PostgreSQL for storage',
  description: 'PostgreSQL with pgvector for relational + vector',
  reasoning: 'Best balance of query power and similarity search',
  made_by: 'architect',
  affects: ['builder', 'reviewer'],
  tags: ['database', 'architecture'],
});

// 6. Compile context for an agent's current task
const ctx: ContextPackage = await client.compileForAgent(
  'builder',
  'Implement the database migration system',
  project.id,
);

// 7. Use the compiled context
console.log(ctx.formatted_markdown);  // Human-readable, for LLM system prompt
console.log(ctx.decisions_included);   // How many decisions made it into context
```

Source: `e2e.test.ts` — "SDK: Full Developer Lifecycle" test.

### Error Handling Pattern

Every SDK call can throw `NexusApiError`. Handle it explicitly:

```typescript
import { NexusApiError } from '@nexus-ai/sdk';

try {
  const decision = await client.getDecision(someId);
} catch (e) {
  if (e instanceof NexusApiError) {
    // Typed error with server envelope preserved
    switch (e.code) {
      case 'NOT_FOUND':
        console.log(`Decision not found: ${e.serverMessage}`);
        break;
      case 'VALIDATION_ERROR':
        console.log(`Bad input: ${e.serverMessage}`, e.details);
        break;
      case 'AUTH_REQUIRED':
      case 'AUTH_FORBIDDEN':
        console.log('Authentication failed');
        break;
      default:
        console.log(`Server error (${e.status}): ${e.serverMessage}`);
    }
  } else if (e instanceof TypeError && e.message.includes('fetch')) {
    console.log('Cannot reach Nexus server');
  } else {
    throw e;  // Unknown error, re-throw
  }
}
```

**Key properties on `NexusApiError`:**
- `e.status` — HTTP status code (400, 401, 403, 404, 500)
- `e.code` — Server error code (`NOT_FOUND`, `VALIDATION_ERROR`, `AUTH_REQUIRED`, etc.)
- `e.serverMessage` — Human-readable message from server
- `e.details` — Optional structured details (e.g., `{ missing: ['title'] }`)
- `e.message` — Full string: `"Nexus API error (404/NOT_FOUND): Decision not found: ..."`

Source: `client.ts` — `NexusApiError` class; `e2e.test.ts` — "SDK: Error Handling" tests.

### Typed Compilation Output

The `ContextPackage` is the primary output. Key fields:

```typescript
const ctx = await client.compileForAgent('builder', task, projectId);

// Agent metadata
ctx.agent.name;     // 'builder'
ctx.agent.role;     // 'builder'

// Compilation stats
ctx.decisions_considered;     // Total decisions in project
ctx.decisions_included;       // Decisions that made it into context
ctx.token_count;              // Estimated tokens used
ctx.budget_used_pct;          // % of token budget consumed
ctx.compilation_time_ms;      // How long compilation took
ctx.relevance_threshold_used; // Lowest score of included decisions

// Scored decisions (sorted by combined_score DESC)
ctx.decisions[0].decision.title;        // Decision content
ctx.decisions[0].combined_score;         // 0.0 to 1.0
ctx.decisions[0].inclusion_reason;       // Why included

// Formatted output (for LLM consumption)
ctx.formatted_markdown;  // Human-readable markdown
ctx.formatted_json;      // Structured JSON string
```

### Convenience Methods vs Core Methods

| Use case | Convenience method | Core method |
|----------|-------------------|-------------|
| Create agent with role template | `createRoleAgent(projectId, name, role)` | `registerAgent({ project_id, name, role, relevance_profile, ... })` |
| Compile by agent name | `compileForAgent(name, task, projectId)` | `compileContext({ agent_id, task_description })` |
| Record decision + edges atomically | `recordDecisionWithEdges({ ...input, edges })` | `recordDecision(input)` then `createEdge()` separately |
| Seed demo data | `seedSoftwareTeamDemo()` | Manual project/agent/decision creation |

Use convenience methods for common flows. Use core methods when you need fine-grained control (custom relevance profiles, specific agent IDs, non-standard edge creation).

### What NOT to Do

- **Do not import from `@nexus-ai/core` in consumer code.** SDK re-exports everything you need. Importing core creates a direct dependency on an internal package.
  ```typescript
  // WRONG:
  import type { Decision } from '@nexus-ai/core';
  // RIGHT:
  import type { Decision } from '@nexus-ai/sdk';
  ```

- **Do not create multiple `NexusClient` instances for the same server.** One client per server URL. The client is stateless — there's no connection pooling or session to manage.

- **Do not ignore `NexusApiError`.** A bare `catch(e) { console.log(e) }` loses the structured error information. Always check `instanceof NexusApiError`.

- **Do not cache `ContextPackage` results across decision changes.** After recording or superseding a decision, recompile — the previous context is stale.

- **Do not parse `formatted_json` yourself when `decisions` array is available.** The typed `decisions` array has the same data with proper types. `formatted_json` is for LLM consumption.

- **Do not pass `agent_id` when you can use `compileForAgent(name, ...)`.** The convenience method handles the name-to-ID lookup.

### Launch-Grade Path

Minimum standard for public-facing SDK consumer code (README examples, demo scripts, integration guides):

1. **Health check before first operation** — proves server is reachable and database connected
2. **Typed error handling** — `NexusApiError` with `switch(e.code)`, not generic catch
3. **Use convenience methods** — `createRoleAgent`, `compileForAgent` — not low-level equivalents
4. **Import only from `@nexus-ai/sdk`** — never `@nexus-ai/core` or `@nexus-ai/server`
5. **Show the differentiation** — compile for ≥ 2 roles, display the difference
6. **Clean exit** — no dangling promises, no unhandled rejections
7. **No hardcoded URLs or keys** — use environment variables with defaults

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| `TypeError: fetch failed` | Server not running or wrong URL | Network error (not NexusApiError) | Check URL, start server, verify health |
| `NexusApiError 401` | API key required but not provided | `e.code === 'AUTH_REQUIRED'` | Set `apiKey` in client config |
| `Agent "X" not found` in `compileForAgent` | Agent name doesn't exist in project | Error thrown by client (not server) | Create agent first, verify name spelling |
| Stale context after supersede | Cached ContextPackage from before the change | Decisions list doesn't include new decision | Recompile after any mutation |
| Type mismatch in consumer | Imported type from `@nexus-ai/core` instead of `@nexus-ai/sdk` | TypeScript version conflict or missing type | Import from `@nexus-ai/sdk` only |

## Exit Criteria

- Consumer follows the golden path: init → health → project → agents → decisions → compile
- All errors handled via `NexusApiError` with code-based switching
- All imports from `@nexus-ai/sdk` only
- Convenience methods used where available
- Health check performed before first operation
- Compiled context used correctly (not re-parsed, not cached across mutations)
