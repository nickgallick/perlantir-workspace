# SKILL-PACKAGE-BOUNDARY-ENFORCEMENT

## Purpose

Enforce and evolve the 3-package monorepo boundary: core (no HTTP), server (no business logic), SDK (no database). Boundary violations create circular dependencies, break independent deployability, and confuse responsibility ownership.

## When to Use

- Reviewing any PR that adds cross-package imports
- Evaluating new package proposals
- Resolving "where does this code belong?" decisions
- Investigating circular dependency errors
- Auditing dependency declarations in `package.json` files

## Inputs Required

- `packages/core/package.json` — runtime deps: `pg` only
- `packages/server/package.json` — runtime deps: `@nexus-ai/core`, `hono`, `pg`, `ws`
- `packages/sdk/package.json` — runtime deps: `@nexus-ai/core` only
- `packages/*/src/index.ts` — public API surfaces
- `turbo.json` — build dependency graph (`build: { dependsOn: ["^build"] }`)

## Execution Method

### Package Responsibility Matrix

```
@nexus-ai/core:
  OWNS:  types, scoring, compilation, graph CRUD, propagator, migrator, roles
  DEPS:  pg (runtime)
  NEVER: hono, http/server code, SDK utilities, fetch

@nexus-ai/server:
  OWNS:  route handlers, middleware, HTTP concerns, request parsing
  DEPS:  @nexus-ai/core (runtime), hono (runtime), pg (runtime), ws (runtime)
  NEVER: business logic, scoring, compilation decisions, type definitions

@nexus-ai/sdk:
  OWNS:  NexusClient, error types, convenience helpers, type re-exports
  DEPS:  @nexus-ai/core (runtime — types + role utilities only)
  NEVER: pg, hono, direct DB access, server internals
```

### Import Rules (Concrete)

| From → To | Allowed | Example |
|-----------|---------|---------|
| core → core | ✅ | `import { Decision } from '../types.js'` |
| server → core | ✅ | `import { compile, createDecision } from '@nexus-ai/core'` |
| sdk → core | ✅ types + utilities only | `import type { Decision } from '@nexus-ai/core'`; `import { getRoleTemplate } from '@nexus-ai/core'` |
| core → server | ❌ | Would create circular dep |
| core → sdk | ❌ | Would create circular dep |
| server → sdk | ❌ | Server doesn't consume SDK |
| sdk → server | ❌ runtime / ✅ devDependencies | `@nexus-ai/server` in SDK's devDependencies for E2E tests only |
| sdk → pg | ❌ runtime / ✅ devDependencies | `pg` in SDK's devDependencies for E2E test DB cleanup |

### Build Order Enforcement

`turbo.json` declares `build: { dependsOn: ["^build"] }` — each package builds after its dependencies:

```
1. @nexus-ai/core     (no workspace deps)
2. @nexus-ai/sdk      (depends on core)
   @nexus-ai/server   (depends on core)
   [sdk and server can build in parallel]
```

If SDK ever imports from server at runtime, it creates: `sdk → server → core` AND `server → core`, which turbo can still resolve, but it means SDK can't be used without server — destroying the point of having an SDK.

### "Where Does This Code Belong?" Decision Tree

```
Does it touch the database directly?
  YES → core (in the appropriate module: decision-graph, context-compiler, change-propagator, db)
  NO ↓

Does it handle HTTP requests/responses?
  YES → server (route handler or middleware)
  NO ↓

Does it define data types shared across packages?
  YES → core/types.ts
  NO ↓

Does it make HTTP calls to the Nexus API?
  YES → sdk (NexusClient method)
  NO ↓

Is it a pure function (no I/O)?
  If used by core logic → core
  If used only by SDK consumers → sdk
  If used only by server → server
```

### Boundary Audit Checklist

Run when suspicious:

```bash
# Check core doesn't import hono
grep -r "from 'hono" packages/core/src/ && echo "VIOLATION: core imports hono"

# Check core doesn't import sdk or server
grep -r "@nexus-ai/sdk\|@nexus-ai/server" packages/core/src/ && echo "VIOLATION: core imports sdk/server"

# Check sdk doesn't import pg at runtime (src/ only, not tests/)
grep -r "from 'pg'" packages/sdk/src/ && echo "VIOLATION: sdk imports pg"
grep -r "import pg" packages/sdk/src/ && echo "VIOLATION: sdk imports pg"

# Check server doesn't define types (should import from core)
grep -r "^export interface\|^export type" packages/server/src/ | grep -v "middleware" && echo "CHECK: server defines types"
```

### Known Boundary Tensions

1. **parseRow duplication**: Both `core/graph.ts` and `server/app.ts` have row parsers. The server's parsers exist because some routes do inline queries (projects, agents, artifacts) instead of calling core functions. Ideal fix: move all queries to core, export parse functions.

2. **SDK devDependencies on server + pg**: Added in Day 7 for E2E tests. This is acceptable — devDependencies don't ship to consumers. But the test file (`e2e.test.ts`) must never be importable from SDK's public API.

3. **Server inline queries**: `app.ts` contains raw SQL for projects, agents, artifacts, and notifications instead of calling core functions. This leaks DB logic into the server package. Not a boundary violation (server depends on pg) but an architectural smell.

### Do NOT Do This

- **Do not add `@nexus-ai/server` to SDK's runtime `dependencies`.** SDK consumers should never need the server package.
- **Do not move type definitions to the server package.** All shared types live in `core/types.ts`.
- **Do not import `@nexus-ai/core` internals** (deep imports like `@nexus-ai/core/src/context-compiler/scoring`). Use only the public API from `@nexus-ai/core` (the `index.ts` exports).
- **Do not add `pg` to SDK's runtime dependencies.** If SDK needs DB access, the architecture is wrong.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| Circular dependency | core imports sdk or server | TypeScript build fails or turbo cycle error | Remove the import; restructure |
| SDK runtime crash (pg missing) | pg imported in SDK src/ (not just tests/) | Consumer installs SDK, gets `Cannot find module 'pg'` | Move pg import to test files only |
| Turbo build order wrong | Missing `^build` in dependsOn | Downstream package sees stale types | Verify turbo.json `dependsOn: ["^build"]` |
| Type not available in SDK | New type added to core but not re-exported in `sdk/index.ts` | SDK consumer gets `any` | Add to SDK re-export list |

## Exit Criteria

- Boundary audit checklist passes (no violations in `src/` directories)
- `turbo build` succeeds with correct dependency ordering
- SDK `package.json` has no runtime dependency on `pg` or `@nexus-ai/server`
- Core `package.json` has no dependency on `hono`, `@nexus-ai/sdk`, or `@nexus-ai/server`
- All shared types defined in `core/types.ts` and re-exported by SDK
