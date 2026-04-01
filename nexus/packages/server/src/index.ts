// ============================================================
// NEXUS v1 — Server Entry Point
// ============================================================

export { createApp } from './app.js';
export type { ServerConfig } from './app.js';
export { AppError } from './middleware/errors.js';
export type { ErrorResponse } from './middleware/errors.js';

// To start the server standalone:
//
//   import { createApp } from '@nexus-ai/server';
//   const { app } = createApp();
//   export default { port: 3000, fetch: app.fetch };
//
// Or with @hono/node-server:
//
//   import { serve } from '@hono/node-server';
//   const { app } = createApp();
//   serve({ fetch: app.fetch, port: 3000 });
