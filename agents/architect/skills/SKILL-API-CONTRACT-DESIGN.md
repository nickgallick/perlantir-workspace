# SKILL-API-CONTRACT-DESIGN

## Purpose

Design new API endpoints consistent with established Nexus patterns: route structure, error envelope, request validation, response shapes, auth middleware, and SDK alignment.

## When to Use

- Designing a new API endpoint
- Adding query parameters or response fields to existing routes
- Reviewing route handler code for pattern compliance
- Resolving disagreements about API shape between Backend and SDK consumers
- Designing error responses for new failure modes

## Inputs Required

- `packages/server/src/app.ts` — all existing route patterns (source of truth)
- `packages/server/src/middleware/errors.ts` — `AppError`, error envelope format
- `packages/server/src/middleware/validate.ts` — `requireFields`, `requireUUID`
- `packages/server/src/middleware/auth.ts` — auth middleware pattern
- `packages/sdk/src/client.ts` — SDK method patterns that must match server routes

## Execution Method

### Established Route Patterns

**URL structure:**
```
/api/{entity}                           — collection (POST create, GET list)
/api/{entity}/:id                       — instance (GET, PATCH, DELETE)
/api/{entity}/:id/{sub-entity}          — nested collection
/api/projects/:id/agents                — project-scoped agents
/api/projects/:id/decisions             — project-scoped decisions
/api/projects/:id/artifacts             — project-scoped artifacts
/api/decisions/:id/edges                — decision-scoped edges
/api/agents/:id/notifications           — agent-scoped notifications
/api/compile                            — action endpoint (POST)
/api/health                             — system endpoint (GET)
```

**HTTP methods:**
- `POST` → create (returns 201)
- `GET` → read/list (returns 200)
- `PATCH` → partial update (returns 200)
- `DELETE` → remove (returns 200 with `{ ok: true }`)

**Response conventions:**
- Single entity: return entity object directly (no wrapper)
- List: return array directly (no `{ data: [...] }` wrapper)
- Error: always `{ error: { code: string, message: string, details?: unknown } }`
- Delete success: `{ ok: true }`

### Error Envelope (Mandatory)

Every error response must use this shape:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable explanation",
    "details": { "field": "name", "issue": "required" }
  }
}
```

Error codes in use:
| Code | HTTP Status | When |
|------|-------------|------|
| `NOT_FOUND` | 404 | Entity doesn't exist |
| `VALIDATION_ERROR` | 400 | Missing required field, invalid UUID, bad input |
| `INTERNAL_ERROR` | 500 | Unhandled exception (via `app.onError()`) |

To throw a typed error: `throw new AppError(404, 'NOT_FOUND', 'Decision not found: ${id}')`.

Unhandled errors caught by `app.onError()` → logged to stderr → returned as `{ error: { code: 'INTERNAL_ERROR', message: '...' } }`.

### Validation Pattern

Validate at the top of every route handler, before any DB operation:

```typescript
app.post('/api/projects/:id/things', async (c) => {
  const projectId = c.req.param('id');
  requireUUID(projectId, 'project_id');           // Throws AppError(400) if invalid

  const body = await c.req.json();
  requireFields(body, ['name', 'type']);           // Throws AppError(400) if missing

  // ... DB operations only after validation passes
});
```

`requireUUID` checks: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`

`requireFields` checks: each field is present and non-null in the body object.

### Auth Pattern

All `/api/*` routes pass through `authMiddleware`:
- If `NEXUS_API_KEY` env var is set: requires `Authorization: Bearer <key>` header
- If not set (dev mode): all requests pass through
- Future: per-project key isolation (deferred)

### Designing a New Endpoint

1. **Choose URL** following the pattern above. Nest under the owning entity.
2. **Choose method**: CRUD maps to POST/GET/PATCH/DELETE. Actions use POST.
3. **Define request shape**: required fields → `requireFields`; UUID params → `requireUUID`
4. **Define response shape**: match an existing TypeScript type or create one in `types.ts`
5. **Define error cases**: what can go wrong → map each to an error code
6. **Write route handler**: validate → DB operation → parse row → return JSON
7. **Add SDK method**: matching return type, URL, and HTTP method
8. **Add test**: in `routes.test.ts` for success + error cases

### SDK Method Alignment Rules

Every server route must have a corresponding SDK method:

| Server | SDK |
|--------|-----|
| `POST /api/projects` | `createProject(input)` |
| `GET /api/projects/:id` | `getProject(id)` |
| `PATCH /api/decisions/:id` | `updateDecisionStatus(id, status, opts?)` |
| `DELETE /api/edges/:id` | `deleteEdge(edgeId)` |

SDK methods must:
- Use the same TypeScript types as the server
- Pass through `NexusApiError` on failure (preserves error envelope)
- Accept only typed parameters (no raw JSON body)
- Return typed responses (not `unknown`)

### Do NOT Do This

- **Do not return `{ data: entity }` wrappers.** Nexus returns entities directly. The only wrapper is `{ error: ... }` for errors.
- **Do not use `200` for create operations.** POST create returns `201`.
- **Do not skip `requireUUID` for path parameters that are UUIDs.** Invalid UUIDs hitting PostgreSQL cause ugly 500 errors instead of clean 400s.
- **Do not add routes outside `/api/` prefix.** Auth middleware is scoped to `/api/*`.
- **Do not return different shapes from the same endpoint based on query parameters.** Return type must be stable; use query params for filtering, not shape-shifting.
- **Do not add optional query parameters without documenting them** in the route handler and corresponding SDK method.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| SDK type mismatch | Server returns field not in TypeScript type | SDK consumer sees `undefined` | Update types.ts + SDK re-exports |
| Missing error envelope | Route throws plain Error instead of AppError | Client receives `{ error: { code: 'INTERNAL_ERROR' } }` | Use `throw new AppError(...)` |
| 500 for user input error | Validation skipped, invalid input hits PG | Ugly error message in response | Add requireFields/requireUUID before DB |
| Auth bypass | New route not under `/api/*` prefix | Route accessible without API key | Keep all routes under `/api/` |
| SDK method returns wrong type | Endpoint changed shape but SDK not updated | TypeScript error or runtime mismatch | Update SDK method after route change |

## Nexus-Specific Examples

**Current route inventory (14 routes):**
```
GET    /api/health
POST   /api/projects
GET    /api/projects/:id
POST   /api/projects/:id/agents
GET    /api/projects/:id/agents
POST   /api/projects/:id/decisions
GET    /api/projects/:id/decisions
GET    /api/decisions/:id
PATCH  /api/decisions/:id
POST   /api/decisions/:id/edges
GET    /api/decisions/:id/edges
DELETE /api/edges/:id
GET    /api/decisions/:id/graph
POST   /api/projects/:id/artifacts
GET    /api/projects/:id/artifacts
POST   /api/compile
GET    /api/agents/:id/notifications
PATCH  /api/notifications/:id/read
```

## Exit Criteria

- New route follows URL structure pattern (`/api/{entity}/...`)
- Error responses use `{ error: { code, message, details? } }` envelope
- All UUID path params validated with `requireUUID`
- All required body fields validated with `requireFields`
- Response shape matches a TypeScript type in `types.ts`
- Corresponding SDK method exists with matching types
- Route test added covering success + at least one error case
- Auth middleware applies (route under `/api/` prefix)
