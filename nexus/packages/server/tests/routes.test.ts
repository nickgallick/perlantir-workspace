// ============================================================
// NEXUS v1 — API Server End-to-End Tests
// Tests all routes through Hono's app.request() (no real HTTP server)
// Proves: CRUD through API boundary, compile through API, role-differentiation
// through API, consistent error envelope, health endpoint
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Hono } from 'hono';

import { createApp } from '../src/app.js';
import { migrate } from '@nexus-ai/core';
import { getRoleTemplate } from '@nexus-ai/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_DIR = join(__dirname, '..', '..', '..', 'supabase', 'migrations');

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://nexus:nexus_dev@localhost:5432/nexus';

let app: Hono;
let pool: pg.Pool;

// State accumulated during tests
let projectId: string;
let builderAgentId: string;
let launchAgentId: string;
let reviewerAgentId: string;
const decisionIds: string[] = [];

// Helper: make request to app
async function req(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: unknown }> {
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) init.body = JSON.stringify(body);

  const res = await app.request(path, init);
  const json = await res.json();
  return { status: res.status, json };
}

beforeAll(async () => {
  pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 });
  await pool.query('SELECT 1');
  await migrate(pool, MIGRATIONS_DIR);

  const result = createApp({ pool });
  app = result.app;
});

afterAll(async () => {
  if (pool && projectId) {
    await pool.query('DELETE FROM notifications WHERE agent_id IN ($1, $2, $3)', [builderAgentId, launchAgentId, reviewerAgentId].filter(Boolean));
    await pool.query('DELETE FROM decision_edges WHERE source_id IN (SELECT id FROM decisions WHERE project_id = $1)', [projectId]);
    await pool.query('DELETE FROM artifacts WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM decisions WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM agents WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    await pool.end();
  }
});

// ============================================================
// Health Endpoint
// ============================================================
describe('Health', () => {
  it('GET /api/health returns ok with dependency state', async () => {
    const { status, json } = await req('GET', '/api/health');
    const data = json as Record<string, unknown>;

    expect(status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.version).toBe('1.0.0');
    expect((data.dependencies as Record<string, string>).database).toBe('connected');
    expect(data.timestamp).toBeDefined();
  });
});

// ============================================================
// Error Envelope Consistency
// ============================================================
describe('Error Envelope', () => {
  it('404 returns consistent error structure', async () => {
    const { status, json } = await req('GET', '/api/nonexistent');
    const data = json as { error: { code: string; message: string } };

    expect(status).toBe(404);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('NOT_FOUND');
    expect(typeof data.error.message).toBe('string');
  });

  it('validation error returns consistent error structure', async () => {
    const { status, json } = await req('POST', '/api/projects', {});
    const data = json as { error: { code: string; message: string; details: unknown } };

    expect(status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.message).toContain('name');
  });

  it('invalid UUID returns validation error', async () => {
    const { status, json } = await req('GET', '/api/projects/not-a-uuid');
    const data = json as { error: { code: string } };

    expect(status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

// ============================================================
// Projects CRUD
// ============================================================
describe('Projects', () => {
  it('POST /api/projects creates a project', async () => {
    const { status, json } = await req('POST', '/api/projects', {
      name: 'E2E Test Project',
      description: 'End-to-end API test',
    });
    const data = json as Record<string, unknown>;

    expect(status).toBe(201);
    expect(data.name).toBe('E2E Test Project');
    expect(data.id).toBeDefined();
    projectId = data.id as string;
  });

  it('GET /api/projects/:id retrieves it', async () => {
    const { status, json } = await req('GET', `/api/projects/${projectId}`);
    const data = json as Record<string, unknown>;

    expect(status).toBe(200);
    expect(data.name).toBe('E2E Test Project');
  });

  it('GET /api/projects/:id returns 404 for non-existent', async () => {
    const { status, json } = await req('GET', '/api/projects/00000000-0000-0000-0000-000000000000');
    expect(status).toBe(404);
  });
});

// ============================================================
// Agents CRUD
// ============================================================
describe('Agents', () => {
  it('POST /api/projects/:id/agents creates agents with role templates', async () => {
    for (const [name, role] of [
      ['e2e-builder', 'builder'],
      ['e2e-launch', 'launch'],
      ['e2e-reviewer', 'reviewer'],
    ] as const) {
      const profile = getRoleTemplate(role);
      const { status, json } = await req('POST', `/api/projects/${projectId}/agents`, {
        name,
        role,
        relevance_profile: profile,
        context_budget_tokens: 8000,
      });
      const data = json as Record<string, unknown>;

      expect(status).toBe(201);
      expect(data.name).toBe(name);
      expect(data.role).toBe(role);

      if (role === 'builder') builderAgentId = data.id as string;
      if (role === 'launch') launchAgentId = data.id as string;
      if (role === 'reviewer') reviewerAgentId = data.id as string;
    }
  });

  it('GET /api/projects/:id/agents lists agents', async () => {
    const { status, json } = await req('GET', `/api/projects/${projectId}/agents`);
    const data = json as unknown[];

    expect(status).toBe(200);
    expect(data.length).toBe(3);
  });
});

// ============================================================
// Decisions CRUD
// ============================================================
describe('Decisions', () => {
  it('POST /api/projects/:id/decisions creates decisions', async () => {
    const seeds = [
      {
        title: 'Use JWT for API auth',
        description: 'Stateless JWT tokens',
        reasoning: 'Scalability',
        made_by: 'architect',
        affects: ['e2e-builder', 'e2e-reviewer'],
        tags: ['security', 'api', 'architecture'],
      },
      {
        title: 'Product positioning for enterprise',
        description: 'Target enterprise developers',
        reasoning: 'Market research',
        made_by: 'product',
        affects: ['e2e-launch'],
        tags: ['positioning', 'audience', 'messaging', 'marketing'],
      },
      {
        title: 'PostgreSQL with pgvector',
        description: 'Use PostgreSQL + pgvector for storage',
        reasoning: 'Best relational + vector balance',
        made_by: 'architect',
        affects: ['e2e-builder'],
        tags: ['architecture', 'database'],
      },
      {
        title: 'Rate limiting on auth endpoints',
        description: 'All auth endpoints must have rate limiting',
        reasoning: 'Security best practice',
        made_by: 'architect',
        affects: ['e2e-builder', 'e2e-reviewer'],
        tags: ['security', 'api', 'infrastructure'],
      },
      {
        title: 'Feature flags for rollout',
        description: 'Use feature flags for auth methods',
        reasoning: 'Risk mitigation',
        made_by: 'product',
        affects: ['e2e-builder', 'e2e-launch'],
        tags: ['deployment', 'scope'],
      },
    ];

    for (const seed of seeds) {
      const { status, json } = await req('POST', `/api/projects/${projectId}/decisions`, seed);
      const data = json as Record<string, unknown>;

      expect(status).toBe(201);
      expect(data.title).toBe(seed.title);
      decisionIds.push(data.id as string);
    }
  });

  it('GET /api/projects/:id/decisions lists all', async () => {
    const { status, json } = await req('GET', `/api/projects/${projectId}/decisions`);
    const data = json as unknown[];

    expect(status).toBe(200);
    expect(data.length).toBe(5);
  });

  it('GET /api/decisions/:id retrieves single', async () => {
    const { status, json } = await req('GET', `/api/decisions/${decisionIds[0]}`);
    const data = json as Record<string, unknown>;

    expect(status).toBe(200);
    expect(data.title).toBe('Use JWT for API auth');
  });

  it('GET /api/projects/:id/decisions?status=active filters by status', async () => {
    const { status, json } = await req('GET', `/api/projects/${projectId}/decisions?status=active`);
    const data = json as unknown[];

    expect(status).toBe(200);
    expect(data.length).toBe(5);
  });

  it('PATCH /api/decisions/:id updates status', async () => {
    // Revert a decision
    const { status, json } = await req('PATCH', `/api/decisions/${decisionIds[4]}`, {
      status: 'reverted',
      reverted_by: 'architect',
    });
    const data = json as Record<string, unknown>;

    expect(status).toBe(200);
    expect(data.status).toBe('reverted');

    // Restore for other tests
    await req('PATCH', `/api/decisions/${decisionIds[4]}`, { status: 'active' });
  });
});

// ============================================================
// Edges
// ============================================================
describe('Edges', () => {
  it('POST /api/decisions/:id/edges creates an edge', async () => {
    const { status, json } = await req('POST', `/api/decisions/${decisionIds[0]}/edges`, {
      target_id: decisionIds[3],
      relationship: 'requires',
      description: 'JWT auth requires rate limiting',
    });
    const data = json as Record<string, unknown>;

    expect(status).toBe(201);
    expect(data.source_id).toBe(decisionIds[0]);
    expect(data.target_id).toBe(decisionIds[3]);
    expect(data.relationship).toBe('requires');
  });

  it('GET /api/decisions/:id/edges lists edges', async () => {
    const { status, json } = await req('GET', `/api/decisions/${decisionIds[0]}/edges`);
    const data = json as unknown[];

    expect(status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// Artifacts
// ============================================================
describe('Artifacts', () => {
  it('POST /api/projects/:id/artifacts creates an artifact', async () => {
    const { status, json } = await req('POST', `/api/projects/${projectId}/artifacts`, {
      name: 'auth-middleware.ts',
      artifact_type: 'code',
      produced_by: 'builder',
      path: 'packages/server/src/middleware/auth.ts',
      description: 'Auth middleware implementation',
      related_decision_ids: [decisionIds[0]],
    });
    const data = json as Record<string, unknown>;

    expect(status).toBe(201);
    expect(data.name).toBe('auth-middleware.ts');
  });

  it('GET /api/projects/:id/artifacts lists artifacts', async () => {
    const { status, json } = await req('GET', `/api/projects/${projectId}/artifacts`);
    const data = json as unknown[];

    expect(status).toBe(200);
    expect(data.length).toBe(1);
  });
});

// ============================================================
// Compile — End-to-End Through API
// ============================================================
describe('Compile', () => {
  it('POST /api/compile returns a ContextPackage', async () => {
    const { status, json } = await req('POST', '/api/compile', {
      agent_id: builderAgentId,
      task_description: 'Implement the auth middleware',
    });
    const data = json as Record<string, unknown>;

    expect(status).toBe(200);
    expect(data.agent).toBeDefined();
    expect((data.agent as Record<string, string>).role).toBe('builder');
    expect(data.task).toBe('Implement the auth middleware');
    expect(data.decisions).toBeDefined();
    expect(data.formatted_markdown).toBeDefined();
    expect(data.formatted_json).toBeDefined();
    expect(typeof data.token_count).toBe('number');
    expect(typeof data.compilation_time_ms).toBe('number');
  });

  it('role-differentiated output through API boundary', async () => {
    const { json: builderJson } = await req('POST', '/api/compile', {
      agent_id: builderAgentId,
      task_description: 'Implement the auth middleware',
    });
    const { json: launchJson } = await req('POST', '/api/compile', {
      agent_id: launchAgentId,
      task_description: 'Write launch announcement',
    });

    const builderPkg = builderJson as Record<string, unknown>;
    const launchPkg = launchJson as Record<string, unknown>;

    // Both should return decisions
    const builderDecisions = builderPkg.decisions as Array<Record<string, unknown>>;
    const launchDecisions = launchPkg.decisions as Array<Record<string, unknown>>;

    expect(builderDecisions.length).toBeGreaterThan(0);
    expect(launchDecisions.length).toBeGreaterThan(0);

    // Different roles should produce different orderings
    const builderIds = builderDecisions.map((d) => (d.decision as Record<string, unknown>).id);
    const launchIds = launchDecisions.map((d) => (d.decision as Record<string, unknown>).id);
    expect(builderIds).not.toEqual(launchIds);

    // Different scores
    const builderScores = builderDecisions.map((d) => d.combined_score);
    const launchScores = launchDecisions.map((d) => d.combined_score);
    const scoresIdentical = builderScores.every((s, i) => s === launchScores[i]);
    expect(scoresIdentical).toBe(false);

    // Agent metadata differs
    expect((builderPkg.agent as Record<string, string>).role).toBe('builder');
    expect((launchPkg.agent as Record<string, string>).role).toBe('launch');
  });

  it('compile with debug returns timing', async () => {
    const { status, json } = await req('POST', '/api/compile', {
      agent_id: builderAgentId,
      task_description: 'test',
      debug: true,
    });

    expect(status).toBe(200);
    const data = json as Record<string, unknown>;
    expect(typeof data.compilation_time_ms).toBe('number');
    expect((data.compilation_time_ms as number)).toBeGreaterThanOrEqual(0);
  });

  it('compile with invalid agent_id returns error', async () => {
    const { status, json } = await req('POST', '/api/compile', {
      agent_id: '00000000-0000-0000-0000-000000000000',
      task_description: 'test',
    });

    expect(status).toBe(500);
    const data = json as { error: { code: string } };
    expect(data.error).toBeDefined();
  });

  it('compile without required fields returns validation error', async () => {
    const { status, json } = await req('POST', '/api/compile', {});
    const data = json as { error: { code: string } };

    expect(status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

// ============================================================
// Notifications
// ============================================================
describe('Notifications', () => {
  it('GET /api/agents/:id/notifications returns notifications', async () => {
    // Decisions created above should have generated notifications
    const { status, json } = await req('GET', `/api/agents/${builderAgentId}/notifications`);
    const data = json as unknown[];

    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    // Builder was in affects for several decisions, so should have notifications
    expect(data.length).toBeGreaterThan(0);
  });

  it('GET /api/agents/:id/notifications?unread=true filters unread', async () => {
    const { status, json } = await req('GET', `/api/agents/${builderAgentId}/notifications?unread=true`);
    const data = json as unknown[];

    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});

// ============================================================
// End-to-End: Create → Fetch → Compile → Verify
// ============================================================
describe('End-to-End Flow', () => {
  it('full lifecycle: create project → agents → decisions → compile → verify', async () => {
    // 1. Create project
    const { json: projJson } = await req('POST', '/api/projects', {
      name: 'E2E Lifecycle Test',
    });
    const proj = projJson as Record<string, unknown>;
    const pid = proj.id as string;

    // 2. Create agent
    const { json: agentJson } = await req('POST', `/api/projects/${pid}/agents`, {
      name: 'lifecycle-builder',
      role: 'builder',
      relevance_profile: getRoleTemplate('builder'),
    });
    const agent = agentJson as Record<string, unknown>;

    // 3. Create decision
    const { json: decJson } = await req('POST', `/api/projects/${pid}/decisions`, {
      title: 'Use TypeScript strict mode',
      description: 'All packages must use strict mode',
      reasoning: 'Catches bugs at compile time',
      made_by: 'architect',
      affects: ['lifecycle-builder'],
      tags: ['code', 'architecture'],
    });
    const dec = decJson as Record<string, unknown>;

    // 4. Compile context
    const { status, json: compileJson } = await req('POST', '/api/compile', {
      agent_id: agent.id,
      task_description: 'Implement the build system',
    });
    const pkg = compileJson as Record<string, unknown>;

    expect(status).toBe(200);
    expect(pkg.decisions_considered).toBe(1);
    expect(pkg.decisions_included).toBe(1);
    const decisions = pkg.decisions as Array<Record<string, unknown>>;
    expect(decisions[0]).toBeDefined();
    const includedDec = decisions[0].decision as Record<string, unknown>;
    expect(includedDec.title).toBe('Use TypeScript strict mode');

    // Cleanup
    await pool.query('DELETE FROM notifications WHERE agent_id = $1', [agent.id]);
    await pool.query('DELETE FROM decisions WHERE project_id = $1', [pid]);
    await pool.query('DELETE FROM agents WHERE project_id = $1', [pid]);
    await pool.query('DELETE FROM projects WHERE id = $1', [pid]);
  });
});

// ============================================================
// H-4: Health endpoint accessible without auth
// ============================================================
describe('Health auth exemption', () => {
  it('returns 200 for /api/health without Authorization header when API key is set', async () => {
    const originalKey = process.env.NEXUS_API_KEY;
    try {
      process.env.NEXUS_API_KEY = 'test-secret-key-for-health-check';
      const res = await app.request('/api/health');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { status: string };
      expect(body.status).toBe('ok');
    } finally {
      if (originalKey === undefined) {
        delete process.env.NEXUS_API_KEY;
      } else {
        process.env.NEXUS_API_KEY = originalKey;
      }
    }
  });

  it('still requires auth for non-health endpoints when API key is set', async () => {
    const originalKey = process.env.NEXUS_API_KEY;
    try {
      process.env.NEXUS_API_KEY = 'test-secret-key-for-auth-check';
      const res = await app.request('/api/projects');
      expect(res.status).toBe(401);
    } finally {
      if (originalKey === undefined) {
        delete process.env.NEXUS_API_KEY;
      } else {
        process.env.NEXUS_API_KEY = originalKey;
      }
    }
  });
});

// ============================================================
// H-2: Generic 500 error body — must not leak internal details
// ============================================================
describe('Error sanitization', () => {
  it('returns generic message for unhandled errors, not raw details', async () => {
    // Create a separate Hono app that throws a raw error with sensitive info
    const { Hono } = await import('hono');
    const { registerErrorHandler } = await import('../src/middleware/errors.js');

    const testApp = new Hono();
    registerErrorHandler(testApp);

    testApp.get('/api/explode', () => {
      throw new Error('Connection refused: postgresql://secret:password@db:5432/prod');
    });

    const res = await testApp.request('/api/explode');
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Internal server error');
    // Must NOT contain the raw error details
    expect(body.error.message).not.toContain('postgresql');
    expect(body.error.message).not.toContain('password');
  });
});
