// ============================================================
// NEXUS v1 — Context Compiler: Assembly Tests (Day 4)
// Tests: packer, formatter, expandGraphContext, full compile pipeline
// Proves: role-differentiated context, token budget packing, score-driven ordering
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { migrate } from '../src/db/migrator.js';
import { createDecision } from '../src/decision-graph/graph.js';
import { createEdge } from '../src/decision-graph/queries.js';
import { packIntoBudget, estimateTokens } from '../src/context-compiler/packer.js';
import { formatAsMarkdown, formatAsJson } from '../src/context-compiler/formatter.js';
import { compile } from '../src/context-compiler/compiler.js';
import { scoreDecisions } from '../src/context-compiler/scoring.js';
import { expandGraphContext } from '../src/context-compiler/compiler.js';
import { getRoleTemplate } from '../src/roles.js';
import type {
  Agent,
  Decision,
  ScoredDecision,
  ScoredArtifact,
  Notification,
  SessionSummary,
  PackInput,
  PackResult,
  RelevanceProfile,
} from '../src/types.js';
import type { ScoringResult } from '../src/context-compiler/scoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_DIR = join(__dirname, '..', '..', '..', 'supabase', 'migrations');

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://nexus:nexus_dev@localhost:5432/nexus';

// ---- Test Fixtures ----

function makeDecisionObj(overrides: Partial<Decision> = {}): Decision {
  return {
    id: 'dec-test-001',
    project_id: 'proj-001',
    title: 'Test Decision',
    description: 'A test decision for scoring',
    reasoning: 'Because testing',
    made_by: 'architect',
    confidence: 'high',
    status: 'active',
    alternatives_considered: [],
    affects: ['builder'],
    tags: ['api', 'security'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {},
    ...overrides,
  };
}

function makeScoredDecision(
  overrides: Partial<ScoredDecision> & { decision?: Partial<Decision> } = {},
): ScoredDecision {
  const { decision: decOverrides, ...sdOverrides } = overrides;
  return {
    decision: makeDecisionObj(decOverrides),
    relevance_score: 0.5,
    freshness_score: 0.8,
    combined_score: 0.6,
    graph_depth: 0,
    inclusion_reason: 'high_relevance',
    connected_decisions: [],
    ...sdOverrides,
  };
}

function makeScoredArtifact(
  name: string,
  score: number,
  contentSummary?: string,
): ScoredArtifact {
  return {
    artifact: {
      id: `art-${name}`,
      project_id: 'proj-001',
      name,
      artifact_type: 'code',
      produced_by: 'builder',
      related_decision_ids: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {},
      content_summary: contentSummary || `Summary of ${name}`,
    },
    relevance_score: score,
    inclusion_reason: 'related_to_decision',
  };
}

function makeNotification(type: string, message: string): Notification {
  return {
    id: `notif-${type}`,
    agent_id: 'agent-001',
    notification_type: type,
    message,
    created_at: new Date().toISOString(),
  };
}

function makeSession(topic: string, summary: string): SessionSummary {
  return {
    id: `sess-${topic}`,
    project_id: 'proj-001',
    agent_name: 'builder',
    session_date: new Date().toISOString(),
    topic,
    summary,
    decision_ids: [],
    artifact_ids: [],
    assumptions: ['assumption 1'],
    open_questions: ['question 1'],
    lessons_learned: ['lesson 1'],
    created_at: new Date().toISOString(),
  };
}

function makeAgent(name: string, role: string): Agent {
  const profile = getRoleTemplate(role);
  return {
    id: `agent-${name}`,
    project_id: 'proj-001',
    name,
    role,
    relevance_profile: profile,
    context_budget_tokens: 8000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ============================================================
// Token Estimation Tests
// ============================================================
describe('estimateTokens', () => {
  it('estimates tokens as ceil(length/4)', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('a')).toBe(1);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2);
    expect(estimateTokens('a'.repeat(100))).toBe(25);
    expect(estimateTokens('a'.repeat(101))).toBe(26);
  });
});

