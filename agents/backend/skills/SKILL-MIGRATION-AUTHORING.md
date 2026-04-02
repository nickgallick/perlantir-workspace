# SKILL-MIGRATION-AUTHORING

## Purpose

Author and apply PostgreSQL migrations using the Nexus custom migrator, with awareness of pgvector constraints, extension dependencies, and idempotent tracking.

## When to Use

- Any task requiring schema change (new tables, columns, indexes, functions, triggers)
- Adding features that need persistent storage (context_cache, session_summaries, api_keys)
- Fixing schema bugs or adding constraints
- Running migrations in new environments

## Inputs Required

- `packages/core/src/db/migrator.ts` — migration runner implementation
- `supabase/migrations/001_initial_schema.sql` — existing schema (9 tables, 2 functions, 3 triggers)
- `packages/core/src/types.ts` — TypeScript types that must align with schema
- `packages/core/tests/migrator.test.ts` — 3 migrator tests

## Execution Method

### Migration File Convention

1. **Directory**: `supabase/migrations/`
2. **Naming**: `NNN_descriptive_name.sql` — numeric prefix determines execution order. Use `002_`, `003_`, etc.
3. **Discovery**: Migrator calls `readdirSync().filter(f => f.endsWith('.sql')).sort()`. Alphabetical sort means `002_` runs before `010_`.
4. **Tracking**: Applied migrations recorded in `_nexus_migrations` table (name + applied_at). A migration runs only if its filename is absent from this table.

### Writing a Migration

5. **Each migration runs in a single transaction.** The migrator wraps each file in `BEGIN ... COMMIT`. Do not include your own `BEGIN/COMMIT` — it causes nested transaction errors.

6. **Idempotency within a file is optional but recommended.** Use `IF NOT EXISTS` for tables and indexes. For columns, use:
   ```sql
   DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'decisions' AND column_name = 'new_field'
     ) THEN
       ALTER TABLE decisions ADD COLUMN new_field TEXT;
     END IF;
   END $$;
   ```

7. **Extension creation requires superuser.** `CREATE EXTENSION IF NOT EXISTS vector` is in `001_initial_schema.sql` and was run by the `postgres` superuser. New migrations run as the `nexus` user — they **cannot** create extensions. If a new extension is needed, document it as a manual prerequisite.

8. **Foreign keys cascade.** All existing FK constraints use `ON DELETE CASCADE`. Maintain this pattern unless there's an explicit reason not to.

9. **Index naming**: `idx_{table}_{column}` or `idx_{table}_{column1}_{column2}`.

10. **JSONB columns** default to `'{}'::jsonb` or `'[]'::jsonb`. Never default to `NULL` for JSONB — it complicates parsing.

11. **TEXT[] columns** default to `'{}'`. Same reason.

### Aligning Schema with Types

12. **Every new column must have a corresponding TypeScript type field.** After writing the migration:
    - Add the field to the relevant type in `types.ts`
    - Add it to `CreateXInput` if it's settable at creation
    - Update the `parseXRow` function to handle JSONB/date parsing
    - Update the route handler to accept/return the field
    - Update the SDK method if the field is user-facing

13. **Column types to TypeScript type mapping:**

| PostgreSQL | TypeScript | parseRow handling |
|-----------|-----------|-------------------|
| UUID | string | Direct (node-postgres returns string) |
| TEXT | string | Direct |
| TEXT[] | string[] | Direct (node-postgres handles arrays) |
| INTEGER | number | Direct |
| BOOLEAN | boolean | Direct |
| TIMESTAMPTZ | string | `String(row.field)` |
| JSONB | object/array | `typeof === 'string' ? JSON.parse() : value` |
| vector(N) | number[] | `typeof === 'string' ? JSON.parse() : value` |

### Running Migrations

14. **Programmatic**: `await migrate(pool, migrationsDir)` — returns `{ applied: string[], skipped: string[], errors: { name, error }[] }`.

15. **In tests**: Every integration test calls `migrate(pool, MIGRATIONS_DIR)` in `beforeAll`. The migrator skips already-applied migrations (idempotent).

16. **Error recovery**: If a migration fails mid-transaction, it's rolled back. The filename is NOT recorded in `_nexus_migrations`. Fix the SQL, re-run — it will retry.

### Do NOT Do This

- **Do not modify `001_initial_schema.sql` after it has been applied.** The migrator tracks by filename. Modifying an applied migration has no effect. Write a new migration to alter existing tables.
- **Do not include `BEGIN`/`COMMIT` in migration SQL.** The migrator wraps each file.
- **Do not create extensions in non-superuser migrations.** Extensions require `postgres` superuser.
- **Do not use `DROP TABLE` without `IF EXISTS`.** Failed partial migrations may leave state that a retry needs to handle.
- **Do not add columns with `NOT NULL` without a `DEFAULT`.** Existing rows will violate the constraint. Use `ADD COLUMN field TEXT DEFAULT 'value' NOT NULL` or a multi-step migration (add nullable → backfill → add constraint).

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| `relation "_nexus_migrations" does not exist` | First run before `ensureMigrationsTable` | Automatic — migrator creates it | No action needed |
| `permission denied to create extension` | Migration tries `CREATE EXTENSION` as non-superuser | PostgreSQL error | Move extension creation to manual setup or superuser script |
| `column "X" of relation "Y" already exists` | Re-running a migration that was partially applied and not tracked | PostgreSQL error | Use `IF NOT EXISTS` pattern in DDL |
| Migration silently skipped | Filename already in `_nexus_migrations` from a prior run | `result.skipped` includes it | Expected behavior for idempotency |
| `cannot ALTER TABLE because it has pending trigger events` | Trigger fires during ALTER in same transaction | PostgreSQL error | Disable trigger, alter, re-enable trigger within migration |
| TypeScript types don't match new columns | Migration applied but `types.ts` not updated | Type errors at compile time, or silent runtime field omission | Always update types.ts + parseRow + route + SDK after migration |

## Nexus-Specific Examples

**Current schema tables (from 001_initial_schema.sql):**
```
projects, agents, decisions, decision_edges, artifacts,
subscriptions, notifications, session_summaries, context_cache
```

**Adding a new table (e.g., api_keys):**
```sql
-- 002_api_keys.sql
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_project ON api_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
```

Then: add `ApiKey` type to `types.ts`, add routes, add SDK methods, add tests.

## Exit Criteria

- Migration file follows naming convention and runs clean via `migrate()`
- No `BEGIN`/`COMMIT` inside migration SQL
- All new columns have corresponding TypeScript types
- `parseXRow` updated for any JSONB/date/vector columns
- Existing `migrator.test.ts` (3 tests) pass unchanged
- Migration is idempotent (re-running `migrate()` skips it)
- Foreign keys use `ON DELETE CASCADE` unless explicitly justified otherwise
