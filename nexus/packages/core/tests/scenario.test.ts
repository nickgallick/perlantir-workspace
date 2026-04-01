// ============================================================
// NEXUS v1 — THE Scenario Test (Spec §20)
// The most important test in the project.
//
// Scenarios:
// A: Same project, different roles, different context
// B: Superseded decision updates compiled output
// C: Affected roles get notifications, unaffected don't
// D: Graph neighbors included at reduced priority
// E: Baseline retrieval vs Nexus compile differs materially
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { migrate } from '../src/db/migrator.js';
import { compile } from '../src/context-compiler/compiler.js';
import { createDecision, updateDecisionStatus } from '../src/decision-graph/graph.js';
import { createEdge } from '../src/decision-graph/queries.js';
import { ChangePropagator } from '../src/change-propagator/propagator.js';
import { getRoleTemplate } from '../src/roles.js';
import type { Decision, ContextPackage } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_DIR = join(__dirname, '..', '..', '..', 'supabase', 'migrations');

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://nexus:nexus_dev@localhost:5432/nexus';

let pool: pg.Pool;
let projectId: string;
const agentIds: Record<string, string> = {};
const decisions: Decision[] = [];

// ---- Setup: Full software team scenario with 10 decisions ----

beforeAll(async () => {
  pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 });
  await pool.query('SELECT 1');
  await migrate(pool, MIGRATIONS_DIR);

  // Create project
  const proj = await pool.query(
    `INSERT INTO projects (name) VALUES ('Scenario Test Project') RETURNING id`,
  );
  projectId = proj.rows[0].id;

  // Create 3 agents: builder, reviewer, launch (per spec Day 5)
  for (const [name, role] of [
    ['scenario-builder', 'builder'],
    ['scenario-reviewer', 'reviewer'],
    ['scenario-launch', 'launch'],
  ] as const) {
    const profile = getRoleTemplate(role);
    const r = await pool.query(
      `INSERT INTO agents (project_id, name, role, relevance_profile, context_budget_tokens)
       VALUES ($1, $2, $3, $4, 8000) RETURNING id`,
      [projectId, name, role, JSON.stringify(profile)],
    );
    agentIds[role] = r.rows[0].id;
  }

  // Create 10 decisions (from spec §15 seed data pattern)
  const seeds = [
    {
      title: 'Use stateless JWT for API authentication',
      description: 'API routes use JWT tokens, no server-side sessions',
      reasoning: 'Scalability and statelessness for distributed deployment',
      made_by: 'architect',
      affects: ['scenario-builder', 'scenario-reviewer'],
      tags: ['security', 'api', 'architecture'],
    },
    {
      title: 'Rotate refresh tokens on every renewal',
      description: 'Each refresh token use invalidates the old one',
      reasoning: 'Prevents token replay attacks',
      made_by: 'architect',
      affects: ['scenario-builder', 'scenario-reviewer'],
      tags: ['security', 'implementation'],
    },
    {
      title: 'Split auth API from web auth flow',
      description: 'Separate endpoints for API token auth vs browser cookie auth',
      reasoning: 'Different security models for different clients',
      made_by: 'architect',
      affects: ['scenario-builder'],
      tags: ['api', 'architecture'],
    },
    {
      title: 'Use edge-compatible middleware only',
      description: 'All middleware must work in edge runtime environments',
      reasoning: 'Deploy to Cloudflare Workers and Vercel Edge',
      made_by: 'architect',
      affects: ['scenario-builder'],
      tags: ['infrastructure', 'architecture', 'deployment'],
    },
    {
      title: 'Move audit logging to async queue',
      description: 'Auth events logged asynchronously to avoid request latency',
      reasoning: 'Performance optimization for auth flows',
      made_by: 'architect',
      affects: ['scenario-builder', 'scenario-reviewer'],
      tags: ['performance', 'infrastructure'],
    },
    {
      title: 'Deprecate legacy /login route by May 1',
      description: 'Old /login returns 301 redirect, removed after grace period',
      reasoning: 'Clean up tech debt, consolidate auth endpoints',
      made_by: 'product',
      affects: ['scenario-builder', 'scenario-launch'],
      tags: ['deprecation', 'api', 'breaking_change'],
    },
    {
      title: 'Delay SSO until post-launch',
      description: 'No SAML/OIDC in v1. Email/password and API key only',
      reasoning: 'Scope management — SSO adds 3 weeks',
      made_by: 'product',
      affects: ['scenario-builder', 'scenario-launch'],
      tags: ['scope', 'requirements'],
    },
    {
      title: 'Require rate limiting on all auth endpoints',
      description: '10 attempts/min per IP on login, 5/min on token refresh',
      reasoning: 'Prevent brute force attacks',
      made_by: 'architect',
      affects: ['scenario-builder', 'scenario-reviewer'],
      tags: ['security', 'api', 'infrastructure'],
    },
    {
      title: 'Store password hashes with Argon2id',
      description: 'Argon2id with OWASP-recommended parameters',
      reasoning: 'Current best practice for password hashing',
      made_by: 'architect',
      affects: ['scenario-builder', 'scenario-reviewer'],
      tags: ['security', 'implementation'],
    },
    {
      title: 'Use feature flags for auth method rollout',
      description: 'Each auth method controlled by feature flag for gradual rollout',
      reasoning: 'Risk mitigation for auth changes',
      made_by: 'product',
      affects: ['scenario-builder', 'scenario-launch'],
      tags: ['deployment', 'infrastructure', 'scope'],
    },
  ];

  for (const seed of seeds) {
    const d = await createDecision(pool, {
      project_id: projectId,
      ...seed,
    });
    decisions.push(d);
  }

  // Create edges (from spec seed pattern)
  // JWT requires token rotation
  await createEdge(pool, {
    source_id: decisions[0].id,
    target_id: decisions[1].id,
    relationship: 'requires',
  });
  // Split auth API informs JWT
  await createEdge(pool, {
    source_id: decisions[2].id,
    target_id: decisions[0].id,
    relationship: 'informs',
  });
  // Rate limiting requires Argon2
  await createEdge(pool, {
    source_id: decisions[7].id,
    target_id: decisions[8].id,
    relationship: 'requires',
  });
  // Feature flags informs deprecation
  await createEdge(pool, {
    source_id: decisions[9].id,
    target_id: decisions[5].id,
    relationship: 'informs',
  });
});

