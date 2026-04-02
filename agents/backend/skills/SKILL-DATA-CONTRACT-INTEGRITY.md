# SKILL-DATA-CONTRACT-INTEGRITY

## Purpose

Prevent drift between the 5 layers of Nexus data representation: PostgreSQL schema → SQL row shapes → TypeScript types → API response shapes → SDK type expectations. In a raw-pg system with no ORM, each layer parses independently. Drift is silent until it reaches a consumer.

## When to Use

- Adding a column to any table
- Changing a TypeScript type in `types.ts`
- Adding or modifying an API route that returns entity data
- Modifying any `parseRow` / `parseDecisionRow` / `parseAgentRow` / `parseEdgeRow` function
- Adding SDK type re-exports
- Debugging "field is undefined", "field is string instead of object", or "field missing from response"
- Pre-merge review of any change touching types, schema, or route handlers

## Inputs Required

- `supabase/migrations/001_initial_schema.sql` — ground truth schema
- `packages/core/src/types.ts` — TypeScript type definitions
- `packages/core/src/decision-graph/graph.ts` — `parseDecisionRow` (core queries)
- `packages/core/src/decision-graph/queries.ts` — `parseEdgeRow` (edge queries)
- `packages/core/src/context-compiler/compiler.ts` — `parseDecisionRow` (duplicate), `parseArtifactRow`, agent/notification parsers
- `packages/server/src/app.ts` — `parseRow`, `parseAgentRow` (server inline parsers)
- `packages/sdk/src/client.ts` — SDK method return types
- `packages/sdk/src/index.ts` — re-exported type list

## Execution Method

### The 5 Layers

```
Layer 1: PostgreSQL Schema (ground truth)
  ↓ pg.Pool query returns raw rows
Layer 2: SQL Row Shapes (what node-postgres gives you)
  ↓ parseXRow functions
Layer 3: TypeScript Types (what the code expects)
  ↓ route handlers / compile()
Layer 4: API Response Shapes (what JSON goes over HTTP)
  ↓ SDK fetch + json()
Layer 5: SDK Type Expectations (what consumers see)
```

### Layer 1→2: PostgreSQL to node-postgres

node-postgres type mapping (actual behavior, not documentation):

| PostgreSQL | node-postgres returns | Gotcha |
|-----------|----------------------|--------|
| UUID | `string` | Clean |
| TEXT | `string` | Clean |
| TEXT[] | `string[]` | Clean — pg handles arrays natively |
| INTEGER | `number` | Clean |
| BOOLEAN | `boolean` | Clean |
| TIMESTAMPTZ | `Date` object | **Must call `String()` to match TS type** |
| JSONB | `object` OR `string` | **Depends on pg config. Assume either.** |
| vector(N) | `string` like `"[0.1,0.2,...]"` | **Must JSON.parse to number[]** |

Critical: JSONB columns can return either parsed objects or strings depending on the pg driver version and connection settings. Every parseRow function must handle both cases.

### Layer 2→3: parseRow Obligations

Every entity type has parser functions. They are currently **duplicated across files**:

| Entity | Parser locations | Inconsistency risk |
|--------|-----------------|-------------------|
| Decision | `graph.ts:parseDecisionRow`, `compiler.ts:parseDecisionRow` | Two copies — must stay in sync |
| Agent | `compiler.ts:fetchAgent`, `propagator.ts:parseAgentRow`, `app.ts:parseAgentRow` | Three copies |
| Edge | `queries.ts:parseEdgeRow` | Single copy (good) |
| Artifact | `compiler.ts:parseArtifactRow`, `app.ts:parseRow` | Two copies, different logic |
| Notification | `compiler.ts:fetchNotifications` (inline), `app.ts` (inline) | No dedicated parser |
| Project | `app.ts:parseRow` only | Single location |

**Known risk**: The Decision parser exists in both `graph.ts` and `compiler.ts`. If you change one, you must change the other. Future improvement: extract to a shared `parsers.ts`.

### Layer 3→4: Route Handler Obligations

Route handlers in `app.ts` must:
1. Call the appropriate parser for database rows
2. Not add or omit fields compared to the TypeScript type
3. Return consistent JSON structure (no `undefined` values — JSON.stringify drops them)

