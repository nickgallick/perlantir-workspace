// ============================================================
// NEXUS v1 — Role Differentiation Regression Test
// Proves the core product claim: same project data → different
// role-aware context packages for different agents.
//
// This test is the permanent regression guard for the behavior
// documented in projects/nexus-v1/ROLE-DIFFERENTIATION-PROOF.md
//
// If any assertion here fails, the core Nexus product claim is broken.
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { migrate } from '../src/db/migrator.js';
import { compile } from '../src/context-compiler/compiler.js';
import { createDecision } from '../src/decision-graph/graph.js';
import { getRoleTemplate } from '../src/roles.js';
import type { ContextPackage } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_DIR = join(__dirname, '..', '..', '..', 'supabase', 'migrations');

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://nexus:nexus_dev@localhost:5432/nexus';

let pool: pg.Pool;
let projectId: string;
const agentIds: Record<string, string> = {};

let builderPkg: ContextPackage;
let launchPkg: ContextPackage;
let reviewerPkg: ContextPackage;

// ---- Setup: Create project, agents, decisions, compile all three ----

beforeAll(async () => {
  pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 });
  await pool.query('SELECT 1');
  await migrate(pool, MIGRATIONS_DIR);

  // Create project
  const proj = await pool.query(
    `INSERT INTO projects (name) VALUES ('Role Differentiation Proof') RETURNING id`,
  );
  projectId = proj.rows[0].id;

  // Create 3 agents
  for (const [name, role] of [
    ['builder-proof', 'builder'],
    ['launch-proof', 'launch'],
    ['reviewer-proof', 'reviewer'],
  ] as const) {
    const profile = getRoleTemplate(role);
    const r = await pool.query(
      `INSERT INTO agents (project_id, name, role, relevance_profile, context_budget_tokens)
       VALUES ($1, $2, $3, $4, 8000) RETURNING id`,
      [projectId, name, role, JSON.stringify(profile)],
    );
    agentIds[role] = r.rows[0].id;
  }

  // Create 5 decisions (exact fixture from ROLE-DIFFERENTIATION-PROOF.md)
  await createDecision(pool, {
    project_id: projectId,
    title: 'Require rate limiting on all auth endpoints',
    description: 'All auth endpoints must implement rate limiting',
    reasoning: 'Security best practice',
    made_by: 'architect',
    affects: ['builder-proof', 'reviewer-proof'],
    tags: ['security', 'api', 'infrastructure'],
  });

  await createDecision(pool, {
    project_id: projectId,
    title: 'Product positioning targets enterprise developers',
    description: 'Launch messaging focuses on enterprise dev teams',
    reasoning: 'Market research',
    made_by: 'product',
    affects: ['launch-proof'],
    tags: ['positioning', 'audience', 'messaging', 'marketing'],
  });

  await createDecision(pool, {
    project_id: projectId,
    title: 'Use PostgreSQL with pgvector for storage',
    description: 'PostgreSQL + pgvector for vector similarity',
    reasoning: 'Best relational + vector balance',
    made_by: 'architect',
    affects: ['builder-proof'],
    tags: ['architecture', 'database', 'infrastructure'],
  });

  await createDecision(pool, {
    project_id: projectId,
    title: 'All public APIs must have integration tests',
    description: 'Every endpoint requires integration test coverage',
    reasoning: 'Quality gate',
    made_by: 'architect',
    affects: ['reviewer-proof', 'builder-proof'],
    tags: ['testing', 'code_quality', 'api'],
  });

  await createDecision(pool, {
    project_id: projectId,
    title: 'TypeScript strict mode required',
    description: 'All packages must use strict mode',
    reasoning: 'Catches bugs at compile time',
    made_by: 'architect',
    affects: ['builder-proof', 'reviewer-proof'],
    tags: ['code', 'architecture'],
  });

  // Compile for all three agents with fixed time
  const fixedNow = new Date();

  builderPkg = await compile(pool, {
    agent_id: agentIds.builder,
    task_description: 'Implement the auth middleware for API routes',
  }, { now: fixedNow });

  launchPkg = await compile(pool, {
    agent_id: agentIds.launch,
    task_description: 'Write launch announcement for the new auth system',
  }, { now: fixedNow });

  reviewerPkg = await compile(pool, {
    agent_id: agentIds.reviewer,
    task_description: 'Review security posture of the authentication system',
  }, { now: fixedNow });
});

