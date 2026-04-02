# SKILL-SQL-INJECTION-AUDIT

## Purpose

Audit all database queries for SQL injection risk: verify parameterized query compliance, audit dynamic WHERE clause construction, and validate JSONB/array operator handling in raw pg.Pool queries.

**Relates to**: INV-9 (Cascade Deletion — SQL injection could bypass FK constraints or delete unintended data)

## When to Use

- Any new database query added to the codebase
- Code review of query changes in core or server packages
- Security audit before production deployment
- Any query using string interpolation, template literals, or dynamic clause construction

## Inputs Required

- `packages/core/src/decision-graph/graph.ts` — decision CRUD queries
- `packages/core/src/decision-graph/queries.ts` — edge CRUD queries
- `packages/core/src/decision-graph/traversal.ts` — recursive graph traversal
- `packages/core/src/change-propagator/propagator.ts` — agent lookup + notification insert
- `packages/core/src/change-propagator/subscriptions.ts` — subscription queries
- `packages/core/src/context-compiler/compiler.ts` — fetch queries (agent, decisions, artifacts, notifications, sessions)
- `packages/server/src/app.ts` — inline queries (projects, agents, artifacts, notifications)
- `packages/core/src/db/migrator.ts` — migration runner (executes raw SQL files)

## Execution Method

### Full Query Audit (Current State)

**SAFE — All parameterized (`$1`, `$2`, ...)**:

| File | Function | Query Pattern | Status |
|------|----------|---------------|--------|
| `graph.ts` | `createDecision` | `INSERT ... VALUES ($1, $2, ...$12)` | ✅ Safe |
| `graph.ts` | `getDecision` | `SELECT * WHERE id = $1` | ✅ Safe |
| `graph.ts` | `updateDecisionStatus` | Dynamic SET but parameterized (see below) | ⚠️ Reviewed |
| `queries.ts` | `createEdge` | `INSERT ... VALUES ($1, $2, $3, $4)` | ✅ Safe |
| `queries.ts` | All list/delete | `WHERE source_id = $1` etc. | ✅ Safe |
| `traversal.ts` | `getConnectedDecisions` | `SELECT get_connected_decisions($1, $2)` | ✅ Safe |
| `traversal.ts` | `getProjectGraph` | `WHERE d.project_id = $1` | ✅ Safe |
| `propagator.ts` | Agent lookup | `WHERE name = $1` | ✅ Safe |
| `propagator.ts` | Notification insert | `VALUES ($1, $2, $3, $4, $5)` | ✅ Safe |
| `subscriptions.ts` | All CRUD | Parameterized throughout | ✅ Safe |
| `compiler.ts` | `fetchAgent` | `WHERE id = $1` | ✅ Safe |
| `compiler.ts` | `fetchProjectDecisions` | `WHERE project_id = $1 AND status = ANY($2)` | ✅ Safe |
| `compiler.ts` | `fetchNotifications` | `WHERE agent_id = $1` | ✅ Safe |
| `app.ts` | Project CRUD | `INSERT ... VALUES ($1, $2, $3)`, `WHERE id = $1` | ✅ Safe |
| `app.ts` | Agent CRUD | `INSERT ... VALUES ($1, $2, $3, $4, $5)` | ✅ Safe |
| `app.ts` | Artifact CRUD | `INSERT ... VALUES ($1, ..., $9)` | ✅ Safe |
| `migrator.ts` | `migrate` | Executes raw SQL files | ⚠️ Special case |

**REQUIRES ATTENTION — Dynamic query construction**:

#### 1. `listDecisions` in `graph.ts` — Dynamic WHERE

```typescript
const conditions = ['project_id = $1'];
const params: unknown[] = [projectId];
let idx = 2;

if (options?.status) {
  conditions.push(`status = $${idx++}`);
  params.push(options.status);
}
if (options?.tags && options.tags.length > 0) {
  conditions.push(`tags && $${idx++}`);
  params.push(options.tags);
}

const result = await pool.query(
  `SELECT * FROM decisions WHERE ${conditions.join(' AND ')} ... LIMIT $${idx++} OFFSET $${idx++}`,
  [...params, limit, offset],
);
```

**Verdict**: SAFE. The dynamic part is `conditions.join(' AND ')` where each condition is a template with `$N` placeholder. User input goes only into `params[]`, never into the SQL string. The `status` and `tags` values are parameterized.

#### 2. `updateDecisionStatus` in `graph.ts` — Dynamic SET

