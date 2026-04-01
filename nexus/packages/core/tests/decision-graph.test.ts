// ============================================================
// NEXUS v1 — Decision Graph Integration Tests
// Tests: migration, decision CRUD, edge CRUD, graph traversal
// Runs against real PostgreSQL with pgvector
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { migrate } from '../src/db/migrator.js';
import {
  createDecision,
  getDecision,
  listDecisions,
  updateDecisionStatus,
} from '../src/decision-graph/graph.js';
import {
  createEdge,
  listEdgesBySource,
  listEdgesByTarget,
  listEdgesByDecision,
  deleteEdge,
} from '../src/decision-graph/queries.js';
import {
  getConnectedDecisions,
  getProjectGraph,
} from '../src/decision-graph/traversal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_DIR = join(__dirname, '..', '..', '..', 'supabase', 'migrations');

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://nexus:nexus_dev@localhost:5432/nexus';

let pool: pg.Pool;
let projectId: string;
const decisionIds: string[] = [];

beforeAll(async () => {
  pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 });

  // Verify connection
  const check = await pool.query('SELECT 1 AS ok');
  expect(check.rows[0].ok).toBe(1);

  // Run migrations
  const result = await migrate(pool, MIGRATIONS_DIR);
  expect(result.errors).toHaveLength(0);

  // Create a test project
  const projResult = await pool.query(
    `INSERT INTO projects (name, description)
     VALUES ('Test Project', 'Integration test project')
     RETURNING id`,
  );
  projectId = projResult.rows[0].id;
});