afterAll(async () => {
  if (pool && projectId) {
    await pool.query(
      'DELETE FROM decision_edges WHERE source_id IN (SELECT id FROM decisions WHERE project_id = $1)',
      [projectId],
    );
    await pool.query('DELETE FROM decisions WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM agents WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    await pool.end();
  }
});

// ============================================================
// Helper: find a decision by title substring in a package
// ============================================================
function findDecision(pkg: ContextPackage, titleSubstring: string) {
  return pkg.decisions.find((d) =>
    d.decision.title.toLowerCase().includes(titleSubstring.toLowerCase()),
  );
}

function decisionRank(pkg: ContextPackage, titleSubstring: string): number {
  const idx = pkg.decisions.findIndex((d) =>
    d.decision.title.toLowerCase().includes(titleSubstring.toLowerCase()),
  );
  return idx === -1 ? -1 : idx + 1; // 1-indexed rank
}

// ============================================================
// Core Product Proof Assertions
// ============================================================

describe('Role Differentiation Proof — Core Product Claim', () => {

  it('all three agents compile successfully with decisions', () => {
    expect(builderPkg.decisions.length).toBeGreaterThan(0);
    expect(launchPkg.decisions.length).toBeGreaterThan(0);
    expect(reviewerPkg.decisions.length).toBeGreaterThan(0);
  });

  it('all three agents consider the same set of decisions', () => {
    expect(builderPkg.decisions_considered).toBe(5);
    expect(launchPkg.decisions_considered).toBe(5);
    expect(reviewerPkg.decisions_considered).toBe(5);
  });

  it('builder top-ranked decision is NOT the same as launch top-ranked decision', () => {
    const builderTop = builderPkg.decisions[0].decision.title;
    const launchTop = launchPkg.decisions[0].decision.title;
    expect(builderTop).not.toBe(launchTop);
  });

  it('launch ranks positioning/messaging above all technical decisions', () => {
    const positioningRank = decisionRank(launchPkg, 'positioning');
    const rateLimitRank = decisionRank(launchPkg, 'rate limiting');
    const pgvectorRank = decisionRank(launchPkg, 'pgvector');
    const testingRank = decisionRank(launchPkg, 'integration tests');
    const strictRank = decisionRank(launchPkg, 'strict mode');

    expect(positioningRank).toBe(1); // Must be #1
    expect(positioningRank).toBeLessThan(rateLimitRank);
    expect(positioningRank).toBeLessThan(pgvectorRank);
    expect(positioningRank).toBeLessThan(testingRank);
    expect(positioningRank).toBeLessThan(strictRank);
  });

  it('reviewer ranks security/testing decisions above launch-oriented decisions', () => {
    const rateLimitRank = decisionRank(reviewerPkg, 'rate limiting');
    const testingRank = decisionRank(reviewerPkg, 'integration tests');
    const positioningRank = decisionRank(reviewerPkg, 'positioning');

    // Security and testing should rank above positioning
    expect(rateLimitRank).toBeLessThan(positioningRank);
    expect(testingRank).toBeLessThan(positioningRank);
  });

  it('same input produces materially different scores across roles', () => {
    // "Rate limiting" decision scored differently by each agent
    const builderRL = findDecision(builderPkg, 'rate limiting');
    const launchRL = findDecision(launchPkg, 'rate limiting');
    const reviewerRL = findDecision(reviewerPkg, 'rate limiting');

    expect(builderRL).toBeDefined();
    expect(launchRL).toBeDefined();
    expect(reviewerRL).toBeDefined();

    // Builder scores it high (directly_affects + technical tags)
    expect(builderRL!.combined_score).toBeGreaterThan(0.6);
    // Launch scores it low (no direct_affect, low tag weights)
    expect(launchRL!.combined_score).toBeLessThan(0.4);
    // Reviewer scores it high (directly_affects + security tags)
    expect(reviewerRL!.combined_score).toBeGreaterThan(0.6);

    // Builder and launch scores differ by more than 0.3
    expect(builderRL!.combined_score - launchRL!.combined_score).toBeGreaterThan(0.3);
  });

  it('same input produces materially different ordering across roles', () => {
    const builderOrder = builderPkg.decisions.map((d) => d.decision.title);
    const launchOrder = launchPkg.decisions.map((d) => d.decision.title);
    const reviewerOrder = reviewerPkg.decisions.map((d) => d.decision.title);

    // No two agents should have identical ordering
    expect(builderOrder).not.toEqual(launchOrder);
    expect(builderOrder).not.toEqual(reviewerOrder);
    expect(launchOrder).not.toEqual(reviewerOrder);
  });

  it('builder gets 4 directly_affects decisions, launch gets 1', () => {
    const builderDirectCount = builderPkg.decisions.filter(
      (d) => d.inclusion_reason === 'directly_affects_agent',
    ).length;
    const launchDirectCount = launchPkg.decisions.filter(
      (d) => d.inclusion_reason === 'directly_affects_agent',
    ).length;

    expect(builderDirectCount).toBe(4);
    expect(launchDirectCount).toBe(1);
  });

  it('launch top decision is the positioning decision with score > 0.8', () => {
    const topDecision = launchPkg.decisions[0];
    expect(topDecision.decision.title).toContain('positioning');
    expect(topDecision.combined_score).toBeGreaterThan(0.8);
    expect(topDecision.inclusion_reason).toBe('directly_affects_agent');
  });

  it('formatted outputs reflect role differences', () => {
    // Builder markdown should mention builder role
    expect(builderPkg.formatted_markdown).toContain('builder-proof');
    expect(builderPkg.formatted_markdown).toContain('builder');

    // Launch markdown should mention launch role
    expect(launchPkg.formatted_markdown).toContain('launch-proof');
    expect(launchPkg.formatted_markdown).toContain('launch');

    // JSON outputs parseable with correct agent metadata
    const builderJson = JSON.parse(builderPkg.formatted_json);
    const launchJson = JSON.parse(launchPkg.formatted_json);
    expect(builderJson.agent.role).toBe('builder');
    expect(launchJson.agent.role).toBe('launch');
  });

  it('compilation is deterministic — same agent, same data, same result', () => {
    // Already proven in compiler.test.ts but included here for completeness
    // The proof data was compiled with fixedNow, so the results above are stable.
    // Verify score consistency within the proof run:
    for (const pkg of [builderPkg, launchPkg, reviewerPkg]) {
      for (let i = 1; i < pkg.decisions.length; i++) {
        expect(pkg.decisions[i - 1].combined_score).toBeGreaterThanOrEqual(
          pkg.decisions[i].combined_score,
        );
      }
    }
  });
});
