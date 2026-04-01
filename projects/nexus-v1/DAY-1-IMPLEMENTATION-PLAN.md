# DAY 1 IMPLEMENTATION PLAN — Nexus v1

**Objective:** Monorepo builds, types compile, database schema applies, pg pool connects, embedding utility works, role templates load.

**Spec sections:** §2 (stack), §3 (structure), §4 (schema), §5 (types), §6 (roles), §13 (embeddings)

**Prerequisite:** PostgreSQL 16 + pgvector accessible. Either:
- External Postgres on host/network (preferred for development)
- Supabase cloud free tier (temporary, for dev only — production is self-hosted)

---

## Task Sequence (in order)

### T1: Enable pnpm via corepack

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version  # verify
```

No code. Just runtime setup.

### T2: Scaffold monorepo root

Create in project root (`nexus/`):

| File | Content |
|------|---------|
| `package.json` | Workspace root. `"private": true`, scripts: `build`, `test`, `demo`, `demo:compare`. Engine: `node >=20` |
| `pnpm-workspace.yaml` | `packages: ["packages/*"]` |
| `turbo.json` | Pipeline: `build` depends on `^build`, `test` depends on `build` |
| `.gitignore` | `node_modules/`, `dist/`, `.env`, `*.tsbuildinfo` |
| `.env.example` | `DATABASE_URL=postgresql://nexus:nexus_dev@localhost:5432/nexus`, `OPENAI_API_KEY=sk-...`, `ANTHROPIC_API_KEY=sk-ant-...`, `PORT=3000` |
| `LICENSE` | MIT |

```bash
pnpm install  # should succeed with empty workspace
```

### T3: Scaffold @nexus-ai/core package

Create `packages/core/`:

| File | Content |
|------|---------|
| `package.json` | Name: `@nexus-ai/core`. Dependencies: `pg`, `openai` (or raw fetch). DevDeps: `typescript`, `vitest`, `@types/pg`, `@types/node` |
| `tsconfig.json` | Strict mode, ESM, target ES2022, outDir `dist/`, rootDir `src/` |
| `vitest.config.ts` | Default config, test dir `tests/` |

Directory stubs:
```
src/
  index.ts
  types.ts
  roles.ts
  nexus.ts
  db/
    client.ts
    index.ts
  decision-graph/
    index.ts
  context-compiler/
    index.ts
  change-propagator/
    index.ts
  temporal/
    index.ts
  distillery/
    index.ts
tests/
```

### T4: Scaffold @nexus-ai/server package

Create `packages/server/`:

| File | Content |
|------|---------|
| `package.json` | Name: `@nexus-ai/server`. Dependencies: `hono`, `@nexus-ai/core`, `ws`. DevDeps: `typescript`, `vitest`, `@types/ws` |
| `tsconfig.json` | Strict mode, ESM |

Stub: `src/index.ts`, `src/app.ts`

### T5: Scaffold @nexus-ai/sdk package

Create `packages/sdk/`:

| File | Content |
|------|---------|
| `package.json` | Name: `@nexus-ai/sdk`. Dependencies: `@nexus-ai/core` (types only). DevDeps: `typescript`, `vitest` |
| `tsconfig.json` | Strict mode, ESM |

Stub: `src/index.ts`, `src/client.ts`, `src/types.ts`

### T6: Verify monorepo builds

```bash
pnpm install
pnpm turbo build
```

Must succeed with no errors. All three packages compile.

### T7: Implement types.ts (Spec §5)

File: `packages/core/src/types.ts`

Copy all interfaces from spec §5. Apply these changes:
- `NexusConfig`: replace `supabaseUrl: string` and `supabaseKey: string` with `databaseUrl: string`
- Fix any truncated lines (check KNOWN-SPEC-ISSUES)
- Ensure all types are exported

Verify: `pnpm turbo build` succeeds with types.

### T8: Implement roles.ts (Spec §6)

File: `packages/core/src/roles.ts`

Copy role templates from spec §6. Fix truncated weight map lines in `computeRoleRelevance` roleTagMap (BUG-2):
- `reviewer`: `['security', 'architecture', 'testing', 'code_quality', 'code', 'vulnerability']`
- `ops`: `['infrastructure', 'deployment', 'config', 'monitoring', 'security', 'performance']`
- `challenge`: `['challenge', 'scoring', 'judge', 'benchmark', 'calibration', 'discrimination']`