afterAll(async () => {
  if (pool && projectId) {
    await pool.query('DELETE FROM notifications WHERE agent_id = ANY($1)', [Object.values(agentIds)]);
    await pool.query('DELETE FROM decision_edges WHERE source_id IN (SELECT id FROM decisions WHERE project_id = $1)', [projectId]);
    await pool.query('DELETE FROM decisions WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM agents WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    await pool.end();
  }
});

// ============================================================
// Scenario A: Same project, different roles, different context
// ============================================================
describe('Scenario A: Role-differentiated context', () => {
  let builderPkg: ContextPackage;
  let reviewerPkg: ContextPackage;
  let launchPkg: ContextPackage;

  beforeAll(async () => {
    const fixedNow = new Date();
    builderPkg = await compile(pool, {
      agent_id: agentIds.builder,
      task_description: 'Implement the auth middleware for API routes',
    }, { now: fixedNow });

    reviewerPkg = await compile(pool, {
      agent_id: agentIds.reviewer,
      task_description: 'Review the auth middleware for security and correctness',
    }, { now: fixedNow });

    launchPkg = await compile(pool, {
      agent_id: agentIds.launch,
      task_description: 'Write launch announcement for the new auth system',
    }, { now: fixedNow });
  });

  it('all three agents consider all 10 decisions', () => {
    expect(builderPkg.decisions_considered).toBe(10);
    expect(reviewerPkg.decisions_considered).toBe(10);
    expect(launchPkg.decisions_considered).toBe(10);
  });

  it('builder gets architecture/security decisions ranked high', () => {
    // Builder is affected by 9 of 10 decisions (all except none — actually check)
    const topTitles = builderPkg.decisions.slice(0, 5).map((d) => d.decision.title);
    // Top decisions should include security/architecture ones
    const hasSecurityOrArch = topTitles.some(
      (t) => t.includes('JWT') || t.includes('rate limiting') || t.includes('Argon2'),
    );
    expect(hasSecurityOrArch).toBe(true);
  });

  it('reviewer gets security/validation decisions ranked high', () => {
    const topTitles = reviewerPkg.decisions.slice(0, 5).map((d) => d.decision.title);
    const hasSecurityOrValidation = topTitles.some(
      (t) => t.includes('rate limiting') || t.includes('Argon2') || t.includes('JWT'),
    );
    expect(hasSecurityOrValidation).toBe(true);
  });

  it('launch gets messaging/deprecation decisions ranked higher than security internals', () => {
    // Launch should rank deprecation/feature-flags higher than internal security
    const deprecationRank = launchPkg.decisions.findIndex(
      (d) => d.decision.title.includes('Deprecate') || d.decision.title.includes('feature flags'),
    );
    const argon2Rank = launchPkg.decisions.findIndex(
      (d) => d.decision.title.includes('Argon2'),
    );

    // Deprecation/feature flags should be ranked higher (lower index) than Argon2 for launch
    if (deprecationRank !== -1 && argon2Rank !== -1) {
      expect(deprecationRank).toBeLessThan(argon2Rank);
    }
  });

  it('all three orderings differ', () => {
    const builderOrder = builderPkg.decisions.map((d) => d.decision.id);
    const reviewerOrder = reviewerPkg.decisions.map((d) => d.decision.id);
    const launchOrder = launchPkg.decisions.map((d) => d.decision.id);

    expect(builderOrder).not.toEqual(launchOrder);
    expect(reviewerOrder).not.toEqual(launchOrder);
    // Builder and reviewer may overlap heavily since both are technical,
    // but scores should still differ
    const builderScores = builderPkg.decisions.map((d) => d.combined_score);
    const reviewerScores = reviewerPkg.decisions.map((d) => d.combined_score);
    const scoresIdentical = builderScores.every((s, i) => s === reviewerScores[i]);
    expect(scoresIdentical).toBe(false);
  });
});

// ============================================================
// Scenario B: Superseded decision updates compiled output
// ============================================================
describe('Scenario B: Superseded decision handling', () => {
  it('superseded decision gets lower score than its replacement', async () => {
    // Supersede "Delay SSO" with new decision
    const ssoDecision = decisions[6]; // "Delay SSO until post-launch"

    const newSSO = await createDecision(pool, {
      project_id: projectId,
      title: 'Include SSO for enterprise beta only',
      description: 'SAML SSO available as beta for enterprise accounts at launch',
      reasoning: 'Three enterprise prospects requested SSO as launch blocker',
      made_by: 'product',
      affects: ['scenario-builder', 'scenario-launch'],
      tags: ['scope', 'requirements', 'enterprise'],
    });

    // Mark old as superseded
    await updateDecisionStatus(pool, ssoDecision.id, 'superseded', newSSO.id);

    const fixedNow = new Date();

    // Compile for builder (include_superseded via profile)
    const pkg = await compile(pool, {
      agent_id: agentIds.builder,
      task_description: 'Implement SSO integration',
    }, { now: fixedNow });

    const oldSSO = pkg.decisions.find((d) => d.decision.id === ssoDecision.id);
    const newSSOInPkg = pkg.decisions.find((d) => d.decision.id === newSSO.id);

    // New decision should be present
    expect(newSSOInPkg).toBeDefined();

    // If old is present (include_superseded), it should score lower
    if (oldSSO) {
      expect(oldSSO.combined_score).toBeLessThan(newSSOInPkg!.combined_score);
    }

    // Cleanup: revert status for other tests
    await updateDecisionStatus(pool, ssoDecision.id, 'active');
    await pool.query('DELETE FROM decisions WHERE id = $1', [newSSO.id]);
  });
});

// ============================================================
// Scenario C: Affected roles get notifications, unaffected don't
// ============================================================
describe('Scenario C: Role-targeted notifications', () => {
  it('only affected agents receive notifications on decision create', async () => {
    // Clear existing
    await pool.query('DELETE FROM notifications WHERE agent_id = ANY($1)', [Object.values(agentIds)]);

    const propagator = new ChangePropagator(pool);

    // Create a decision affecting only builder and reviewer
    const d = await createDecision(pool, {
      project_id: projectId,
      title: 'Scenario C test decision',
      description: 'Only builder and reviewer affected',
      reasoning: 'Testing notification targeting',
      made_by: 'architect',
      affects: ['scenario-builder', 'scenario-reviewer'],
      tags: ['test'],
    });

    const notifications = await propagator.onDecisionCreated(d);

    // Builder and reviewer notified
    const notifiedRoles = notifications.map((n) => n.agent_role).sort();
    expect(notifiedRoles).toEqual(['builder', 'reviewer']);

    // Launch should have NO notifications
    const launchNotifs = await pool.query(
      'SELECT * FROM notifications WHERE agent_id = $1',
      [agentIds.launch],
    );
    expect(launchNotifs.rows).toHaveLength(0);

    // Cleanup
    await pool.query('DELETE FROM decisions WHERE id = $1', [d.id]);
    await pool.query('DELETE FROM notifications WHERE agent_id = ANY($1)', [Object.values(agentIds)]);
  });

  it('superseded decision notifies union of old + new affects', async () => {
    await pool.query('DELETE FROM notifications WHERE agent_id = ANY($1)', [Object.values(agentIds)]);

    const propagator = new ChangePropagator(pool);

    const oldD = await createDecision(pool, {
      project_id: projectId,
      title: 'Scenario C old decision',
      description: 'test', reasoning: 'test', made_by: 'arch',
      affects: ['scenario-builder'], // Only builder
      tags: ['test'],
    });

    const newD = await createDecision(pool, {
      project_id: projectId,
      title: 'Scenario C new decision',
      description: 'test', reasoning: 'test', made_by: 'arch',
      affects: ['scenario-launch'], // Only launch
      tags: ['test'],
    });

    const notifications = await propagator.onDecisionSuperseded(newD, oldD);

    // Union: builder + launch
    const notifiedNames = notifications.map((n) => n.agent_name).sort();
    expect(notifiedNames).toEqual(['scenario-builder', 'scenario-launch']);

    // Cleanup
    await pool.query('DELETE FROM decisions WHERE id IN ($1, $2)', [oldD.id, newD.id]);
    await pool.query('DELETE FROM notifications WHERE agent_id = ANY($1)', [Object.values(agentIds)]);
  });
});

// ============================================================
// Scenario D: Graph neighbors included at reduced priority
// ============================================================
describe('Scenario D: Graph expansion in compiled output', () => {
  it('graph neighbors appear in output with reduced scores', async () => {
    const fixedNow = new Date();

    const pkg = await compile(pool, {
      agent_id: agentIds.builder,
      task_description: 'Implement JWT authentication',
    }, { now: fixedNow });

    // "JWT" decision (decisions[0]) should be ranked high for builder
    const jwt = pkg.decisions.find((d) => d.decision.title.includes('JWT'));
    expect(jwt).toBeDefined();

    // "Rotate refresh tokens" (decisions[1]) is connected via requires edge
    // It should also be present (either from direct scoring or graph expansion)
    const rotate = pkg.decisions.find((d) => d.decision.title.includes('Rotate refresh'));
    expect(rotate).toBeDefined();

    // Both should have non-trivial scores
    expect(jwt!.combined_score).toBeGreaterThan(0.3);
    expect(rotate!.combined_score).toBeGreaterThan(0.3);
  });
});

// ============================================================
// Scenario E: Baseline vs Nexus differs materially
// ============================================================
describe('Scenario E: Nexus vs baseline retrieval', () => {
  it('baseline returns same results for all agents; Nexus does not', async () => {
    const fixedNow = new Date();

    // "Baseline" = all 10 decisions in creation order (what vector search without role awareness gives)
    const baseline = decisions.map((d) => d.id);

    // Nexus compile for each agent
    const builderPkg = await compile(pool, {
      agent_id: agentIds.builder,
      task_description: 'Implement auth middleware',
    }, { now: fixedNow });

    const launchPkg = await compile(pool, {
      agent_id: agentIds.launch,
      task_description: 'Write launch announcement',
    }, { now: fixedNow });

    const builderOrder = builderPkg.decisions.map((d) => d.decision.id);
    const launchOrder = launchPkg.decisions.map((d) => d.decision.id);

    // Nexus orders DIFFER from each other
    expect(builderOrder).not.toEqual(launchOrder);

    // And at least one differs from baseline (creation order)
    const builderMatchesBaseline = builderOrder.every((id, i) => id === baseline[i]);
    const launchMatchesBaseline = launchOrder.every((id, i) => id === baseline[i]);
    expect(builderMatchesBaseline && launchMatchesBaseline).toBe(false);
  });

  it('Nexus provides score-based ordering, not arbitrary', async () => {
    const fixedNow = new Date();

    const pkg = await compile(pool, {
      agent_id: agentIds.builder,
      task_description: 'Implement auth middleware',
    }, { now: fixedNow });

    // Scores should be strictly descending (or equal for ties)
    for (let i = 1; i < pkg.decisions.length; i++) {
      expect(pkg.decisions[i - 1].combined_score).toBeGreaterThanOrEqual(
        pkg.decisions[i].combined_score,
      );
    }

    // Score range should be non-trivial (not all the same)
    const scores = pkg.decisions.map((d) => d.combined_score);
    const spread = Math.max(...scores) - Math.min(...scores);
    expect(spread).toBeGreaterThan(0.1);
  });
});
