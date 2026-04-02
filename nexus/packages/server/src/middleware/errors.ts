// ============================================================
// NEXUS v1 — Error Handling Middleware
// Consistent error envelope for all API responses
// ============================================================

import { Hono } from 'hono';
import type { Context } from 'hono';

/**
 * Standard error response envelope.
 * All error responses use this shape.
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Application error with status code and error code.
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Register global error handler on a Hono app.
 * Hono's onError catches thrown errors and returns JSON.
 */
export function registerErrorHandler(app: Hono): void {
  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json<ErrorResponse>(
        {
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        },
        err.statusCode as 400,
      );
    }

    // Raw detail preserved in stderr only; never returned to client
    console.error('[NEXUS] Unhandled error:', err);
    const message = 'Internal server error';
    return c.json<ErrorResponse>(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message,
        },
      },
      500,
    );
  });
}

/**
 * 404 handler for unmatched routes.
 */
export function notFoundHandler(c: Context): Response {
  return c.json<ErrorResponse>(
    {
      error: {
        code: 'NOT_FOUND',
        message: `Route not found: ${c.req.method} ${c.req.path}`,
      },
    },
    404,
  );
}
