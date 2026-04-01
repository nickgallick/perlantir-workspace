// ============================================================
// NEXUS v1 — Request Validation Helpers
// Lightweight validation without external dependencies
// ============================================================

import { AppError } from './errors.js';

/**
 * Validate required string fields in a request body.
 * Throws AppError with 400 status if any field is missing or empty.
 */
export function requireFields(
  body: Record<string, unknown>,
  fields: string[],
): void {
  const missing: string[] = [];
  for (const field of fields) {
    const val = body[field];
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      missing.push(field);
    }
  }
  if (missing.length > 0) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `Missing required fields: ${missing.join(', ')}`,
      { missing },
    );
  }
}

/**
 * Validate UUID format (basic check).
 */
export function requireUUID(value: string, fieldName: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `Invalid UUID for ${fieldName}: ${value}`,
    );
  }
}
