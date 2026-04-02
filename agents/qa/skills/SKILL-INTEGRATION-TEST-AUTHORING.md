# SKILL-INTEGRATION-TEST-AUTHORING

## Purpose

Write integration tests against real PostgreSQL that follow Nexus test patterns: pool lifecycle, migration, data isolation, cleanup. Every integration test in Nexus uses the same structural pattern — deviation causes connection leaks, test pollution, or flaky results.

## When to Use

- Creating a new test file that touches the database
- Adding tests to an existing integration test file
- Debugging connection pool exhaustion or test flakiness
- Reviewing test code for pattern compliance

## Inputs Required

- `packages/core/tests/decision-graph.test.ts` — canonical integration test pattern (27 tests)
- `packages/core/tests/compiler.test.ts` — compile pipeline testing pattern (25 tests)
- `packages/sdk/tests/e2e.test.ts` — SDK→server→DB test pattern (27 tests)
- `packages/server/tests/routes.test.ts` — Hono `app.request()` pattern (26 tests)
- `packages/core/src/db/migrator.ts` — `migrate()` function
- All `vitest.config.ts` files — `fileParallelism: false`, timeout settings

## Execution Method

### The Canonical Pattern

Every integration test file follows this structure exactly:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { migrate } from '@nexus-ai/core';  // or relative path

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', '..', '..', 'supabase', 'migrations');
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://nexus:nexus_dev@localhost:5432/nexus';

let pool: pg.Pool;
let projectId: string;

beforeAll(async () => {
  // 1. Create pool with bounded connections
  pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 });
  // 2. Verify connection
  await pool.query('SELECT 1');
  // 3. Run migrations (idempotent — skips already-applied)
  await migrate(pool, MIGRATIONS_DIR);
  // 4. Create isolated test project
  const proj = await pool.query(
    `INSERT INTO projects (name) VALUES ('Test: <description>') RETURNING id`
  );
  projectId = proj.rows[0].id;
});

afterAll(async () => {
  if (pool && projectId) {
    // 5. Clean up test data (reverse FK order)
    await pool.query('DELETE FROM notifications WHERE agent_id IN (SELECT id FROM agents WHERE project_id = $1)', [projectId]);
    await pool.query('DELETE FROM decision_edges WHERE source_id IN (SELECT id FROM decisions WHERE project_id = $1)', [projectId]);
    await pool.query('DELETE FROM artifacts WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM decisions WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM agents WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
  }
  // 6. Always close pool
  await pool?.end();
});
```

### Non-Negotiable Rules

1. **`max: 5` on pool.** Tests run with `fileParallelism: false` but test files share the same PG instance. Unbounded pools exhaust connections.

2. **Unique project per test file.** Never share a project across test files. Each file creates its own project in `beforeAll` and deletes it in `afterAll`. This prevents cross-file data pollution.

3. **Cleanup in reverse FK order.** Notifications → edges → artifacts → decisions → agents → projects. Deleting in wrong order hits FK constraint errors (despite CASCADE, explicit cleanup is safer for test isolation).

4. **`await pool.end()` in `afterAll`.** Forgetting this causes Vitest to hang after test completion — open connections prevent Node.js from exiting.

5. **`fileParallelism: false` in `vitest.config.ts`.** Integration tests must not run files in parallel. They share a database and test execution is sequential within each file.

6. **`testTimeout: 30000` for integration tests.** Migration + DB operations can exceed the default 5s timeout, especially on first run.

### Test Data Accumulation Pattern

Tests within a describe block often accumulate state:

```typescript
const decisionIds: string[] = [];
const agentIds: string[] = [];

describe('Decisions', () => {
  it('creates decisions', async () => {
    const d = await createDecision(pool, { project_id: projectId, ... });
    decisionIds.push(d.id);  // Accumulate for later tests
  });

  it('lists decisions', async () => {
    const all = await listDecisions(pool, projectId);
    expect(all.length).toBe(decisionIds.length);  // Depends on prior test
  });
});
```

This is intentional — integration tests are ordered and stateful within a file. Vitest runs tests in declaration order within a `describe` block.

### SDK E2E Pattern (Fetch Interception)

The SDK E2E tests route through Hono's `app.request()` without a real HTTP server:

```typescript
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init?) => {
  const url = typeof input === 'string' ? input : input.url;
  if (url.startsWith('http://nexus-test:3000')) {
    const path = url.replace('http://nexus-test:3000', '');
    return appInstance.request(path, init) as unknown as Response;
  }
  return originalFetch(input, init);
};
```

This avoids port conflicts and network overhead while testing the full SDK→server→DB path.

### Do NOT Do This

- **Do not use `pool.query` after `pool.end()`.** The pool is destroyed. If you need queries in a test after `afterAll` runs, your test ordering is wrong.
- **Do not create pools inside individual tests.** One pool per file, created in `beforeAll`.
- **Do not rely on auto-increment ordering.** UUIDs have no natural order. Use `created_at` ordering or explicit sequencing.
- **Do not skip cleanup because "CASCADE handles it."** Explicit cleanup is more reliable in test environments and prevents cross-file leakage if project names collide.
- **Do not use `setTimeout` or `sleep` in tests.** If you're waiting for async operations, `await` them properly.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| Vitest hangs after completion | Pool not closed in `afterAll` | Process doesn't exit | Add `await pool.end()` |
| `too many clients already` | Pool `max` too high or pool not closed from prior run | PG connection error | Set `max: 5`, ensure `pool.end()` in `afterAll` |
| Test pollution (unexpected data) | Shared project across files | Extra rows in query results | Unique project per file |
| FK constraint violation in cleanup | Wrong deletion order | Error during `afterAll` | Delete in reverse FK order |
| `MIGRATIONS_DIR not found` | Wrong relative path from test file | `migrate()` throws | Verify `join(__dirname, '..', '..', '..', 'supabase', 'migrations')` resolves correctly |
| Timeout exceeded | Migration or complex query exceeds default 5s | Test timeout error | Set `testTimeout: 30000` in vitest config |

## Nexus-Specific Examples

**Current test file inventory with patterns used:**

| File | Package | Tests | Pattern |
|------|---------|-------|---------|
| `decision-graph.test.ts` | core | 27 | Direct pg CRUD |
| `scoring.test.ts` | core | 43 | Pure functions (no DB) |
| `compiler.test.ts` | core | 25 | DB + compile pipeline |
| `role-differentiation.test.ts` | core | 11 | DB + compile + cross-role comparison |
| `scenario.test.ts` | core | 11 | DB + compile + propagator + full lifecycle |
| `change-propagator.test.ts` | core | 13 | DB + propagator notifications |
| `migrator.test.ts` | core | 3 | Migrator-specific |
| `setup.test.ts` | core | 17 | Unit (types, roles, db client) |
| `e2e.test.ts` | sdk | 27 | Fetch interception + Hono app |
| `routes.test.ts` | server | 26 | Hono `app.request()` |

## Exit Criteria

- Test file follows the canonical pattern (pool lifecycle, migration, project isolation, cleanup)
- `pool.end()` called in `afterAll`
- `max: 5` on pool creation
- Cleanup deletes in reverse FK order
- `fileParallelism: false` set in vitest config
- Test timeout ≥ 30000ms for DB-touching tests
- No cross-file data dependencies
