// ============================================================
// NEXUS v1 — SDK End-to-End Tests (Day 7)
// Tests the NexusClient through the actual Hono server boundary.
// Uses app.request() internally — no real HTTP server needed.
// Proves: SDK methods work, error envelope preserved, types correct,
//         role-differentiated compilation through SDK, full lifecycle.
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { NexusClient, NexusApiError } from '../src/index.js';
import type { HealthResponse } from '../src/index.js';
import { createApp } from '@nexus-ai/server';
import { migrate } from '@nexus-ai/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', '..', '..', 'supabase', 'migrations');
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://nexus:nexus_dev@localhost:5432/nexus';

// We intercept NexusClient's fetch to route through app.request()
let pool: pg.Pool;
let appInstance: ReturnType<typeof createApp>['app'];
let client: NexusClient;

// State for cleanup
let projectId: string;
const agentIds: string[] = [];

beforeAll(async () => {
  pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 });
  await pool.query('SELECT 1');
  await migrate(pool, MIGRATIONS_DIR);

  const { app } = createApp({ pool });
  appInstance = app;

  // Create a NexusClient that routes through app.request() instead of real HTTP
  // We achieve this by monkey-patching globalThis.fetch for the test scope
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.startsWith('http://nexus-test:3000')) {
      const path = url.replace('http://nexus-test:3000', '');
      return appInstance.request(path, init) as unknown as Response;
    }
    return originalFetch(input, init);
  };

  client = new NexusClient({ url: 'http://nexus-test:3000' });
});

afterAll(async () => {
  if (pool && projectId) {
    for (const agentId of agentIds) {
      await pool.query('DELETE FROM notifications WHERE agent_id = $1', [agentId]);
    }
    await pool.query('DELETE FROM subscriptions WHERE agent_id IN (SELECT id FROM agents WHERE project_id = $1)', [projectId]);
    await pool.query(
      'DELETE FROM decision_edges WHERE source_id IN (SELECT id FROM decisions WHERE project_id = $1)',
      [projectId],
    );
    await pool.query('DELETE FROM artifacts WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM decisions WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM agents WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
  }
  await pool?.end();
});

// ============================================================
// Health
// ============================================================
describe('SDK: Health', () => {
  it('health() returns server status', async () => {
    const h = await client.health();
    expect(h.status).toBe('ok');
    expect(h.version).toBe('1.0.0');
    expect(h.dependencies.database).toBe('connected');
    expect(h.timestamp).toBeDefined();
  });
});

// ============================================================
// Error Handling
// ============================================================
describe('SDK: Error Handling', () => {
  it('throws NexusApiError with server envelope on 404', async () => {
    try {
      await client.getProject('00000000-0000-0000-0000-000000000000');
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(NexusApiError);
      const err = e as NexusApiError;
      expect(err.status).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.serverMessage).toContain('not found');
    }
  });

  it('throws NexusApiError with validation details', async () => {
    try {
      await client.getProject('not-a-uuid');
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(NexusApiError);
      const err = e as NexusApiError;
      expect(err.status).toBe(400);
      expect(err.code).toBe('VALIDATION_ERROR');
    }
  });

  it('error message includes code and server message', async () => {
    try {
      await client.getProject('00000000-0000-0000-0000-000000000000');
    } catch (e) {
      const err = e as NexusApiError;
      expect(err.message).toContain('404');
      expect(err.message).toContain('NOT_FOUND');
    }
  });
});

// ============================================================
// Project CRUD
// ============================================================
describe('SDK: Projects', () => {
  it('createProject + getProject', async () => {
    const project = await client.createProject({
      name: 'SDK E2E Test',
      description: 'Testing SDK methods end-to-end',
    });

    expect(project.id).toBeDefined();
    expect(project.name).toBe('SDK E2E Test');
    projectId = project.id;

    const fetched = await client.getProject(projectId);
    expect(fetched.name).toBe('SDK E2E Test');
  });
});

// ============================================================
// Agent CRUD
// ============================================================
describe('SDK: Agents', () => {
  it('createRoleAgent convenience method', async () => {
    const builder = await client.createRoleAgent(projectId, 'sdk-builder', 'builder');
    expect(builder.name).toBe('sdk-builder');
    expect(builder.role).toBe('builder');
    agentIds.push(builder.id);

    const launch = await client.createRoleAgent(projectId, 'sdk-launch', 'launch');
    expect(launch.role).toBe('launch');
    agentIds.push(launch.id);

    const reviewer = await client.createRoleAgent(projectId, 'sdk-reviewer', 'reviewer');
    expect(reviewer.role).toBe('reviewer');
    agentIds.push(reviewer.id);
  });

  it('listAgents returns all agents', async () => {
    const agents = await client.listAgents(projectId);
    expect(agents.length).toBe(3);
    expect(agents.map((a) => a.name).sort()).toEqual(['sdk-builder', 'sdk-launch', 'sdk-reviewer']);
  });
});

