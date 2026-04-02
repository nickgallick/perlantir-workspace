# SKILL-AUTH-MIDDLEWARE-REVIEW

## Purpose

Review and harden the API key authentication middleware: timing attack prevention, key storage patterns, dev mode bypass safety, and the path to per-project key isolation.

## When to Use

- Before production deployment
- Implementing per-project API keys
- Adding rate limiting to auth endpoints
- Reviewing auth bypass conditions
- Investigating unauthorized access reports

## Inputs Required

- `packages/server/src/middleware/auth.ts` — current implementation
- `agents/security/capabilities/NEXUS-THREAT-MODEL.md` — HIGH: API Key Management
- `supabase/migrations/001_initial_schema.sql` — no api_keys table yet (planned)

## Execution Method

### Current Auth State

```typescript
// auth.ts — complete implementation
export async function authMiddleware(c: Context, next: Next): Promise<void> {
  const apiKey = process.env.NEXUS_API_KEY;
  if (!apiKey) { await next(); return; }        // Dev mode: skip auth entirely

  const authHeader = c.req.header('Authorization');
  if (!authHeader) throw new AppError(401, 'AUTH_REQUIRED', '...');

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError(401, 'AUTH_INVALID', '...');

  if (token !== apiKey) throw new AppError(403, 'AUTH_FORBIDDEN', 'Invalid API key');

  await next();
}
```

### Vulnerability 1: Timing Attack on Key Comparison

**Attack**: The comparison `token !== apiKey` uses JavaScript's `!==` which short-circuits on first mismatched character. An attacker can measure response times to infer the key character by character.

**Where it hits**: `packages/server/src/middleware/auth.ts` line ~36.

**Practical risk for v1**: LOW. Timing attacks require microsecond-level measurement, many thousands of requests, and stable network latency. On a VPS with network jitter, this is extremely difficult. But the fix is trivial.

**Mitigation**:
```typescript
import { timingSafeEqual } from 'node:crypto';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;  // Length leak is acceptable (key length is not secret)
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Replace: if (token !== apiKey)
// With:    if (!safeCompare(token, apiKey))
```

### Vulnerability 2: Dev Mode Bypass

**Attack**: If `NEXUS_API_KEY` env var is unset, ALL requests pass through unauthenticated. In production, if the env var is accidentally omitted from the Docker config, the API is wide open.

**Where it hits**: `packages/server/src/middleware/auth.ts` line ~25.

**Detection signal**: None — no log, no warning, silent bypass.

**Mitigation for v1**:
```typescript
// At server startup (not in middleware):
if (!process.env.NEXUS_API_KEY) {
  console.warn('[NEXUS] ⚠️  NEXUS_API_KEY not set — API authentication DISABLED (dev mode)');
}
```

This doesn't block startup (dev mode is legitimate) but makes the bypass visible.

**Future mitigation**: Add `NEXUS_ENV=production` check. In production mode, refuse to start without `NEXUS_API_KEY`.

### Vulnerability 3: Key in Process Memory

**Current state**: The API key is read from `process.env.NEXUS_API_KEY` on every request. It remains in the process's environment variables for the lifetime of the process.

**Risk**: LOW. An attacker with access to process memory already owns the system. Node.js doesn't support clearing env vars securely.

**v1 verdict**: Acceptable. No mitigation needed.

### Path to Per-Project Key Isolation

Current: single global key. Future: per-project keys with the `api_keys` table.

**Migration path**:
1. Create `api_keys` table (see SKILL-SCHEMA-EVOLUTION for schema)
2. Store key hashes (SHA-256 of the raw key), never plaintext
3. At key creation: generate random key → return to user once → store SHA-256 hash
4. At auth: hash the Bearer token → look up in `api_keys` table → verify project scope
5. Rate limit: per key, tracked in Redis or in-memory

**Auth middleware evolution**:
```typescript
export async function authMiddleware(c: Context, next: Next): Promise<void> {
  // Phase 1 (current): single env var key
  // Phase 2: check api_keys table
  //   const keyHash = sha256(token);
  //   const row = await pool.query('SELECT * FROM api_keys WHERE key_hash = $1', [keyHash]);
  //   if (!row) throw 403;
  //   if (row.expires_at && row.expires_at < now) throw 403;
  //   c.set('projectId', row.project_id);  // Scope subsequent queries
  //   await pool.query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [row.id]);
  // Phase 3: rate limiting per key
}
```

### Secure Enough for v1

**Must fix before production:**
- Replace `!==` with `timingSafeEqual` for key comparison (trivial fix, eliminates timing attack)
- Add startup warning when `NEXUS_API_KEY` is unset

**Should fix before production:**
- Log failed auth attempts (IP, timestamp, scheme) for monitoring

**Acceptable for v1:**
- Single global API key (no per-project isolation)
- Key in env var (standard practice)
- No key rotation mechanism
- No rate limiting on auth failures
- Dev mode bypass (with startup warning)

**Not v1:**
- Per-project API keys (`api_keys` table)
- Key rotation and expiry
- Rate limiting per key
- Scoped permissions per key
- OAuth/JWT token support

### Do NOT Do This

- **Do not store API keys in plaintext in the database.** Always hash with SHA-256 or stronger.
- **Do not return the full API key after creation.** Show once at creation time, then only store the hash.
- **Do not log the Bearer token value.** Log that auth failed, not what the token was.
- **Do not add auth routes (key creation, rotation) without input validation.** Key names need length limits, key permissions need structure validation.
- **Do not disable auth middleware for specific routes** by moving them outside `/api/`. All data routes must be authenticated.

## Failure Modes

| Failure | Cause | Detection | Fix |
|---------|-------|-----------|-----|
| API open without auth | `NEXUS_API_KEY` not set in production | No detection (silent) | Add startup warning; add `NEXUS_ENV=production` guard |
| Timing attack on key | `!==` comparison | Statistical response time analysis (difficult) | Use `timingSafeEqual` |
| Key leaked in logs | `console.log` of request headers added for debugging | Grep logs for Bearer | Never log auth headers |
| Auth bypass via missing header check | Middleware skipped for non-`/api/` routes | Unauthed access to data | Keep all data routes under `/api/` |

## Exit Criteria

- Key comparison uses `timingSafeEqual` (not `===` or `!==`)
- Startup warning logged when `NEXUS_API_KEY` is unset
- Failed auth attempts do not reveal whether the key exists or its length
- No API key values in logs, errors, or HTTP responses
- Auth middleware applies to all `/api/*` routes without exception
