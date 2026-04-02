# SKILL-SCHEMA-EVOLUTION

## Purpose

Design schema changes for Nexus that maintain backward compatibility, preserve existing data, work within PostgreSQL 17 + pgvector constraints, and keep the schema-to-type contract intact across all layers.

## When to Use

- Any feature requiring new tables, columns, indexes, or functions
- Schema refactoring (splitting tables, adding constraints, changing column types)
- Adding pgvector indexes (IVFFlat vs HNSW tradeoffs)
- Planning migration ordering when multiple schema changes are needed
- Reviewing Backend's migration SQL for architectural correctness

## Inputs Required

- `supabase/migrations/001_initial_schema.sql` — current schema (9 tables, 2 functions, 3 triggers)
- `packages/core/src/types.ts` — TypeScript types that must mirror schema
- `agents/architect/capabilities/NEXUS-LOCKED-DECISIONS.md` — stack constraints (PG17, pgvector, raw pg)
- `agents/architect/capabilities/NEXUS-ARCHITECTURE-BRIEF.md` — system topology

## Execution Method

### Current Schema Inventory

```
Tables (9):
  projects             — root entity, all others FK to this
  agents               — per-project, unique(project_id, name)
  decisions            — graph nodes, JSONB fields, TEXT[], vector(1536)
  decision_edges       — graph edges, typed relationships
  artifacts            — project outputs, related_decision_ids TEXT[]
  subscriptions        — agent notification preferences
  notifications        — persisted change events
  session_summaries    — optional session context
  context_cache        — compilation cache (exists in schema, not yet used)

Functions (2):
  update_updated_at_column()          — trigger function for updated_at
  get_connected_decisions(uuid, int)  — recursive graph traversal via LATERAL JOIN

Triggers (3):
  update_projects_updated_at
  update_agents_updated_at
  update_decisions_updated_at

Extensions (2):
  vector    — pgvector for embedding columns
  uuid-ossp — uuid_generate_v4() for primary keys
```

### Schema Change Decision Framework

**Adding a new table:**
1. Define purpose and relationship to existing tables
2. Every table must have: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
3. If updated frequently: add `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` + trigger
4. Foreign keys to `projects(id)` use `ON DELETE CASCADE` (single-tenant, project deletion cascades)
5. JSONB columns default to `'{}'::jsonb` or `'[]'::jsonb`, never NULL
6. TEXT[] columns default to `'{}'`
7. Add indexes for all foreign key columns and common query patterns

**Adding a column to an existing table:**
1. Use `ALTER TABLE ... ADD COLUMN` in a new migration (never modify 001)
2. If NOT NULL: must provide DEFAULT, or do 3-step: add nullable → backfill → add constraint
3. If JSONB: default to `'{}'::jsonb`
4. Update `types.ts` (type + CreateInput), all parseRow functions, route handler, SDK method

**Adding an index:**
1. Use `CREATE INDEX IF NOT EXISTS` (idempotent)
2. For pgvector: choose IVFFlat (faster build, good for < 1M rows) or HNSW (better recall, slower build)
3. Current embedding index: `CREATE INDEX idx_decisions_embedding ON decisions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
4. IVFFlat requires `lists` parameter: sqrt(row_count) is a good starting point

**Changing a column type:**
1. Avoid if possible — prefer adding a new column and deprecating the old one
2. If necessary: `ALTER TABLE ... ALTER COLUMN ... TYPE ... USING ...`
3. USING clause required for non-implicit casts
4. Test with real data volumes — type changes acquire ACCESS EXCLUSIVE lock

### PostgreSQL 17 Specifics

- **LATERAL JOIN pattern**: The `get_connected_decisions` function uses `LATERAL JOIN` instead of recursive CTE with subquery. PG17 is stricter about correlated subquery references in recursive CTEs. Any new recursive function must follow this pattern.
- **Generated columns**: PG17 supports stored generated columns. Consider for computed fields instead of application-level computation.
- **JSON subscripting**: PG17 supports `jsonb['key']` subscript syntax in addition to `->` and `->>`.

### Migration Ordering Rules

1. Extensions before tables that use them
2. Tables before tables that reference them (FK ordering)
3. Tables before indexes on those tables
4. Tables before functions that query them
5. Functions before triggers that call them
6. Within a single migration file: ordering is linear (PostgreSQL executes top-to-bottom)

### Do NOT Do This

- **Do not add `ON DELETE SET NULL` for project-scoped FKs.** Nexus is single-tenant; orphaned rows are data corruption. Use `ON DELETE CASCADE`.
- **Do not create `vector(N)` columns with N ≠ 1536** unless changing the embedding model. OpenAI text-embedding-3-small produces 1536 dimensions. Mismatched dimensions cause insertion errors.
- **Do not add tables without `created_at`.** Freshness scoring depends on timestamps existing.
- **Do not use `SERIAL` for IDs.** Nexus uses `UUID PRIMARY KEY DEFAULT uuid_generate_v4()` everywhere. SERIAL would break the type system (number vs string).
- **Do not add CHECK constraints that could reject existing data** without first verifying all existing rows pass.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| `extension "vector" is not available` | pgvector not installed on PG instance | CREATE EXTENSION fails | Install pgvector package, restart PG |
| `relation "X" already exists` | Re-running a migration with non-idempotent DDL | Migration error | Use `IF NOT EXISTS` |
| `cannot add NOT NULL column with no DEFAULT` | Adding NOT NULL column to table with existing rows | Migration error | Add with DEFAULT or make nullable first |
| `deadlock detected` | Concurrent schema changes on same table | Migration error in CI | Serialize migrations; never run concurrently |
| Foreign key violation on INSERT | Parent row deleted mid-operation | Application error | CASCADE handles this for project-scoped FKs |
| pgvector index build OOM | IVFFlat with too many lists for data size | PG crashes or returns error | Reduce `lists` parameter; ensure adequate `maintenance_work_mem` |

## Nexus-Specific Examples

**Planned schema additions (from deferred items):**

```sql
-- context_cache: exists in schema but unused by compiler
-- api_keys: per-project authentication (deferred)
-- session_summaries: exists but opt-in, not actively used

-- Example: adding api_keys table (Day 8+ candidate)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,             -- bcrypt/argon2 hash, never plaintext
  name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  rate_limit_per_min INTEGER NOT NULL DEFAULT 60,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_keys_project ON api_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
```

## Exit Criteria

- Schema change maintains FK cascade chain from projects
- All new columns have corresponding TypeScript type fields
- Migration is idempotent (uses `IF NOT EXISTS` where applicable)
- No ACCESS EXCLUSIVE locks on hot tables without explicit justification
- pgvector index strategy documented if embedding columns added
- Existing 3 migrator tests pass unchanged
- No orphaned data possible after DELETE CASCADE
