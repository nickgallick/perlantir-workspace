# SKILL-API-REFERENCE-GENERATION

## Purpose

Generate accurate API reference documentation from actual route implementations, including request/response types, error codes, query parameters, and working examples derived from test files.

## When to Use

- New API route added or existing route changed
- SDK method added (must have matching API docs)
- Pre-release documentation generation
- Developer onboarding material creation
- Responding to "how do I use endpoint X?" questions

## Inputs Required

**Source of truth (derive docs from these, never invent):**
- `packages/server/src/app.ts` — all route handlers (request shape, response shape, status codes)
- `packages/server/src/middleware/errors.ts` — error envelope format, error codes
- `packages/server/src/middleware/validate.ts` — validation rules (required fields, UUID format)
- `packages/server/src/middleware/auth.ts` — auth requirements

**Response type definitions:**
- `packages/core/src/types.ts` — all entity types (Project, Agent, Decision, etc.)

**Working examples (proven request/response pairs):**
- `packages/server/tests/routes.test.ts` — 26 E2E tests with exact request bodies and assertions
- `packages/sdk/tests/e2e.test.ts` — 27 SDK tests showing usage patterns

## Execution Method

### Current Route Inventory (18 endpoints)

Generate one documentation entry per endpoint. Each entry must include:

```
METHOD /path
  Auth: Required | Dev-mode optional
  Request: { field: type, ... } (with required/optional markers)
  Response: { ... } (HTTP status + body shape)
  Errors: [ { status, code, when } ]
  Example: (from test file, not invented)
```

### Route Documentation Template

For each endpoint, extract from `app.ts`:

**1. Path and method** — from `app.get/post/patch/delete(path, ...)`.

**2. Path parameters** — from `c.req.param('id')`. Document UUID requirement.

**3. Query parameters** — from `c.req.query('...')`. Document type and default.

**4. Request body** — from `await c.req.json()` + `requireFields(body, [...])`. Fields in `requireFields` are required; others are optional.

**5. Response body** — from `c.json(...)` call. Map to TypeScript type from `types.ts`.

**6. Status codes** — from `c.json(data, status)`. Document each possible status.

**7. Error cases** — from `throw new AppError(...)` calls within the handler.

### Deriving Examples from Tests

`routes.test.ts` contains working request/response pairs. Extract:

```typescript
// From test:
const { status, json } = await req('POST', '/api/projects', {
  name: 'E2E Test Project',
  description: 'End-to-end API test',
});
// status === 201
// json === { id: '...', name: 'E2E Test Project', description: '...', created_at: '...', ... }
```

Transform into documentation example:

```
POST /api/projects
Content-Type: application/json
Authorization: Bearer <api-key>

{ "name": "My Project", "description": "Optional description" }

→ 201 Created
{ "id": "uuid", "name": "My Project", "description": "...", "created_at": "...", "updated_at": "...", "metadata": {} }
```

### Cross-Reference with SDK Methods

Every endpoint must list its SDK equivalent:

| Endpoint | SDK Method |
|----------|-----------|
| `POST /api/projects` | `client.createProject(input)` |
| `GET /api/projects/:id` | `client.getProject(id)` |
| `POST /api/compile` | `client.compileContext(request)` or `client.compileForAgent(name, task, projectId)` |

Source: `packages/sdk/src/client.ts` — method signatures.

### Do NOT Do This

- **Do not invent request/response examples.** Extract from `routes.test.ts` or `e2e.test.ts`. Invented examples may contain wrong field names or types.
- **Do not document internal implementation details** (SQL queries, scoring formulas). API docs describe the interface, not the implementation.
- **Do not document routes that don't exist.** Cross-check against `app.ts`. If a route isn't in the code, it's not in the docs.
- **Do not omit error responses.** Every endpoint has at least one error case (400 validation, 404 not found). Document them.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| Documented endpoint doesn't exist | Route removed but docs not updated | 404 when consumer follows docs | Regenerate from `app.ts` |
| Wrong request body fields | Docs written from memory, not code | Consumer gets validation error | Cross-check `requireFields` in route handler |
| Missing error code documentation | New AppError added but not documented | Consumer surprised by unknown error code | Grep `new AppError` in `app.ts` |
| SDK method doesn't match docs | Endpoint changed but SDK not updated | Type mismatch at runtime | Verify SDK method signature matches route |

## Exit Criteria

- Every route in `app.ts` has a documented entry
- Every entry has: method, path, auth, request shape, response shape, error cases, example
- Every example is derived from test files (not invented)
- Every endpoint cross-referenced with its SDK method
- Error envelope shape documented once, referenced from all error cases