afterAll(async () => {
  // Clean up test data in order (edges → decisions → project)
  if (projectId) {
    await pool.query('DELETE FROM decision_edges WHERE source_id IN (SELECT id FROM decisions WHERE project_id = $1)', [projectId]);
    await pool.query('DELETE FROM decisions WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
  }
  await pool.end();
});

describe('Migration Runner', () => {
  it('should apply the initial schema', async () => {
    // Tables should exist after migration
    const result = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'decisions'`,
    );
    expect(result.rows).toHaveLength(1);
  });

  it('should report already-applied migrations as skipped', async () => {
    const result = await migrate(pool, MIGRATIONS_DIR);
    expect(result.applied).toHaveLength(0);
    expect(result.skipped.length).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });

  it('should verify pgvector extension is active', async () => {
    const result = await pool.query(
      `SELECT extname FROM pg_extension WHERE extname = 'vector'`,
    );
    expect(result.rows).toHaveLength(1);
  });
});

describe('Decision CRUD', () => {
  it('should create a decision without embedding', async () => {
    const decision = await createDecision(pool, {
      project_id: projectId,
      title: 'Use PostgreSQL',
      description: 'Adopt PostgreSQL as the primary database',
      reasoning: 'Mature, reliable, supports pgvector for embeddings',
      made_by: 'architect',
      confidence: 'high',
      affects: ['database', 'infrastructure'],
      tags: ['infrastructure', 'database'],
    });

    expect(decision.id).toBeDefined();
    expect(decision.title).toBe('Use PostgreSQL');
    expect(decision.status).toBe('active');
    expect(decision.confidence).toBe('high');
    expect(decision.affects).toEqual(['database', 'infrastructure']);
    expect(decision.tags).toEqual(['infrastructure', 'database']);
    decisionIds.push(decision.id);
  });

  it('should create a decision with mock embedding', async () => {
    const mockEmbed = async (_text: string) => Array.from({ length: 1536 }, () => Math.random());

    const decision = await createDecision(
      pool,
      {
        project_id: projectId,
        title: 'Use TypeScript Strict Mode',
        description: 'Enable strict TypeScript compilation',
        reasoning: 'Catches more errors at compile time',
        made_by: 'backend',
        tags: ['typescript', 'engineering'],
      },
      mockEmbed,
    );

    expect(decision.id).toBeDefined();
    expect(decision.title).toBe('Use TypeScript Strict Mode');
    decisionIds.push(decision.id);
  });

  it('should create 3 more decisions for graph testing', async () => {
    const specs = [
      { title: 'API-first Design', made_by: 'architect', tags: ['api', 'architecture'] },
      { title: 'Role-based Context', made_by: 'product', tags: ['context', 'roles'] },
      { title: 'Event-driven Notifications', made_by: 'backend', tags: ['notifications', 'events'] },
    ];

    for (const spec of specs) {
      const d = await createDecision(pool, {
        project_id: projectId,
        title: spec.title,
        description: `Decision: ${spec.title}`,
        reasoning: `Reasoning for ${spec.title}`,
        made_by: spec.made_by,
        tags: spec.tags,
      });
      decisionIds.push(d.id);
    }

    expect(decisionIds).toHaveLength(5);
  });

  it('should get a decision by ID', async () => {
    const decision = await getDecision(pool, decisionIds[0]);
    expect(decision).not.toBeNull();
    expect(decision!.title).toBe('Use PostgreSQL');
  });

  it('should return null for non-existent decision', async () => {
    const decision = await getDecision(pool, '00000000-0000-0000-0000-000000000000');
    expect(decision).toBeNull();
  });

  it('should list all project decisions', async () => {
    const decisions = await listDecisions(pool, projectId);
    expect(decisions.length).toBe(5);
  });

  it('should filter decisions by made_by', async () => {
    const decisions = await listDecisions(pool, projectId, { made_by: 'backend' });
    expect(decisions.length).toBe(2);
    expect(decisions.every((d) => d.made_by === 'backend')).toBe(true);
  });

  it('should filter decisions by tags', async () => {
    const decisions = await listDecisions(pool, projectId, { tags: ['infrastructure'] });
    expect(decisions.length).toBe(1);
    expect(decisions[0].title).toBe('Use PostgreSQL');
  });

  it('should update decision status', async () => {
    const updated = await updateDecisionStatus(pool, decisionIds[0], 'superseded');
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('superseded');
  });

  it('should update status back to active with validated_at', async () => {
    const updated = await updateDecisionStatus(pool, decisionIds[0], 'active');
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('active');
    expect(updated!.validated_at).toBeDefined();
  });
});

describe('Edge CRUD', () => {
  it('should create edges between decisions', async () => {
    // D0 (PostgreSQL) -requires-> D1 (TypeScript)
    const e1 = await createEdge(pool, {
      source_id: decisionIds[0],
      target_id: decisionIds[1],
      relationship: 'requires',
      description: 'Database client needs TypeScript types',
    });
    expect(e1.id).toBeDefined();
    expect(e1.relationship).toBe('requires');

    // D2 (API-first) -informs-> D3 (Role-based Context)
    const e2 = await createEdge(pool, {
      source_id: decisionIds[2],
      target_id: decisionIds[3],
      relationship: 'informs',
    });
    expect(e2.id).toBeDefined();

    // D3 (Role-based Context) -requires-> D4 (Event Notifications)
    const e3 = await createEdge(pool, {
      source_id: decisionIds[3],
      target_id: decisionIds[4],
      relationship: 'requires',
    });
    expect(e3.id).toBeDefined();

    // D0 (PostgreSQL) -informs-> D4 (Event Notifications)
    const e4 = await createEdge(pool, {
      source_id: decisionIds[0],
      target_id: decisionIds[4],
      relationship: 'informs',
    });
    expect(e4.id).toBeDefined();

    // D1 (TypeScript) -informs-> D2 (API-first)
    const e5 = await createEdge(pool, {
      source_id: decisionIds[1],
      target_id: decisionIds[2],
      relationship: 'informs',
    });
    expect(e5.id).toBeDefined();
  });

  it('should prevent self-edges', async () => {
    await expect(
      createEdge(pool, {
        source_id: decisionIds[0],
        target_id: decisionIds[0],
        relationship: 'requires',
      }),
    ).rejects.toThrow();
  });

  it('should prevent duplicate edges', async () => {
    await expect(
      createEdge(pool, {
        source_id: decisionIds[0],
        target_id: decisionIds[1],
        relationship: 'requires',
      }),
    ).rejects.toThrow();
  });

  it('should list edges by source', async () => {
    const edges = await listEdgesBySource(pool, decisionIds[0]);
    expect(edges.length).toBe(2); // requires D1, informs D4
  });

  it('should list edges by target', async () => {
    const edges = await listEdgesByTarget(pool, decisionIds[4]);
    expect(edges.length).toBe(2); // from D3 and D0
  });

  it('should list all edges for a decision', async () => {
    // D1 has: incoming from D0, outgoing to D2
    const edges = await listEdgesByDecision(pool, decisionIds[1]);
    expect(edges.length).toBe(2);
  });

  it('should delete an edge', async () => {
    // Create a temporary edge
    const temp = await createEdge(pool, {
      source_id: decisionIds[2],
      target_id: decisionIds[4],
      relationship: 'blocks',
    });
    const deleted = await deleteEdge(pool, temp.id);
    expect(deleted).toBe(true);

    // Verify it's gone
    const deletedAgain = await deleteEdge(pool, temp.id);
    expect(deletedAgain).toBe(false);
  });
});

describe('Graph Traversal', () => {
  it('should find connected decisions from D0 at depth 1', async () => {
    const connected = await getConnectedDecisions(pool, decisionIds[0], 1);
    // D0 -> D1 (requires), D0 -> D4 (informs)
    const ids = connected.map((c) => c.decision_id);
    expect(ids).toContain(decisionIds[1]);
    expect(ids).toContain(decisionIds[4]);
    expect(connected.every((c) => c.depth === 1)).toBe(true);
  });

  it('should find deeper connections at depth 2', async () => {
    const connected = await getConnectedDecisions(pool, decisionIds[0], 2);
    const ids = connected.map((c) => c.decision_id);
    // Depth 1: D1, D4
    // Depth 2: D1 -> D2, D4 <- D3 (reverse)
    expect(ids).toContain(decisionIds[1]);
    expect(ids).toContain(decisionIds[4]);
    expect(ids).toContain(decisionIds[2]); // via D1
    expect(ids).toContain(decisionIds[3]); // via D4 reverse
  });

  it('should find all 4 connected decisions at depth 3', async () => {
    const connected = await getConnectedDecisions(pool, decisionIds[0], 3);
    // D0 connects to D1, D2, D3, D4 at various depths
    const ids = connected.map((c) => c.decision_id);
    expect(ids).toContain(decisionIds[1]);
    expect(ids).toContain(decisionIds[2]);
    expect(ids).toContain(decisionIds[3]);
    expect(ids).toContain(decisionIds[4]);
    expect(ids).not.toContain(decisionIds[0]); // should not include origin
  });

  it('should include path information', async () => {
    const connected = await getConnectedDecisions(pool, decisionIds[0], 3);
    // Every result should have a non-empty path
    for (const c of connected) {
      expect(c.path.length).toBeGreaterThan(0);
      expect(c.via_relationship).toBeDefined();
    }
  });

  it('should respect max depth', async () => {
    const connected = await getConnectedDecisions(pool, decisionIds[0], 0);
    expect(connected).toHaveLength(0); // depth 0 = origin only (excluded from results)
  });

  it('should get full project graph', async () => {
    const graph = await getProjectGraph(pool, projectId);
    expect(graph.nodes).toHaveLength(5);
    expect(graph.edges).toHaveLength(5);
    // Verify node structure
    for (const node of graph.nodes) {
      expect(node.id).toBeDefined();
      expect(node.title).toBeDefined();
      expect(node.status).toBeDefined();
    }
  });
});

describe('Decision with Edges (Transactional)', () => {
  it('should create a decision with edges in one transaction', async () => {
    const decision = await createDecision(pool, {
      project_id: projectId,
      title: 'Monorepo Structure',
      description: 'Use Turborepo monorepo',
      reasoning: 'Better DX and build caching',
      made_by: 'architect',
      tags: ['tooling'],
      edges: [
        { target_id: decisionIds[1], relationship: 'requires', description: 'Needs TS config' },
        { target_id: decisionIds[2], relationship: 'informs' },
      ],
    });

    expect(decision.id).toBeDefined();

    // Verify edges were created
    const edges = await listEdgesBySource(pool, decision.id);
    expect(edges).toHaveLength(2);
    expect(edges[0].relationship).toBe('requires');
    expect(edges[1].relationship).toBe('informs');

    // Clean up
    await pool.query('DELETE FROM decision_edges WHERE source_id = $1', [decision.id]);
    await pool.query('DELETE FROM decisions WHERE id = $1', [decision.id]);
  });
});