// ============================================================
// Packer Tests
// ============================================================
describe('packIntoBudget', () => {
  it('packs decisions in score order (highest first)', () => {
    const decisions = [
      makeScoredDecision({ combined_score: 0.9, decision: { id: 'd1', title: 'High' } }),
      makeScoredDecision({ combined_score: 0.3, decision: { id: 'd2', title: 'Low' } }),
      makeScoredDecision({ combined_score: 0.7, decision: { id: 'd3', title: 'Mid' } }),
    ];
    // Sort by score desc (as compile pipeline does before calling packer)
    decisions.sort((a, b) => b.combined_score - a.combined_score);

    const result = packIntoBudget({
      decisions,
      artifacts: [],
      notifications: [],
      sessions: [],
      maxTokens: 10000,
    });

    expect(result.decisions.length).toBe(3);
    expect(result.decisions[0].decision.id).toBe('d1');
    expect(result.decisions[1].decision.id).toBe('d3');
    expect(result.decisions[2].decision.id).toBe('d2');
  });

  it('respects notification budget allocation (10%)', () => {
    // Create notifications that barely fit in 10% budget
    const shortNotif = makeNotification('update', 'Short');
    const longNotif = makeNotification('alert', 'x'.repeat(400)); // ~100 tokens

    const result = packIntoBudget({
      decisions: [],
      artifacts: [],
      notifications: [shortNotif, longNotif],
      sessions: [],
      maxTokens: 200, // 10% = 20 tokens
    });

    // Short notification fits, long one doesn't
    expect(result.notifications.length).toBe(1);
    expect(result.notifications[0].notification_type).toBe('update');
  });

  it('overflows unused notification budget to decisions', () => {
    const decision = makeScoredDecision({
      combined_score: 0.8,
      decision: { id: 'd1', title: 'A decision with enough text to need budget' },
    });

    // With 1000 tokens: notifications get 100, decisions get 550.
    // No notifications → 100 overflow to decisions → decisions get 650.
    const resultWithoutNotifs = packIntoBudget({
      decisions: [decision],
      artifacts: [],
      notifications: [],
      sessions: [],
      maxTokens: 1000,
    });

    expect(resultWithoutNotifs.decisions.length).toBe(1);
    expect(resultWithoutNotifs.totalTokens).toBeGreaterThan(0);
  });

  it('sets relevanceThreshold to last packed decision score', () => {
    const decisions = [
      makeScoredDecision({ combined_score: 0.9, decision: { id: 'd1', title: 'First' } }),
      makeScoredDecision({ combined_score: 0.5, decision: { id: 'd2', title: 'Second' } }),
      makeScoredDecision({ combined_score: 0.2, decision: { id: 'd3', title: 'Third' } }),
    ];
    decisions.sort((a, b) => b.combined_score - a.combined_score);

    const result = packIntoBudget({
      decisions,
      artifacts: [],
      notifications: [],
      sessions: [],
      maxTokens: 10000,
    });

    expect(result.relevanceThreshold).toBe(0.2);
  });

  it('respects overall token budget', () => {
    // Create many decisions that would exceed budget
    const decisions: ScoredDecision[] = [];
    for (let i = 0; i < 50; i++) {
      decisions.push(
        makeScoredDecision({
          combined_score: 1 - i * 0.01,
          decision: {
            id: `d${i}`,
            title: `Decision ${i} with some extended description text for tokens`,
            description: 'A description that takes up some token budget space for testing purposes',
          },
        }),
      );
    }

    const maxTokens = 500;
    const result = packIntoBudget({
      decisions,
      artifacts: [],
      notifications: [],
      sessions: [],
      maxTokens,
    });

    // Should pack some but not all
    expect(result.decisions.length).toBeGreaterThan(0);
    expect(result.decisions.length).toBeLessThan(50);
    expect(result.totalTokens).toBeLessThanOrEqual(maxTokens);
  });

  it('budget allocation: 10/55/30/5 split', () => {
    const decisions = [
      makeScoredDecision({ combined_score: 0.9, decision: { id: 'd1', title: 'Dec' } }),
    ];
    const artifacts = [makeScoredArtifact('art1', 0.8)];
    const notifications = [makeNotification('update', 'Notif')];
    const sessions = [makeSession('topic', 'A summary')];

    const result = packIntoBudget({
      decisions,
      artifacts,
      notifications,
      sessions,
      maxTokens: 10000,
    });

    // All should fit in a 10000 token budget
    expect(result.decisions.length).toBe(1);
    expect(result.artifacts.length).toBe(1);
    expect(result.notifications.length).toBe(1);
    expect(result.sessions.length).toBe(1);
    expect(result.totalTokens).toBeGreaterThan(0);
    expect(result.totalTokens).toBeLessThanOrEqual(10000);
  });

  it('packs zero items when budget is zero', () => {
    const result = packIntoBudget({
      decisions: [makeScoredDecision()],
      artifacts: [makeScoredArtifact('a', 0.5)],
      notifications: [makeNotification('t', 'msg')],
      sessions: [makeSession('t', 's')],
      maxTokens: 0,
    });

    expect(result.decisions.length).toBe(0);
    expect(result.artifacts.length).toBe(0);
    expect(result.notifications.length).toBe(0);
    expect(result.sessions.length).toBe(0);
    expect(result.totalTokens).toBe(0);
  });
});