Export: `getRoleTemplate()`, `listRoleTemplates()`, `inspectRoleTemplate()`

Verify: `listRoleTemplates()` returns 8 entries. Each template has valid weights, decision_depth, freshness_preference.

### T9: Implement db/client.ts (New — AMB-1)

File: `packages/core/src/db/client.ts`

```typescript
import { Pool, PoolConfig } from 'pg';

export function createPool(databaseUrl?: string): Pool {
  const connectionString = databaseUrl || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required. Set it in environment or pass databaseUrl.');
  }
  return new Pool({ connectionString, max: 20 });
}

export async function healthCheck(pool: Pool): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1 AS ok');
    return result.rows[0]?.ok === 1;
  } catch {
    return false;
  }
}
```

This is the foundation that replaces `createClient` from `@supabase/supabase-js`.

### T10: Apply database schema (Spec §4)

File: `supabase/migrations/001_initial_schema.sql`

Copy complete schema from spec §4. No changes needed — it's pure PostgreSQL.

Apply to database:
```bash
# If external Postgres is accessible:
psql $DATABASE_URL < supabase/migrations/001_initial_schema.sql
# Or via Node.js script using pg pool
```

Verify: all 9 tables exist, `get_connected_decisions` function exists, IVFFlat indexes created.

**Note:** IVFFlat indexes require data to be effective (lists=100 needs rows). For empty tables this is fine — index exists but won't be used until data is seeded.

### T11: Implement embedding utility (Spec §13)

File: `packages/core/src/context-compiler/relevance.ts`

Copy from spec §13:
- `createOpenAIEmbedder(apiKey, model)` — returns async function that calls OpenAI API
- `cosineSimilarity(a, b)` — vector dot product / norms

No changes needed from spec (no Supabase dependency in this file).

### T12: Wire barrel exports

Files: all `index.ts` files in core submodules.

```typescript
// packages/core/src/index.ts
export * from './types';
export * from './roles';
export * from './db/client';
export * from './context-compiler/relevance';
// (other modules exported as they're built in Days 2-5)
```

### T13: Write Day 1 smoke test

File: `packages/core/tests/setup.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { listRoleTemplates, getRoleTemplate } from '../src/roles';
import { createPool, healthCheck } from '../src/db/client';
import { cosineSimilarity } from '../src/context-compiler/relevance';

describe('Day 1 smoke tests', () => {
  it('lists 8 role templates', () => {
    expect(listRoleTemplates()).toHaveLength(8);
  });

  it('builder template has expected weights', () => {
    const builder = getRoleTemplate('builder');
    expect(builder.weights.architecture).toBe(1.0);
    expect(builder.weights.marketing).toBe(0.0);
    expect(builder.decision_depth).toBe(3);
  });

  it('cosine similarity of identical vectors is 1', () => {
    const v = [0.1, 0.2, 0.3, 0.4];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0);
  });

  it('cosine similarity of orthogonal vectors is 0', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0);
  });

  it('pool connects to database', async () => {
    const pool = createPool();
    const ok = await healthCheck(pool);
    expect(ok).toBe(true);
    await pool.end();
  });
});
```

Run: `pnpm turbo test`

---

## Day 1 Exit Criteria

- [ ] Monorepo builds (`pnpm turbo build` — zero errors)
- [ ] 3 packages scaffold complete (core, server, sdk)
- [ ] `types.ts` compiles with all Nexus types (NexusConfig uses `databaseUrl`)
- [ ] `roles.ts` loads all 8 templates with correct weights
- [ ] `db/client.ts` creates pool and passes health check
- [ ] Database schema applied (9 tables, 2 functions, 3 triggers)
- [ ] `relevance.ts` exports working `cosineSimilarity` and `createOpenAIEmbedder`
- [ ] Smoke tests pass (`pnpm turbo test`)

## Explicitly NOT in Day 1

- Decision CRUD (Day 2)
- Edge CRUD or graph traversal (Day 2)
- Context Compiler scoring (Day 3)
- Packer, formatter (Day 4)
- Change propagator (Day 5)
- API server routes (Day 8)
- SDK client (Day 9)
- Docker compose testing (Day 10)
- Any documentation
- Any demo code

---

## What this changes in execution

Backend has a concrete, ordered task list for Day 1. No ambiguity about what to build first or what "done" looks like. The pg pool setup (T9) is new — not in the original spec — and is the direct result of the AMB-1 decision. Every task references its spec section and has a verification step.
