# SKILL-SENSITIVE-DATA-EXPOSURE-REVIEW

## Purpose

Review all output surfaces — API responses, error messages, health endpoint, logs, stderr — for accidental leakage of secrets, internal state, stack traces, database credentials, or sensitive decision content.

**Relates to**: INV-3 (Error Envelope Consistency — error responses must not leak internals beyond the defined envelope shape)

## When to Use

- Pre-production security review
- New error handler or logging statement added
- Health endpoint changes
- Any endpoint returning internal state or configuration
- Environment variable handling changes

## Inputs Required

- `packages/server/src/middleware/errors.ts` — `onError` handler (logs full stack to stderr)
- `packages/server/src/app.ts` — health endpoint, error responses, inline queries
- `packages/server/src/middleware/auth.ts` — reads `NEXUS_API_KEY` from `process.env`
- `packages/core/src/db/client.ts` — reads `DATABASE_URL` from environment
- `agents/security/capabilities/NEXUS-THREAT-MODEL.md` — MEDIUM: OpenAI API Key Exposure

## Execution Method

### Exposure Surface Inventory

#### Surface 1: Error Responses (HTTP)

**Current behavior** — `errors.ts` `onError` handler:

```typescript
// AppError → controlled envelope
{ error: { code: err.code, message: err.message, details: err.details } }

// Unhandled Error → leaks error message
const message = err instanceof Error ? err.message : 'Internal server error';
console.error('[NEXUS] Unhandled error:', err);  // Full stack to stderr
return c.json({ error: { code: 'INTERNAL_ERROR', message } }, 500);
```

**Exposure**: The `message` field for unhandled errors contains the raw Error message. This can include:
- Database connection strings: `connection refused to postgresql://nexus:nexus_dev@localhost:5432/nexus`
- SQL errors with query fragments: `relation "nonexistent" does not exist`
- Node.js internal errors with file paths: `Cannot find module '/data/.openclaw/workspace/nexus/...'`

**Attack scenario**: Send a malformed request that triggers an unhandled error. The 500 response reveals internal paths, database host, or query structure.

**Concrete example** — already observable in test output:
```
stderr | tests/routes.test.ts > Compile > compile with invalid agent_id returns error
[NEXUS] Unhandled error: Error: Agent not found: 00000000-0000-0000-0000-000000000000
    at compile (/data/.openclaw/workspace/nexus/packages/core/src/context-compiler/compiler.ts:78:11)
```

This stack trace goes to stderr (acceptable for dev) but the error `message` also goes to the HTTP response.

**Mitigation**:
```typescript
// In registerErrorHandler, replace:
const message = err instanceof Error ? err.message : 'Internal server error';

// With:
const message = 'Internal server error';  // Never expose raw error messages
console.error('[NEXUS] Unhandled error:', err);  // Keep full error in logs only
```

For production, the HTTP response should always say `"Internal server error"` for unhandled errors. The detailed message stays in server logs only.

#### Surface 2: Health Endpoint