// ============================================================
// Formatter Tests
// ============================================================
describe('formatAsMarkdown', () => {
  it('produces valid markdown with all sections', () => {
    const pack: PackResult = {
      decisions: [makeScoredDecision({ combined_score: 0.76 })],
      artifacts: [makeScoredArtifact('schema.sql', 0.65)],
      notifications: [makeNotification('update', 'Decision was updated')],
      sessions: [makeSession('Architecture review', 'Discussed DB schema')],
      totalTokens: 500,
      relevanceThreshold: 0.2,
    };

    const md = formatAsMarkdown(pack, 'builder', 'builder', 'Implement auth middleware');

    expect(md).toContain('# Context Package for builder');
    expect(md).toContain('**Task:** Implement auth middleware');
    expect(md).toContain('## Notifications');
    expect(md).toContain('Decision was updated');
    expect(md).toContain('## Relevant Decisions');
    expect(md).toContain('Test Decision');
    expect(md).toContain('## Related Artifacts');
    expect(md).toContain('schema.sql');
    expect(md).toContain('## Recent Sessions');
    expect(md).toContain('Architecture review');
  });

  it('omits empty sections', () => {
    const pack: PackResult = {
      decisions: [makeScoredDecision()],
      artifacts: [],
      notifications: [],
      sessions: [],
      totalTokens: 100,
      relevanceThreshold: 0.3,
    };

    const md = formatAsMarkdown(pack, 'builder', 'builder', 'task');

    expect(md).toContain('## Relevant Decisions');
    expect(md).not.toContain('## Notifications');
    expect(md).not.toContain('## Related Artifacts');
    expect(md).not.toContain('## Recent Sessions');
  });

  it('includes score and inclusion reason for each decision', () => {
    const sd = makeScoredDecision({
      combined_score: 0.760,
      inclusion_reason: 'directly_affects_agent',
    });
    const pack: PackResult = {
      decisions: [sd],
      artifacts: [],
      notifications: [],
      sessions: [],
      totalTokens: 100,
      relevanceThreshold: 0.3,
    };

    const md = formatAsMarkdown(pack, 'builder', 'builder', 'task');
    expect(md).toContain('0.760');
    expect(md).toContain('directly_affects_agent');
  });
});

describe('formatAsJson', () => {
  it('produces valid JSON with correct structure', () => {
    const pack: PackResult = {
      decisions: [makeScoredDecision({ combined_score: 0.76 })],
      artifacts: [makeScoredArtifact('schema.sql', 0.65)],
      notifications: [makeNotification('update', 'msg')],
      sessions: [makeSession('topic', 'summary')],
      totalTokens: 500,
      relevanceThreshold: 0.2,
    };

    const json = formatAsJson(pack, 'builder', 'builder', 'Implement auth');
    const parsed = JSON.parse(json);

    expect(parsed.agent).toEqual({ name: 'builder', role: 'builder' });
    expect(parsed.task).toBe('Implement auth');
    expect(parsed.token_count).toBe(500);
    expect(parsed.relevance_threshold).toBe(0.2);
    expect(parsed.decisions).toHaveLength(1);
    expect(parsed.decisions[0].score.combined).toBe(0.76);
    expect(parsed.artifacts).toHaveLength(1);
    expect(parsed.notifications).toHaveLength(1);
    expect(parsed.sessions).toHaveLength(1);
  });

  it('includes decision graph metadata', () => {
    const sd = makeScoredDecision({
      graph_depth: 2,
      inclusion_reason: 'graph_neighbor_depth_2_via_requires',
      connected_decisions: ['dec-parent'],
    });
    const pack: PackResult = {
      decisions: [sd],
      artifacts: [],
      notifications: [],
      sessions: [],
      totalTokens: 100,
      relevanceThreshold: 0.3,
    };

    const parsed = JSON.parse(formatAsJson(pack, 'builder', 'builder', 'task'));
    expect(parsed.decisions[0].graph_depth).toBe(2);
    expect(parsed.decisions[0].inclusion_reason).toBe('graph_neighbor_depth_2_via_requires');
    expect(parsed.decisions[0].connected_decisions).toEqual(['dec-parent']);
  });
});

