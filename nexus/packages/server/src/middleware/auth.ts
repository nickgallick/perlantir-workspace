// ============================================================
// NEXUS v1 — API Key Authentication Middleware
// AMB-3: Lightweight stub — validates Bearer token against NEXUS_API_KEY env var
// If NEXUS_API_KEY is not set, auth is disabled (dev mode).
//
// Remaining work for production:
// - Per-project API key isolation (api_keys table)
// - Key rotation and expiry
// - Rate limiting per key
// - Scoped permissions per key
// ============================================================

import { timingSafeEqual } from 'node:crypto';
import type { Context, Next } from 'hono';
import { AppError } from './errors.js';

/**
 * API key authentication middleware.
 * Checks Authorization: Bearer <key> header against NEXUS_API_KEY env var.
 * If NEXUS_API_KEY is not set, skips auth (dev mode).
 */
/** Paths exempt from auth (container health checks, monitoring). */
const AUTH_EXEMPT_PATHS = ['/api/health'];

export async function authMiddleware(c: Context, next: Next): Promise<void> {
  // Health endpoint must be accessible without auth for Docker/k8s health checks
  if (AUTH_EXEMPT_PATHS.includes(c.req.path)) {
    await next();
    return;
  }

  const apiKey = process.env.NEXUS_API_KEY;

  // Dev mode: no key configured, skip auth
  if (!apiKey) {
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    throw new AppError(401, 'AUTH_REQUIRED', 'Authorization header required');
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'AUTH_INVALID', 'Expected Authorization: Bearer <api-key>');
  }

  // Timing-safe comparison to prevent side-channel attacks.
  // Buffer lengths must match for timingSafeEqual; pad shorter to longer length
  // so length difference doesn't leak via early return.
  const tokenBuf = Buffer.from(token);
  const keyBuf = Buffer.from(apiKey);
  const maxLen = Math.max(tokenBuf.length, keyBuf.length);
  const a = Buffer.alloc(maxLen);
  const b = Buffer.alloc(maxLen);
  tokenBuf.copy(a);
  keyBuf.copy(b);
  if (!timingSafeEqual(a, b) || tokenBuf.length !== keyBuf.length) {
    throw new AppError(403, 'AUTH_FORBIDDEN', 'Invalid API key');
  }

  await next();
}
