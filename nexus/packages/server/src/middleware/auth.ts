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

import type { Context, Next } from 'hono';
import { AppError } from './errors.js';

/**
 * API key authentication middleware.
 * Checks Authorization: Bearer <key> header against NEXUS_API_KEY env var.
 * If NEXUS_API_KEY is not set, skips auth (dev mode).
 */
export async function authMiddleware(c: Context, next: Next): Promise<void> {
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

  if (token !== apiKey) {
    throw new AppError(403, 'AUTH_FORBIDDEN', 'Invalid API key');
  }

  await next();
}