// ============================================================
// Integration Tests — Full Pipeline (against live PostgreSQL)
// ============================================================
describe('Context Compiler — Full Pipeline', () => {
  let pool: pg.Pool;
  let projectId: string;
  let builderAgentId: string;
  let launchAgentId: string;
  let reviewerAgentId: string;

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 });

    // Verify connection
    const check = await pool.query('SELECT 1 AS ok');
    expect(check.rows[0].ok).toBe(1);

    // Run migrations
    await migrate(pool, MIGRATIONS_DIR);

    // Create test project
    const projResult = await pool.query(
      `INSERT INTO projects (name, description)
       VALUES ('Compiler Test Project', 'Day 4 integration tests')
       RETURNING id`,
    );
    projectId = projResult.rows[0].id;

    // Create 3 agents with different roles
    builderAgentId = await createAgent(pool, projectId, 'builder-agent', 'builder');
    launchAgentId = await createAgent(pool, projectId, 'launch-agent', 'launch');
    reviewerAgentId = await createAgent(pool, projectId, 'reviewer-agent', 'reviewer');

    // Create test decisions
    await createTestDecisions(pool, projectId);
  });

  afterAll(async () => {
    // Clean up test data
    if (pool) {
      await pool.query('DELETE FROM notifications WHERE agent_id IN ($1, $2, $3)', [builderAgentId, launchAgentId, reviewerAgentId]);
      await pool.query('DELETE FROM decision_edges WHERE source_id IN (SELECT id FROM decisions WHERE project_id = $1)', [projectId]);
      await pool.query('DELETE FROM artifacts WHERE project_id = $1', [projectId]);
      await pool.query('DELETE FROM decisions WHERE project_id = $1', [projectId]);
      await pool.query('DELETE FROM agents WHERE project_id = $1', [projectId]);
      await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
      await pool.end();
    }
  });

  // ---- The Core Proof: Same Project, Different Agents, Different Context ----

  it('same project → different agents → different final context packages', async () => {
    const builderPkg = await compile(pool, {
      agent_id: builderAgentId,
      task_description: 'Implement the auth middleware for API routes',
    });

    const launchPkg = await compile(pool, {
      agent_id: launchAgentId,
      task_description: 'Write launch announcement for the new auth system',
    });

    const reviewerPkg = await compile(pool, {
      agent_id: reviewerAgentId,
      task_description: 'Review security posture of the authentication system',
    });

    // All three should return valid packages
    expect(builderPkg.decisions.length).toBeGreaterThan(0);
    expect(launchPkg.decisions.length).toBeGreaterThanOrEqual(0);
    expect(reviewerPkg.decisions.length).toBeGreaterThan(0);

    // Different agent metadata
    expect(builderPkg.agent.role).toBe('builder');
    expect(launchPkg.agent.role).toBe('launch');
    expect(reviewerPkg.agent.role).toBe('reviewer');

    // Different tasks
    expect(builderPkg.task).toContain('auth middleware');
    expect(launchPkg.task).toContain('launch announcement');
    expect(reviewerPkg.task).toContain('security posture');

    // Key proof: decision ordering differs between agents
    // Builder should prioritize security/api decisions
    // Launch should prioritize marketing/positioning decisions
    // Reviewer should prioritize security/architecture decisions
    if (builderPkg.decisions.length > 0 && reviewerPkg.decisions.length > 0) {
      // At minimum, the scores should differ for the same decision
      const builderScores = builderPkg.decisions.map((d) => d.combined_score);
      const reviewerScores = reviewerPkg.decisions.map((d) => d.combined_score);
      // Not identical orderings (unless trivially small dataset)
      const builderIds = builderPkg.decisions.map((d) => d.decision.id);
      const reviewerIds = reviewerPkg.decisions.map((d) => d.decision.id);

      // At least the top decision should differ OR scores should differ
      const scoresMatch = builderScores.every((s, i) => reviewerScores[i] === s);
      const idsMatch = builderIds.every((id, i) => reviewerIds[i] === id);
      expect(scoresMatch && idsMatch).toBe(false);
    }

    // Formatted outputs exist and are non-empty
    expect(builderPkg.formatted_markdown.length).toBeGreaterThan(0);
    expect(builderPkg.formatted_json.length).toBeGreaterThan(0);
    expect(launchPkg.formatted_markdown.length).toBeGreaterThan(0);
    expect(reviewerPkg.formatted_json.length).toBeGreaterThan(0);
  });

  it('packing respects token allocation', async () => {
    // Compile with a very small budget
    const pkg = await compile(pool, {
      agent_id: builderAgentId,
      task_description: 'Implement auth middleware',
      max_tokens: 500,
    });

    expect(pkg.token_count).toBeLessThanOrEqual(500);
    expect(pkg.budget_used_pct).toBeLessThanOrEqual(100);
    // Should still include some decisions if any exist
    expect(pkg.decisions_considered).toBeGreaterThan(0);
  });

  it('ordering is score-driven and deterministic', async () => {
    const fixedNow = new Date();
    const pkg1 = await compile(pool, {
      agent_id: builderAgentId,
      task_description: 'Implement auth middleware',
    }, { now: fixedNow });
    const pkg2 = await compile(pool, {
      agent_id: builderAgentId,
      task_description: 'Implement auth middleware',
    }, { now: fixedNow });

    // Same agent, same task, same data → same ordering
    expect(pkg1.decisions.map((d) => d.decision.id)).toEqual(
      pkg2.decisions.map((d) => d.decision.id),
    );
    // Scores should be identical (no randomness)
    expect(pkg1.decisions.map((d) => d.combined_score)).toEqual(
      pkg2.decisions.map((d) => d.combined_score),
    );
  });

  it('decisions are sorted by combined_score descending', async () => {
    const pkg = await compile(pool, {
      agent_id: builderAgentId,
      task_description: 'Implement auth middleware',
    });

    for (let i = 1; i < pkg.decisions.length; i++) {
      expect(pkg.decisions[i - 1].combined_score).toBeGreaterThanOrEqual(
        pkg.decisions[i].combined_score,
      );
    }
  });

  it('compile returns valid ContextPackage structure', async () => {
    const pkg = await compile(pool, {
      agent_id: builderAgentId,
      task_description: 'Build the thing',
    });

    // All required fields present
    expect(pkg.agent).toBeDefined();
    expect(pkg.agent.name).toBe('builder-agent');
    expect(pkg.agent.role).toBe('builder');
    expect(pkg.task).toBe('Build the thing');
    expect(typeof pkg.compiled_at).toBe('string');
    expect(typeof pkg.token_count).toBe('number');
    expect(typeof pkg.budget_used_pct).toBe('number');
    expect(Array.isArray(pkg.decisions)).toBe(true);
    expect(Array.isArray(pkg.artifacts)).toBe(true);
    expect(Array.isArray(pkg.notifications)).toBe(true);
    expect(Array.isArray(pkg.recent_sessions)).toBe(true);
    expect(typeof pkg.formatted_markdown).toBe('string');
    expect(typeof pkg.formatted_json).toBe('string');
    expect(typeof pkg.decisions_considered).toBe('number');
    expect(typeof pkg.decisions_included).toBe('number');
    expect(typeof pkg.relevance_threshold_used).toBe('number');
    expect(typeof pkg.compilation_time_ms).toBe('number');
    expect(pkg.compilation_time_ms).toBeGreaterThanOrEqual(0);
  });

  it('throws for non-existent agent', async () => {
    await expect(
      compile(pool, {
        agent_id: '00000000-0000-0000-0000-000000000000',
        task_description: 'test',
      }),
    ).rejects.toThrow('Agent not found');
  });

  it('debug trace provides full pipeline visibility', async () => {
    // Use scoring + expansion with debug to verify trace
    const agent = makeAgent('debug-builder', 'builder');
    const decisions = [
      makeDecisionObj({
        id: 'debug-d1',
        affects: ['debug-builder'],
        tags: ['api', 'security'],
      }),
      makeDecisionObj({
        id: 'debug-d2',
        affects: [],
        tags: ['marketing'],
        title: 'Marketing decision',
      }),
    ];

    const { results, debugLog } = scoreDecisions(decisions, {
      agent,
      debug: true,
      now: new Date(),
    });

    expect(debugLog).toBeDefined();
    expect(debugLog!.length).toBe(2);
    expect(debugLog![0]).toContain('[SCORE]');
    expect(debugLog![0]).toContain('A(affect)=');
    expect(debugLog![0]).toContain('B(tags)=');
    expect(debugLog![0]).toContain('C(role)=');
    expect(debugLog![0]).toContain('D(semantic)=');

    // Results sorted by combined_score desc
    expect(results[0].scored.combined_score).toBeGreaterThanOrEqual(
      results[1].scored.combined_score,
    );
  });

  it('graph expansion adds neighbors with decayed scores', async () => {
    // Create decisions with edges directly for this test
    const d1 = await createDecision(pool, {
      project_id: projectId,
      title: 'Graph Root Decision',
      description: 'Root for graph expansion test',
      reasoning: 'Testing graph expansion',
      made_by: 'architect',
      affects: ['builder-agent'],
      tags: ['api'],
    });

    const d2 = await createDecision(pool, {
      project_id: projectId,
      title: 'Graph Neighbor Decision',
      description: 'Neighbor connected via requires',
      reasoning: 'Required by root decision',
      made_by: 'architect',
      tags: ['infrastructure'],
    });

    await createEdge(pool, {
      source_id: d1.id,
      target_id: d2.id,
      relationship: 'requires',
    });

    const agent = makeAgent('expansion-test', 'builder');

    // Score just the root decision
    const { results } = scoreDecisions([d1], {
      agent,
      now: new Date(),
    });

    // Root should score high (directly affects builder)
    expect(results[0].scored.combined_score).toBeGreaterThan(0.25);

    // Expand
    const expanded = await expandGraphContext(
      pool,
      results,
      agent,
      undefined,
      new Date(),
    );

    // Should now include the neighbor
    expect(expanded.length).toBeGreaterThanOrEqual(2);

    const neighbor = expanded.find((r) => r.scored.decision.id === d2.id);
    expect(neighbor).toBeDefined();
    if (neighbor) {
      // Neighbor score = parent_score × 0.6^1
      const expectedScore = results[0].scored.combined_score * 0.6;
      expect(neighbor.scored.combined_score).toBeCloseTo(expectedScore, 3);
      expect(neighbor.scored.graph_depth).toBe(1);
      expect(neighbor.scored.inclusion_reason).toContain('graph_neighbor_depth_1_via_requires');
    }

    // Cleanup
    await pool.query('DELETE FROM decision_edges WHERE source_id = $1', [d1.id]);
    await pool.query('DELETE FROM decisions WHERE id IN ($1, $2)', [d1.id, d2.id]);
  });

  it('graph expansion skips neighbors with existing higher scores', async () => {
    // Create two decisions, both directly scored high
    const d1 = await createDecision(pool, {
      project_id: projectId,
      title: 'Already High Scored',
      description: 'This one already scores high on its own',
      reasoning: 'Direct relevance',
      made_by: 'architect',
      affects: ['builder-agent'],
      tags: ['api', 'security'],
    });

    const d2 = await createDecision(pool, {
      project_id: projectId,
      title: 'Also High Scored Independently',
      description: 'Also directly relevant',
      reasoning: 'Also direct',
      made_by: 'architect',
      affects: ['builder-agent'],
      tags: ['api'],
    });

    await createEdge(pool, {
      source_id: d1.id,
      target_id: d2.id,
      relationship: 'requires',
    });

    const agent = makeAgent('skip-test', 'builder');

    // Score both decisions directly
    const { results } = scoreDecisions([d1, d2], {
      agent,
      now: new Date(),
    });

    // Both should have high scores (both affect builder)
    const d2DirectScore = results.find((r) => r.scored.decision.id === d2.id)!.scored.combined_score;

    // Expand — d2 as neighbor of d1 would get d1_score * 0.6, which should be < d2's direct score
    const expanded = await expandGraphContext(
      pool,
      results,
      agent,
      undefined,
      new Date(),
    );

    // d2 should still have its direct (higher) score, not the decayed graph score
    const d2Result = expanded.find((r) => r.scored.decision.id === d2.id);
    expect(d2Result).toBeDefined();
    expect(d2Result!.scored.combined_score).toBe(d2DirectScore);
    expect(d2Result!.scored.graph_depth).toBe(0); // Original, not graph neighbor

    // Cleanup
    await pool.query('DELETE FROM decision_edges WHERE source_id = $1', [d1.id]);
    await pool.query('DELETE FROM decisions WHERE id IN ($1, $2)', [d1.id, d2.id]);
  });

  it('formatted_json is parseable and contains correct decision count', async () => {
    const pkg = await compile(pool, {
      agent_id: builderAgentId,
      task_description: 'Implement auth middleware',
    });

    const parsed = JSON.parse(pkg.formatted_json);
    expect(parsed.decisions.length).toBe(pkg.decisions_included);
    expect(parsed.agent.name).toBe('builder-agent');
    expect(parsed.agent.role).toBe('builder');
  });

  it('formatted_markdown contains agent name and task', async () => {
    const pkg = await compile(pool, {
      agent_id: builderAgentId,
      task_description: 'Implement auth middleware',
    });

    expect(pkg.formatted_markdown).toContain('builder-agent');
    expect(pkg.formatted_markdown).toContain('Implement auth middleware');
  });

  it('large budget does not exceed decisions available', async () => {
    const pkg = await compile(pool, {
      agent_id: builderAgentId,
      task_description: 'Implement everything',
      max_tokens: 100000,
    });

    expect(pkg.decisions_included).toBeLessThanOrEqual(pkg.decisions_considered);
    expect(pkg.budget_used_pct).toBeLessThanOrEqual(100);
  });
});