// ============================================================
// Decision CRUD
// ============================================================
const decisionIds: string[] = [];

describe('SDK: Decisions', () => {
  it('recordDecision creates decisions', async () => {
    const d1 = await client.recordDecision({
      project_id: projectId,
      title: 'Use TypeScript strict mode',
      description: 'All packages compile with strict: true',
      reasoning: 'Catches type errors at compile time',
      made_by: 'architect',
      affects: ['sdk-builder', 'sdk-reviewer'],
      tags: ['code', 'architecture', 'typescript'],
    });
    expect(d1.title).toBe('Use TypeScript strict mode');
    decisionIds.push(d1.id);

    const d2 = await client.recordDecision({
      project_id: projectId,
      title: 'Launch in Q2 with beta access',
      description: 'Ship beta to design partners before GA',
      reasoning: 'Validate with real users before broad launch',
      made_by: 'product',
      affects: ['sdk-launch'],
      tags: ['launch', 'timeline', 'marketing'],
    });
    decisionIds.push(d2.id);

    const d3 = await client.recordDecision({
      project_id: projectId,
      title: 'PostgreSQL for primary storage',
      description: 'Use PostgreSQL with pgvector extension',
      reasoning: 'Best relational + vector capabilities',
      made_by: 'architect',
      affects: ['sdk-builder'],
      tags: ['database', 'architecture', 'infrastructure'],
    });
    decisionIds.push(d3.id);

    const d4 = await client.recordDecision({
      project_id: projectId,
      title: 'API versioning via URL prefix',
      description: 'All API routes prefixed with /v1/',
      reasoning: 'Clean evolution path for breaking changes',
      made_by: 'architect',
      affects: ['sdk-builder', 'sdk-reviewer', 'sdk-launch'],
      tags: ['api', 'architecture'],
    });
    decisionIds.push(d4.id);
  });

  it('getDecision retrieves by ID', async () => {
    const d = await client.getDecision(decisionIds[0]);
    expect(d.title).toBe('Use TypeScript strict mode');
  });

  it('listDecisions returns all', async () => {
    const all = await client.listDecisions(projectId);
    expect(all.length).toBe(4);
  });

  it('listDecisions filters by status', async () => {
    const active = await client.listDecisions(projectId, { status: 'active' });
    expect(active.length).toBe(4);
  });

  it('updateDecisionStatus changes status', async () => {
    const reverted = await client.updateDecisionStatus(decisionIds[1], 'reverted', {
      reverted_by: 'product',
    });
    expect(reverted.status).toBe('reverted');

    // Restore
    const restored = await client.updateDecisionStatus(decisionIds[1], 'active');
    expect(restored.status).toBe('active');
  });
});

// ============================================================
// Edge CRUD
// ============================================================
describe('SDK: Edges', () => {
  let edgeId: string;

  it('createEdge links decisions', async () => {
    const edge = await client.createEdge(decisionIds[0], {
      target_id: decisionIds[2],
      relationship: 'requires',
      description: 'TypeScript strict requires compatible DB driver types',
    });
    expect(edge.source_id).toBe(decisionIds[0]);
    expect(edge.target_id).toBe(decisionIds[2]);
    expect(edge.relationship).toBe('requires');
    edgeId = edge.id;
  });

  it('listEdges returns edges for decision', async () => {
    const edges = await client.listEdges(decisionIds[0]);
    expect(edges.length).toBeGreaterThanOrEqual(1);
    expect(edges[0].relationship).toBe('requires');
  });

  it('deleteEdge removes edge', async () => {
    const result = await client.deleteEdge(edgeId);
    expect(result.ok).toBe(true);

    const edges = await client.listEdges(decisionIds[0]);
    expect(edges.length).toBe(0);
  });

  it('re-create edge for graph tests', async () => {
    await client.createEdge(decisionIds[0], {
      target_id: decisionIds[2],
      relationship: 'requires',
    });
    await client.createEdge(decisionIds[3], {
      target_id: decisionIds[0],
      relationship: 'informs',
    });
  });
});

