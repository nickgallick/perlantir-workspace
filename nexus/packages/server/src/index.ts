// ============================================================
// NEXUS v1 — Server Entry Point
// ============================================================

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createApp } from './app.js';
import { migrate, createPool } from '@nexus-ai/core';

export { createApp } from './app.js';
export type { ServerConfig } from './app.js';
export { AppError } from './middleware/errors.js';
export type { ErrorResponse } from './middleware/errors.js';

/**
 * Production server entry point.
 * 1. Creates pool from DATABASE_URL
 * 2. Runs migrations — exits on failure
 * 3. Creates Hono app
 * 4. Starts HTTP listener via @hono/node-server (or native Node http)
 *
 * Tests use createApp() directly; this function is for deployment.
 */
export async function startServer(options?: {
  port?: number;
  databaseUrl?: string;
  migrationsDir?: string;
}): Promise<void> {
  const port = options?.port ?? (Number(process.env.PORT) || 3000);
  const databaseUrl =
    options?.databaseUrl ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('[NEXUS] DATABASE_URL is required');
    process.exit(1);
  }

  const pool = createPool(databaseUrl);

  // Resolve migrations directory (default: <repo>/supabase/migrations)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const migrationsDir =
    options?.migrationsDir ??
    join(__dirname, '..', '..', '..', 'supabase', 'migrations');

  // Run migrations before accepting any requests
  try {
    console.log('[NEXUS] Running database migrations...');
    await migrate(pool, migrationsDir);
    console.log('[NEXUS] Migrations complete');
  } catch (err) {
    console.error('[NEXUS] Migration failed — refusing to start:', err);
    await pool.end();
    process.exit(1);
  }

  const { app } = createApp({ pool });

  // Use Node.js native http since @hono/node-server may not be installed
  const { createServer } = await import('node:http');
  const server = createServer(async (req, res) => {
    const url = `http://localhost:${port}${req.url}`;
    const headers: Record<string, string> = {};
    for (const [key, val] of Object.entries(req.headers)) {
      if (val) headers[key] = Array.isArray(val) ? val.join(', ') : val;
    }

    // Read request body
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

    const fetchReq = new Request(url, {
      method: req.method,
      headers,
      body: body && req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
    });

    const fetchRes = await app.fetch(fetchReq);

    res.writeHead(fetchRes.status, Object.fromEntries(fetchRes.headers.entries()));
    const resBody = await fetchRes.arrayBuffer();
    res.end(Buffer.from(resBody));
  });

  server.listen(port, () => {
    console.log(`[NEXUS] Server listening on port ${port}`);
  });
}

// Auto-start when run directly (e.g., node packages/server/dist/index.js)
const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('/index.js') || process.argv[1].endsWith('/index.mjs'));
if (isMain) {
  startServer().catch((err) => {
    console.error('[NEXUS] Fatal startup error:', err);
    process.exit(1);
  });
}