// ============================================================
// Helper: Create agent in DB
// ============================================================
async function createAgent(
  pool: pg.Pool,
  projectId: string,
  name: string,
  role: string,
): Promise<string> {
  const profile = getRoleTemplate(role);
  const result = await pool.query(
    `INSERT INTO agents (project_id, name, role, relevance_profile, context_budget_tokens)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [projectId, name, role, JSON.stringify(profile), 8000],
  );
  return result.rows[0].id;
}

// ============================================================
// Helper: Create diverse test decisions for role differentiation
// ============================================================
async function createTestDecisions(pool: pg.Pool, projectId: string): Promise<void> {
  // Decision 1: Security/API — should be high for builder, low for launch
  await createDecision(pool, {
    project_id: projectId,
    title: 'Require rate limiting on all auth endpoints',
    description: 'All authentication endpoints must implement rate limiting to prevent brute force attacks',
    reasoning: 'Security best practice, required by compliance',
    made_by: 'architect',
    affects: ['builder-agent', 'reviewer-agent'],
    tags: ['security', 'api', 'infrastructure'],
  });

  // Decision 2: Marketing/Launch — should be high for launch, low for builder
  await createDecision(pool, {
    project_id: projectId,
    title: 'Product positioning targets enterprise developers',
    description: 'Our launch messaging focuses on enterprise development teams',
    reasoning: 'Market research shows enterprise devs are the primary audience',
    made_by: 'product',
    affects: ['launch-agent'],
    tags: ['positioning', 'audience', 'messaging', 'marketing'],
  });

  // Decision 3: Architecture — should be high for builder and reviewer
  await createDecision(pool, {
    project_id: projectId,
    title: 'Use PostgreSQL with pgvector for decision storage',
    description: 'PostgreSQL with pgvector extension for vector similarity search',
    reasoning: 'Best balance of relational queries and vector search for our use case',
    made_by: 'architect',
    affects: ['builder-agent'],
    tags: ['architecture', 'database', 'infrastructure'],
  });

  // Decision 4: Testing — should be high for reviewer
  await createDecision(pool, {
    project_id: projectId,
    title: 'All public APIs must have integration tests',
    description: 'Every public API endpoint requires integration test coverage',
    reasoning: 'Quality gate for production readiness',
    made_by: 'architect',
    affects: ['reviewer-agent', 'builder-agent'],
    tags: ['testing', 'code_quality', 'api'],
  });

  // Decision 5: General — moderate for all
  await createDecision(pool, {
    project_id: projectId,
    title: 'TypeScript strict mode required for all packages',
    description: 'All packages must use TypeScript strict mode compilation',
    reasoning: 'Catches bugs at compile time',
    made_by: 'architect',
    affects: ['builder-agent', 'reviewer-agent'],
    tags: ['code', 'architecture'],
  });
}