**Current behavior** — `GET /api/health`:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "dependencies": { "database": "connected" },
  "timestamp": "2026-04-02T..."
}
```

**Exposure**: Version number and dependency state. Minor risk — reveals the software version and confirms PostgreSQL is the backend.

**v1 verdict**: Acceptable. Self-hosted tool where the operator knows the stack. If Nexus becomes a SaaS, remove version and dependency details from the public health endpoint.

#### Surface 3: Stderr Logging

**Current behavior**: `console.error('[NEXUS] Unhandled error:', err)` logs the full Error object including stack trace to stderr.

**Exposure**: In Docker, stderr goes to container logs (`docker logs`). Stack traces reveal:
- Absolute file paths inside the container
- Function names and line numbers
- Dependency paths in `node_modules`

**v1 verdict**: Acceptable. Operator controls the container and log access. For production, consider structured logging that redacts sensitive fields.

#### Surface 4: Environment Variables

**Current behavior**:
- `auth.ts` reads `process.env.NEXUS_API_KEY` — compared but never logged or returned
- `client.ts` reads `process.env.DATABASE_URL` — passed to pg.Pool constructor, never logged
- Demo expects `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` in env

**Exposure check**:
```bash
# Verify no env vars are logged or returned in responses
grep -rn "process.env" packages/*/src/ --include="*.ts"
```

Current results: `auth.ts` (read only, not logged), `client.ts` (read only, not logged). No env vars are included in API responses or logged.

**v1 verdict**: Safe. No env var leakage found.

#### Surface 5: Database Error Messages

**Current behavior**: PostgreSQL errors bubble up as unhandled exceptions. Examples:
- `duplicate key value violates unique constraint "uq_agent_name_per_project"` — reveals table structure
- `invalid input syntax for type uuid: "not-a-uuid"` — reveals column type
- `null value in column "title" of relation "decisions" violates not-null constraint` — reveals column name

These reach the HTTP response via the unhandled error path (Surface 1).

**Mitigation**: Same as Surface 1 — don't expose raw error messages in HTTP responses. Optionally, catch common PG error codes and return friendly messages:

```typescript
// In route handlers or a middleware:
if (err.code === '23505') throw new AppError(409, 'CONFLICT', 'Resource already exists');
if (err.code === '23502') throw new AppError(400, 'VALIDATION_ERROR', 'Missing required field');
if (err.code === '23503') throw new AppError(400, 'VALIDATION_ERROR', 'Referenced resource not found');
```

#### Surface 6: Compiled Context Content

**Current behavior**: `formatted_markdown` and `formatted_json` include full decision text (title, description, reasoning, alternatives). This is by design — it's the product's purpose.

**Exposure**: If an API consumer forwards compiled context to untrusted parties, decision content leaks. This is an operator responsibility, not a Nexus vulnerability.

**v1 verdict**: Acceptable. Document that compiled context should be treated as confidential project data.

### Secure Enough for v1

**Must fix before production:**
- Replace raw error messages in 500 responses with generic `"Internal server error"`
- Keep detailed errors in stderr only

**Should fix before production:**
- Map common PG error codes (23505, 23502, 23503) to friendly AppError responses
- Add a startup check that warns if `NEXUS_API_KEY` is not set (currently silent dev mode)

**Acceptable for v1:**
- Health endpoint exposing version and dependency state
- Stack traces in stderr/container logs
- No env var logging (already clean)
- Decision content in compiled output (by design)

**Not v1:**
- Structured logging with field redaction
- Audit log of who accessed what decisions
- Compiled context access control

### Do NOT Do This

- **Do not log `process.env` or `JSON.stringify(process.env)` anywhere.** This leaks all secrets.
- **Do not include `err.stack` in HTTP responses.** Stack traces go to stderr only.
- **Do not echo back the `Authorization` header in error responses.** The API key is sensitive.
- **Do not log request bodies that may contain decision content.** Decision descriptions could contain proprietary information.
- **Do not suppress stderr logging entirely.** Operators need logs for debugging. Just don't send them to HTTP clients.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| DATABASE_URL in 500 response | PG connection error bubbles to client | Error message contains `postgresql://` | Generic 500 message, details in stderr only |
| File paths in 500 response | Unhandled import/module error | Error message contains `/data/.openclaw/` | Generic 500 message |
| API key in logs | Added `console.log(req.headers)` for debugging | Grep logs for Bearer token | Remove debug logging, never log auth headers |
| PG constraint error reveals schema | Unique violation message in 500 response | Message contains table/column names | Map PG error codes to AppError |

## Exit Criteria

- 500 responses return `"Internal server error"` (not raw Error messages)
- stderr logs contain detailed errors (for operator debugging)
- No API keys, database URLs, or file paths in any HTTP response
- `grep -rn "process.env" packages/*/src/` shows read-only access, no logging
- Health endpoint does not expose secrets (version/dependency state acceptable for v1)
- Common PG error codes mapped to friendly 400/409 responses