**The `parseRow` in app.ts is a generic catch-all** used for projects and artifacts. It handles `metadata` and timestamps but nothing else. Agent rows go through `parseAgentRow` which also parses `relevance_profile`.

### Layer 4→5: SDK Type Alignment

The SDK re-exports types from `@nexus-ai/core` via `packages/sdk/src/index.ts`. The SDK's `NexusClient` methods declare return types like `Promise<Decision>`, `Promise<Agent[]>`, etc.

**The SDK does zero parsing.** It trusts the server to return correctly-shaped JSON. If the server returns `relevance_profile` as a string, the SDK will hand that string to the consumer typed as `RelevanceProfile` (an object). TypeScript won't catch this at runtime.

### Verification Checklist (Run When Changing Any Layer)

For each entity type affected by the change:

- [ ] Schema column exists with correct type and constraints
- [ ] TypeScript type in `types.ts` has matching field (correct type, correct optionality)
- [ ] `CreateXInput` includes the field if settable at creation
- [ ] ALL parseRow copies handle the field (JSONB parsing, date stringification)
- [ ] Route handler passes the field through (not silently dropped)
- [ ] SDK method return type includes the field
- [ ] SDK re-exports the type if it's new
- [ ] At least one test verifies the field round-trips correctly

### Do NOT Do This

- **Do not add a schema column without updating `types.ts`.** The field will exist in DB rows but be invisible to TypeScript. Consumers will see `undefined` for a field that has data.
- **Do not add a JSONB column without `typeof === 'string' ? JSON.parse() : value` in the parser.** It will work in your test environment and break in another pg configuration.
- **Do not return raw `result.rows` from route handlers without parsing.** TIMESTAMPTZ comes back as Date objects; JSONB may come back as strings. The HTTP response must be clean JSON.
- **Do not assume `JSON.stringify()` handles `undefined` the same as `null`.** Undefined fields are omitted from JSON. If a field should be explicitly null in the API response, convert `undefined` to `null` in the route handler.
- **Do not modify one parseDecisionRow copy without checking the other.** There are two in the codebase (`graph.ts` and `compiler.ts`).

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| `relevance_profile` is a string in SDK response | `parseAgentRow` not called in route handler | SDK consumer sees `"{"weights":...}"` instead of object | Add/fix parser call in route |
| `alternatives_considered` is `"[]"` string | `parseDecisionRow` not called | SDK consumer can't iterate array | Add/fix parser call |
| `embedding` is `"[0.1,0.2,...]"` string | vector column returned as string, not parsed | cosine_similarity fails (string vs number[]) | Parse in `parseDecisionRow` |
| New field exists in DB but missing from API response | Field added to migration + types but not to SELECT or parser | SDK sees `undefined` | Add to query/parser/route |
| Field appears in core types but not SDK exports | `types.ts` updated but `sdk/index.ts` re-export list not updated | SDK consumer gets `any` type | Add to re-export list |
| Date field comparison fails | TIMESTAMPTZ returned as Date object, stringified inconsistently | `created_at` is `"2026-04-02T..."` vs `"Tue Apr 02 2026..."` | Always use `String(row.field)` for consistent ISO-ish format |

## Nexus-Specific Examples

**The Day 6b parseAgentRow bug (discovered and fixed):**

The server's `parseAgentRow` was added specifically because `parseRow` (generic) didn't handle `relevance_profile` JSONB. Without it, agents returned from `GET /api/projects/:id/agents` had `relevance_profile` as a string, breaking any SDK consumer that accessed `.weights`.

**Current parser duplication inventory:**

```
parseDecisionRow:  graph.ts (line ~155), compiler.ts (line ~280)
parseAgentRow:     propagator.ts (line ~170), app.ts (line ~370)
parseEdgeRow:      queries.ts (line ~95)
parseArtifactRow:  compiler.ts (line ~300)
parseRow:          app.ts (line ~360) — generic, projects + artifacts
```

## Exit Criteria

- All 5 layers agree on field names, types, and optionality for every entity
- No JSONB field returned as a string to SDK consumers
- No TIMESTAMPTZ field returned as a Date object to SDK consumers
- Parser functions handle both string and object forms for JSONB
- Verification checklist passes for all entity types affected by the change
- No type re-export gaps between core and SDK
- E2E tests through SDK boundary (36 tests in `e2e.test.ts`) pass
