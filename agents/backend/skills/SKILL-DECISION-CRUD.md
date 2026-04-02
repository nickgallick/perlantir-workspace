# SKILL-DECISION-CRUD

## Purpose

Implement and extend decision CRUD operations using pg.Pool with correct transaction patterns, JSONB handling, embedding integration, status lifecycle enforcement, and edge creation atomicity.

## When to Use

- Any task creating, reading, updating, or filtering decisions
- Adding fields to the decisions table or `CreateDecisionInput` type
- Debugging decision persistence bugs (missing fields, wrong types, constraint violations)
- Modifying the decision status lifecycle (`active → superseded → reverted`)
- Integrating optional embedding generation during creation

## Inputs Required

- `packages/core/src/decision-graph/graph.ts` — current CRUD implementations
- `packages/core/src/types.ts` — `Decision`, `CreateDecisionInput` types
- `supabase/migrations/001_initial_schema.sql` — decisions table schema, constraints, triggers
- `packages/server/src/app.ts` — route handlers that call CRUD functions
- `agents/backend/capabilities/NEXUS-KNOWN-SPEC-ISSUES.md` — known bugs affecting decisions

## Execution Method

### Decision Lifecycle State Machine

```
              ┌──────────┐
  create ──→  │  active   │ ←── restore (from reverted)
              └────┬──┬───┘
                   │  │
    supersede ─────┘  └───── revert
                   │           │
          ┌────────▼───┐  ┌───▼──────┐
          │ superseded │  │ reverted │
          └────────────┘  └──────────┘
```

Valid transitions: `active→superseded`, `active→reverted`, `reverted→active`, `superseded→active`. No direct `superseded↔reverted`.

### Creating Decisions

1. **Always use a transaction** when creating with edges. `createDecision` in `graph.ts` does `BEGIN → INSERT decision → INSERT edges → COMMIT`. Never split these into separate pool.query calls.

2. **JSONB fields** — `alternatives_considered` and `metadata` must be `JSON.stringify()`'d before passing to `$parameter`. PostgreSQL won't auto-cast JS objects to JSONB.

3. **Array fields** — `affects` and `tags` are `TEXT[]`. Pass as native JS arrays — node-postgres handles `TEXT[]` correctly. Do NOT stringify them.

4. **Embedding parameter** — Pass as string `[${embedding.join(',')}]` not as a JS array. pgvector expects a string representation for `vector(1536)`.

5. **Defaults** — `confidence` defaults to `'high'`, `status` defaults to `'active'` in both TypeScript and SQL. Don't pass `null` for these.

### Reading Decisions

6. **parseDecisionRow is critical.** Every query returning decision rows must pass through `parseDecisionRow`. It handles:
   - JSONB string→object for `alternatives_considered` and `metadata` (PostgreSQL may return either string or object depending on driver config)
   - Embedding string→number[] for `embedding`
   - Timestamp→string for `created_at`, `updated_at`, `validated_at`
   - Null→undefined for `supersedes_id`

7. **Never return raw `result.rows[0]`** from a decision query. Always parse.

### Updating Status

8. **`updateDecisionStatus` uses dynamic SET clauses.** Pattern:
   ```typescript
   const setClauses = ['status = $2'];
   const params: unknown[] = [id, status];
   let idx = 3;
   if (supersedes_id !== undefined) {
     setClauses.push(`supersedes_id = $${idx++}`);
     params.push(supersedes_id);
   }
   ```
   This avoids overwriting `supersedes_id` with null when only changing status.

9. **Restoring to active sets `validated_at = NOW()`** — this affects freshness scoring (validated decisions get 30-day half-life vs 7-day for unvalidated).

### Filtering Decisions

10. **listDecisions builds WHERE dynamically.** Pattern: start with `['project_id = $1']`, append conditions with incrementing `$idx`. Tags use `&&` (overlap) operator: `tags && $N` with a JS array parameter.

11. **Default limit is 100, offset is 0.** Always apply limits to prevent unbounded result sets.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| `duplicate key violates unique constraint "uq_agent_name_per_project"` | Trying to reuse agent name in same project | PostgreSQL error code 23505 | Use unique names or upsert |
| `null value in column "title" violates not-null constraint` | Missing required field | PostgreSQL error code 23502 | Validate at route level with `requireFields` before DB call |
| `invalid input syntax for type uuid` | Non-UUID string passed as ID | PostgreSQL error | Validate with `requireUUID` at route level |
| `value too long for type character varying` | Schema has no VARCHAR limits — this won't trigger, but TEXT fields can store arbitrarily large values | Silent — no error | Add application-level length limits if needed |
| Transaction left open after error | Missing `ROLLBACK` in catch block | Connection pool exhaustion over time | Always `client.release()` in `finally` |
| `embedding` returned as string instead of number[] | parseDecisionRow not called | SDK receives `"[0.1,0.2,...]"` string | Ensure all query paths use parseDecisionRow |
| `alternatives_considered` is string `"[]"` instead of array | parseDecisionRow not called | SDK receives unparsed JSONB | Ensure all query paths use parseDecisionRow |

## Nexus-Specific Examples

**Creating a decision with edges in one transaction:**
```typescript
const decision = await createDecision(pool, {
  project_id: projectId,
  title: 'Use JWT for API auth',
  description: 'Stateless JWT tokens for all API routes',
  reasoning: 'Scalability and statelessness',
  made_by: 'architect',
  affects: ['builder', 'reviewer'],  // JS array, not JSON.stringify
  tags: ['security', 'api'],          // JS array, not JSON.stringify
  confidence: 'high',
  edges: [{ target_id: otherDecisionId, relationship: 'requires' }],
});
// Transaction: decision INSERT + edge INSERT committed atomically
```

**Superseding a decision (two-step in route handler):**
```typescript
// 1. Mark old decision as superseded
await updateDecisionStatus(pool, oldId, 'superseded');
// 2. Create new decision with supersedes_id
const newDecision = await createDecision(pool, {
  ...input,
  supersedes_id: oldId,
});
// 3. Propagate change notification
await propagator.onDecisionSuperseded(newDecision, oldDecision);
```

## Exit Criteria

- All CRUD functions return properly parsed Decision objects (not raw rows)
- Transactions are used for any multi-statement write
- Status transitions match the state machine above
- All JSONB fields round-trip correctly: JS object → JSON.stringify → INSERT → SELECT → parseDecisionRow → JS object
- `affects` and `tags` round-trip as arrays, not stringified arrays
- 27 existing `decision-graph.test.ts` tests pass unchanged