// ============================================================
// Artifact CRUD
// ============================================================
describe('SDK: Artifacts', () => {
  it('registerArtifact creates artifact', async () => {
    const a = await client.registerArtifact({
      project_id: projectId,
      name: 'types.ts',
      artifact_type: 'code',
      produced_by: 'builder',
      path: 'packages/core/src/types.ts',
      description: 'Core type definitions',
      related_decision_ids: [decisionIds[0]],
    });
    expect(a.name).toBe('types.ts');
  });

  it('listArtifacts returns project artifacts', async () => {
    const artifacts = await client.listArtifacts(projectId);
    expect(artifacts.length).toBe(1);
    expect(artifacts[0].name).toBe('types.ts');
  });
});

// ============================================================
// Graph Traversal
// ============================================================
describe('SDK: Graph', () => {
  it('getDecisionGraph returns connected decisions', async () => {
    const graph = await client.getDecisionGraph(decisionIds[0], 2);
    expect(Array.isArray(graph)).toBe(true);
    // Should find at least the "requires" edge to PostgreSQL decision
    expect(graph.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// Compile Through SDK
// ============================================================
describe('SDK: Compile', () => {
  it('compileContext returns ContextPackage', async () => {
    const agents = await client.listAgents(projectId);
    const builder = agents.find((a) => a.name === 'sdk-builder')!;

    const pkg = await client.compileContext({
      agent_id: builder.id,
      task_description: 'Implement the database migration system',
    });

    expect(pkg.agent.role).toBe('builder');
    expect(pkg.task).toBe('Implement the database migration system');
    expect(pkg.decisions_considered).toBeGreaterThan(0);
    expect(pkg.decisions_included).toBeGreaterThan(0);
    expect(typeof pkg.formatted_markdown).toBe('string');
    expect(typeof pkg.token_count).toBe('number');
    expect(typeof pkg.compilation_time_ms).toBe('number');
  });

  it('compileForAgent convenience method', async () => {
    const pkg = await client.compileForAgent(
      'sdk-builder',
      'Implement database migrations',
      projectId,
    );
    expect(pkg.agent.name).toBe('sdk-builder');
    expect(pkg.decisions_included).toBeGreaterThan(0);
  });

  it('compileForAgent throws for non-existent agent', async () => {
    await expect(
      client.compileForAgent('nonexistent', 'test', projectId),
    ).rejects.toThrow('Agent "nonexistent" not found');
  });
});

// ============================================================
// ROLE DIFFERENTIATION PROOF (Through SDK boundary)
// ============================================================
describe('SDK: Role Differentiation', () => {
  it('same project, 3 agents, materially different compiled output', async () => {
    const task = 'Prepare for the next development sprint';

    const builderPkg = await client.compileForAgent('sdk-builder', task, projectId);
    const launchPkg = await client.compileForAgent('sdk-launch', task, projectId);
    const reviewerPkg = await client.compileForAgent('sdk-reviewer', task, projectId);

    // All get context
    expect(builderPkg.decisions_included).toBeGreaterThan(0);
    expect(launchPkg.decisions_included).toBeGreaterThan(0);
    expect(reviewerPkg.decisions_included).toBeGreaterThan(0);

    // Agent metadata is correct
    expect(builderPkg.agent.role).toBe('builder');
    expect(launchPkg.agent.role).toBe('launch');
    expect(reviewerPkg.agent.role).toBe('reviewer');

    // Scores differ — this is THE proof
    const builderScores = builderPkg.decisions.map((d) => d.combined_score);
    const launchScores = launchPkg.decisions.map((d) => d.combined_score);
    const reviewerScores = reviewerPkg.decisions.map((d) => d.combined_score);

    // At least one pair must have different scores
    const allIdentical =
      JSON.stringify(builderScores) === JSON.stringify(launchScores) &&
      JSON.stringify(launchScores) === JSON.stringify(reviewerScores);
    expect(allIdentical).toBe(false);

    // Decision ordering should differ (different top decisions per role)
    const builderTop = builderPkg.decisions[0]?.decision.title;
    const launchTop = launchPkg.decisions[0]?.decision.title;
    // Builder and launch have different primary concerns
    // (builder: technical, launch: go-to-market)
    // Not guaranteed to always differ in top-1 with only 4 decisions,
    // but scores MUST differ
    expect(builderScores).not.toEqual(launchScores);
  });

  it('formatted output differs per role', async () => {
    const builderMd = (await client.compileForAgent('sdk-builder', 'Build the API', projectId)).formatted_markdown;
    const launchMd = (await client.compileForAgent('sdk-launch', 'Write launch copy', projectId)).formatted_markdown;

    // Different markdown output (different decisions included/ordered)
    expect(builderMd).not.toBe(launchMd);

    // Both should contain agent role identifier
    expect(builderMd).toContain('builder');
    expect(launchMd).toContain('launch');
  });
});

// ============================================================
// Notifications Through SDK
// ============================================================
describe('SDK: Notifications', () => {
  it('getNotifications returns agent notifications', async () => {
    const agents = await client.listAgents(projectId);
    const builder = agents.find((a) => a.name === 'sdk-builder')!;

    const notifs = await client.getNotifications(builder.id);
    expect(Array.isArray(notifs)).toBe(true);
    // Builder was in affects for several decisions, should have notifications
    expect(notifs.length).toBeGreaterThan(0);
  });

  it('markNotificationRead marks as read', async () => {
    const agents = await client.listAgents(projectId);
    const builder = agents.find((a) => a.name === 'sdk-builder')!;

    const notifs = await client.getNotifications(builder.id, true);
    if (notifs.length > 0) {
      await client.markNotificationRead(notifs[0].id);

      // Verify it's no longer in unread list
      const unread = await client.getNotifications(builder.id, true);
      const found = unread.find((n) => n.id === notifs[0].id);
      expect(found).toBeUndefined();
    }
  });
});

// ============================================================
// Full Lifecycle: SDK-Only Developer Flow
// ============================================================
describe('SDK: Full Developer Lifecycle', () => {
  it('create → seed → compile → verify (single flow)', async () => {
    // 1. Create project
    const project = await client.createProject({
      name: 'SDK Lifecycle Test',
      description: 'Proving the full developer path works',
    });

    // 2. Create agents using role templates
    const builder = await client.createRoleAgent(project.id, 'lifecycle-builder', 'builder');
    const reviewer = await client.createRoleAgent(project.id, 'lifecycle-reviewer', 'reviewer');

    // 3. Record decisions
    const d1 = await client.recordDecision({
      project_id: project.id,
      title: 'Monorepo with Turborepo',
      description: 'Use Turborepo for monorepo management',
      reasoning: 'Fast builds with caching',
      made_by: 'architect',
      affects: ['lifecycle-builder', 'lifecycle-reviewer'],
      tags: ['tooling', 'build', 'architecture'],
    });

    const d2 = await client.recordDecision({
      project_id: project.id,
      title: 'Vitest for testing',
      description: 'Use Vitest as test runner',
      reasoning: 'Native ESM, fast, compatible with TypeScript',
      made_by: 'architect',
      affects: ['lifecycle-builder', 'lifecycle-reviewer'],
      tags: ['testing', 'tooling'],
    });

    // 4. Create edge
    await client.createEdge(d1.id, {
      target_id: d2.id,
      relationship: 'requires',
      description: 'Turborepo needs Vitest for test pipeline',
    });

    // 5. Register artifact
    await client.registerArtifact({
      project_id: project.id,
      name: 'turbo.json',
      artifact_type: 'config',
      produced_by: 'builder',
      path: 'turbo.json',
      description: 'Turborepo configuration',
      related_decision_ids: [d1.id],
    });

    // 6. Compile for builder
    const builderPkg = await client.compileForAgent(
      'lifecycle-builder',
      'Set up the build pipeline',
      project.id,
    );

    expect(builderPkg.decisions_included).toBe(2);
    expect(builderPkg.agent.role).toBe('builder');
    expect(builderPkg.formatted_markdown.length).toBeGreaterThan(0);

    // 7. Compile for reviewer — different output
    const reviewerPkg = await client.compileForAgent(
      'lifecycle-reviewer',
      'Review the build pipeline setup',
      project.id,
    );

    expect(reviewerPkg.decisions_included).toBe(2);
    expect(reviewerPkg.agent.role).toBe('reviewer');

    // Scores differ between roles
    const bScores = builderPkg.decisions.map((d) => d.combined_score);
    const rScores = reviewerPkg.decisions.map((d) => d.combined_score);
    expect(bScores).not.toEqual(rScores);

    // 8. Verify health through SDK
    const h = await client.health();
    expect(h.status).toBe('ok');

    // Cleanup
    await pool.query('DELETE FROM notifications WHERE agent_id IN ($1, $2)', [builder.id, reviewer.id]);
    await pool.query('DELETE FROM subscriptions WHERE agent_id IN ($1, $2)', [builder.id, reviewer.id]);
    await pool.query(
      'DELETE FROM decision_edges WHERE source_id IN (SELECT id FROM decisions WHERE project_id = $1)',
      [project.id],
    );
    await pool.query('DELETE FROM artifacts WHERE project_id = $1', [project.id]);
    await pool.query('DELETE FROM decisions WHERE project_id = $1', [project.id]);
    await pool.query('DELETE FROM agents WHERE project_id = $1', [project.id]);
    await pool.query('DELETE FROM projects WHERE id = $1', [project.id]);
  });
});