```typescript
const setClauses = ['status = $2'];
const params: unknown[] = [id, status];
let idx = 3;

if (supersedes_id !== undefined) {
  setClauses.push(`supersedes_id = $${idx++}`);
  params.push(supersedes_id);
}
```

**Verdict**: SAFE. Same pattern — dynamic clause names are hardcoded strings, values are parameterized.

#### 3. `app.ts` notification listing — Dynamic WHERE

```typescript
const conditions = ['agent_id = $1'];
if (unread) conditions.push('read_at IS NULL');

const result = await pool.query(
  `SELECT * FROM notifications WHERE ${conditions.join(' AND ')} ...`,
  [agentId],
);
```

**Verdict**: SAFE. The `unread` flag adds a static condition (`read_at IS NULL`), not user-controlled SQL.

#### 4. `migrator.ts` — Executes raw SQL files

```typescript
const sql = readFileSync(join(dir, file), 'utf-8');
await client.query(sql);
```

**Verdict**: ACCEPTABLE RISK for v1. Migration files are developer-authored, not user-supplied. The migrator reads from `supabase/migrations/` directory. An attacker would need filesystem access to inject malicious SQL, at which point they already own the system.

### Attack Scenario: Parameter Index Mismatch

**Attack vector**: Not external injection, but a developer bug. If `$idx` is incremented incorrectly in dynamic query construction, parameters shift — a UUID might land in a text field or vice versa.

**Where it occurs**: `graph.ts:listDecisions` (6 parameters with dynamic indexing), `graph.ts:updateDecisionStatus` (3-4 parameters).

**Detection signal**: PostgreSQL type mismatch error (`invalid input syntax for type uuid`), or silently wrong data if types happen to be compatible.

**Mitigation**: Integration tests cover both functions with multiple filter combinations. Add a test that exercises all optional parameters simultaneously:
```typescript
await listDecisions(pool, projectId, { status: 'active', tags: ['api'], limit: 10, offset: 0 });
```

### Embedding String Injection

**Attack**: Create a decision with crafted text to manipulate the embedding vector via OpenAI API.

**Where it hits**: `graph.ts:createDecision` concatenates `title + description + reasoning` and passes to `embedFn`.

**Verdict**: Not an SQL injection risk. The embedding result is a `number[]` stored as `vector(1536)`. Even if the embedding API returns unexpected output, PostgreSQL's vector type rejects non-numeric values. The SQL uses parameterized `$12` for the embedding.

### Secure Enough for v1

**Already secure:**
- All queries use parameterized `$N` placeholders
- No string interpolation of user input into SQL
- Dynamic WHERE/SET construction uses safe pattern (hardcoded clause templates + parameterized values)
- pgvector column type rejects non-numeric injection

**Should validate before production:**
- `max_depth` parameter to `getConnectedDecisions` should be capped at 10 (currently passed through from query param)
- Enum values (`status`, `relationship`, `artifact_type`) should be validated before reaching SQL (see SKILL-API-INPUT-VALIDATION)

**Not a v1 concern:**
- ORM-level query building (we use raw pg, but safely)
- Prepared statements (node-postgres uses extended query protocol, which is equivalent)

### Do NOT Do This

- **Do not use template literals for SQL with user input.** `pool.query(\`SELECT * WHERE id = '${id}'\`)` is injection. Always use `$N` parameters.
- **Do not concatenate user values into `conditions[]` array entries.** The condition strings must be static templates like `status = $${idx}`, not `status = '${userValue}'`.
- **Do not pass user-controlled integers directly into SQL without parameterization.** Even `LIMIT ${userValue}` is injectable — use `LIMIT $${idx}`.
- **Do not trust that `requireUUID` prevents SQL injection.** It prevents format issues, but parameterization is the actual injection defense.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| `$N` index off by one | Dynamic `idx` incremented wrong | Wrong data in wrong column, or PG type error | Test all parameter combinations; add integration test |
| Raw SQL in migrator executes malicious file | Attacker gains filesystem write access | Unexpected schema changes | Not a v1 concern — filesystem access = game over |
| `max_depth` allows expensive traversal | `getConnectedDecisions(id, 999)` | Slow query, potential timeout | Cap at 10 in route handler |

## Exit Criteria

- Every `pool.query` and `client.query` call uses `$N` parameterization for all user-supplied values
- No template literal interpolation of user input into SQL strings
- Dynamic WHERE/SET construction verified: only static clause templates, values in params array
- `max_depth` capped at 10 for graph traversal endpoint
- Enum values validated before SQL (prevents CHECK constraint errors surfacing as 500s)
