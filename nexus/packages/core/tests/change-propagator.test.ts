// ============================================================
// NEXUS v1 — Change Propagator Tests
// Spec §10 + §20 testing strategy:
// - Decision created → affected agents get notifications
// - Decision superseded → both old and new affects get notified
// - Different roles get different notification messages
// - WebSocket clients receive real-time push
// - Subscription CRUD
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { migrate } from '../src/db/migrator.js';
import { ChangePropagator } from '../src/change-propagator/propagator.js';
import {
  createSubscription,
  listSubscriptions,
  deleteSubscription,
  deleteAgentSubscriptions,
  findMatchingSubscriptions,
} from '../src/change-propagator/subscriptions.js';
import { createDecision, updateDecisionStatus } from '../src/decision-graph/graph.js';
import { getRoleTemplate } from '../src/roles.js';
import type { Decision, Notification } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_DIR = join(__dirname, '..', '..', '..', 'supabase', 'migrations');

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://nexus:nexus_dev@localhost:5432/nexus';

let pool: pg.Pool;
let projectId: string;
const agentIds: Record<string, string> = {};

beforeAll(async () => {
  pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 });
  await pool.query('SELECT 1');
  await migrate(pool, MIGRATIONS_DIR);

  // Create project
  const proj = await pool.query(
    `INSERT INTO projects (name) VALUES ('Propagator Test Project') RETURNING id`,
  );
  projectId = proj.rows[0].id;

  // Create agents with different roles
  for (const [name, role] of [
    ['builder-cp', 'builder'],
    ['reviewer-cp', 'reviewer'],
    ['launch-cp', 'launch'],
    ['ops-cp', 'ops'],
  ] as const) {
    const profile = getRoleTemplate(role);
    const r = await pool.query(
      `INSERT INTO agents (project_id, name, role, relevance_profile, context_budget_tokens)
       VALUES ($1, $2, $3, $4, 8000) RETURNING id`,
      [projectId, name, role, JSON.stringify(profile)],
    );
    agentIds[name] = r.rows[0].id;
  }
});

afterAll(async () => {
  if (pool && projectId) {
    await pool.query('DELETE FROM notifications WHERE agent_id = ANY($1)', [Object.values(agentIds)]);
    await pool.query('DELETE FROM subscriptions WHERE agent_id = ANY($1)', [Object.values(agentIds)]);
    await pool.query('DELETE FROM decision_edges WHERE source_id IN (SELECT id FROM decisions WHERE project_id = $1)', [projectId]);
    await pool.query('DELETE FROM decisions WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM agents WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    await pool.end();
  }
});

// Helper: get notifications for an agent
async function getNotifications(agentId: string): Promise<Notification[]> {
  const result = await pool.query(
    'SELECT * FROM notifications WHERE agent_id = $1 ORDER BY created_at DESC',
    [agentId],
  );
  return result.rows as Notification[];
}

// Helper: clear notifications
async function clearNotifications(): Promise<void> {
  await pool.query('DELETE FROM notifications WHERE agent_id = ANY($1)', [Object.values(agentIds)]);
}

// ============================================================
// ChangePropagator Tests
// ============================================================
describe('ChangePropagator', () => {
  it('onDecisionCreated → affected agents get notifications', async () => {
    await clearNotifications();
    const propagator = new ChangePropagator(pool);

    const decision = await createDecision(pool, {
      project_id: projectId,
      title: 'Use JWT for API auth',
      description: 'Stateless JWT tokens for all API authentication',
      reasoning: 'Scalability and statelessness',
      made_by: 'architect',
      affects: ['builder-cp', 'reviewer-cp'],
      tags: ['security', 'api'],
    });

    const notifications = await propagator.onDecisionCreated(decision);

    expect(notifications).toHaveLength(2);
    expect(notifications.map((n) => n.agent_name).sort()).toEqual(['builder-cp', 'reviewer-cp']);

    // All notifications should contain the decision title
    for (const n of notifications) {
      expect(n.message).toContain('Use JWT for API auth');
      expect(n.message).toContain('architect'); // changed_by
    }

    // Verify persisted to DB
    const builderNotifs = await getNotifications(agentIds['builder-cp']);
    expect(builderNotifs.length).toBeGreaterThanOrEqual(1);
    expect(builderNotifs[0].notification_type).toBe('decision_created');
    expect(builderNotifs[0].decision_id).toBe(decision.id);
  });

  it('onDecisionCreated → unaffected agents do NOT get notifications', async () => {
    await clearNotifications();
    const propagator = new ChangePropagator(pool);

    const decision = await createDecision(pool, {
      project_id: projectId,
      title: 'Marketing copy for launch page',
      description: 'Focus on enterprise messaging',
      reasoning: 'Market research',
      made_by: 'product',
      affects: ['launch-cp'], // Only launch
      tags: ['marketing'],
    });

    const notifications = await propagator.onDecisionCreated(decision);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].agent_name).toBe('launch-cp');

    // Builder should have NO notifications
    const builderNotifs = await getNotifications(agentIds['builder-cp']);
    expect(builderNotifs).toHaveLength(0);
  });

  it('different roles get different notification context', async () => {
    await clearNotifications();
    const propagator = new ChangePropagator(pool);

    const decision = await createDecision(pool, {
      project_id: projectId,
      title: 'Require rate limiting',
      description: 'All auth endpoints need rate limiting',
      reasoning: 'Security',
      made_by: 'architect',
      affects: ['builder-cp', 'launch-cp', 'ops-cp'],
      tags: ['security', 'api'],
    });

    const notifications = await propagator.onDecisionCreated(decision);

    expect(notifications).toHaveLength(3);

    const builderNotif = notifications.find((n) => n.agent_role === 'builder');
    const launchNotif = notifications.find((n) => n.agent_role === 'launch');
    const opsNotif = notifications.find((n) => n.agent_role === 'ops');

    expect(builderNotif).toBeDefined();
    expect(launchNotif).toBeDefined();
    expect(opsNotif).toBeDefined();

    // Each role gets different context
    expect(builderNotif!.role_context).toContain('implementation');
    expect(launchNotif!.role_context).toContain('messaging');
    expect(opsNotif!.role_context).toContain('Infrastructure');

    // All three contexts should be different
    expect(builderNotif!.role_context).not.toBe(launchNotif!.role_context);
    expect(builderNotif!.role_context).not.toBe(opsNotif!.role_context);
    expect(launchNotif!.role_context).not.toBe(opsNotif!.role_context);
  });

  it('onDecisionSuperseded → both old and new affects get notified', async () => {
    await clearNotifications();
    const propagator = new ChangePropagator(pool);

    const oldDecision = await createDecision(pool, {
      project_id: projectId,
      title: 'Delay SSO until post-launch',
      description: 'No SAML/OIDC in v1',
      reasoning: 'Scope management',
      made_by: 'product',
      affects: ['builder-cp', 'launch-cp'],
      tags: ['scope'],
    });

    const newDecision = await createDecision(pool, {
      project_id: projectId,
      title: 'Include SSO for enterprise beta',
      description: 'SAML SSO for enterprise at launch',
      reasoning: 'Enterprise demand',
      made_by: 'product',
      affects: ['builder-cp', 'ops-cp'], // Different affects
      tags: ['scope', 'enterprise'],
    });

    const notifications = await propagator.onDecisionSuperseded(newDecision, oldDecision);

    // Union of old + new affects: builder-cp, launch-cp, ops-cp
    const notifiedNames = notifications.map((n) => n.agent_name).sort();
    expect(notifiedNames).toEqual(['builder-cp', 'launch-cp', 'ops-cp']);

    // Message should reference the supersession
    for (const n of notifications) {
      expect(n.message).toContain('Delay SSO'); // old title
      expect(n.message).toContain('Include SSO'); // new title
      expect(n.message).toContain('→'); // transition marker
    }

    // Urgency should be high for supersession
    for (const n of notifications) {
      expect(n.urgency).toBe('high');
    }
  });

  it('onDecisionReverted → affected agents get high-urgency notification', async () => {
    await clearNotifications();
    const propagator = new ChangePropagator(pool);

    const decision = await createDecision(pool, {
      project_id: projectId,
      title: 'Use GraphQL for API layer',
      description: 'Replace REST with GraphQL',
      reasoning: 'Flexibility',
      made_by: 'architect',
      affects: ['builder-cp', 'reviewer-cp'],
      tags: ['api', 'architecture'],
    });

    const notifications = await propagator.onDecisionReverted(decision, 'tech-lead');

    expect(notifications).toHaveLength(2);
    for (const n of notifications) {
      expect(n.message).toContain('reverted');
      expect(n.message).toContain('tech-lead');
      expect(n.urgency).toBe('high');
    }
  });

  it('WebSocket clients receive real-time push', async () => {
    await clearNotifications();

    // Mock WebSocket
    const received: string[] = [];
    const mockWs = {
      readyState: 1, // OPEN
      send: (data: string) => received.push(data),
    };

    const propagator = new ChangePropagator(pool, new Map());
    propagator.registerClient(agentIds['builder-cp'], mockWs);

    const decision = await createDecision(pool, {
      project_id: projectId,
      title: 'WS test decision',
      description: 'Testing WebSocket push',
      reasoning: 'Testing',
      made_by: 'architect',
      affects: ['builder-cp'],
      tags: ['test'],
    });

    await propagator.onDecisionCreated(decision);

    expect(received).toHaveLength(1);
    const parsed = JSON.parse(received[0]);
    expect(parsed.type).toBe('notification');
    expect(parsed.data.agent_name).toBe('builder-cp');
    expect(parsed.data.message).toContain('WS test decision');

    propagator.removeClient(agentIds['builder-cp']);
  });

  it('WebSocket not sent if client disconnected', async () => {
    await clearNotifications();

    const received: string[] = [];
    const mockWs = {
      readyState: 3, // CLOSED
      send: (data: string) => received.push(data),
    };

    const propagator = new ChangePropagator(pool, new Map());
    propagator.registerClient(agentIds['builder-cp'], mockWs);

    const decision = await createDecision(pool, {
      project_id: projectId,
      title: 'Closed WS test',
      description: 'Should not push',
      reasoning: 'Testing',
      made_by: 'architect',
      affects: ['builder-cp'],
      tags: ['test'],
    });

    await propagator.onDecisionCreated(decision);

    // Should NOT have received WebSocket message (readyState !== 1)
    expect(received).toHaveLength(0);

    // But notification should still be persisted to DB
    const notifs = await getNotifications(agentIds['builder-cp']);
    expect(notifs.length).toBeGreaterThanOrEqual(1);
  });

  it('notification_type is correct for each event type', async () => {
    await clearNotifications();
    const propagator = new ChangePropagator(pool);

    const d1 = await createDecision(pool, {
      project_id: projectId,
      title: 'Type test created',
      description: 'test', reasoning: 'test', made_by: 'arch',
      affects: ['builder-cp'], tags: ['test'],
    });

    await propagator.onDecisionCreated(d1);
    let notifs = await getNotifications(agentIds['builder-cp']);
    expect(notifs[0].notification_type).toBe('decision_created');

    await clearNotifications();
    const d2 = await createDecision(pool, {
      project_id: projectId,
      title: 'Type test superseded',
      description: 'test', reasoning: 'test', made_by: 'arch',
      affects: ['builder-cp'], tags: ['test'],
    });
    await propagator.onDecisionSuperseded(d2, d1);
    notifs = await getNotifications(agentIds['builder-cp']);
    expect(notifs[0].notification_type).toBe('decision_superseded');

    await clearNotifications();
    await propagator.onDecisionReverted(d1, 'arch');
    notifs = await getNotifications(agentIds['builder-cp']);
    expect(notifs[0].notification_type).toBe('decision_reverted');
  });
});

// ============================================================
// Subscription Tests
// ============================================================
describe('Subscriptions', () => {
  it('create and list subscriptions', async () => {
    const sub = await createSubscription(pool, {
      agent_id: agentIds['builder-cp'],
      topic: 'security',
    });

    expect(sub.agent_id).toBe(agentIds['builder-cp']);
    expect(sub.topic).toBe('security');
    expect(sub.notify_on).toEqual(['update', 'supersede', 'revert']);

    const subs = await listSubscriptions(pool, agentIds['builder-cp']);
    expect(subs.length).toBeGreaterThanOrEqual(1);
    expect(subs.find((s) => s.topic === 'security')).toBeDefined();
  });

  it('upsert updates notify_on', async () => {
    await createSubscription(pool, {
      agent_id: agentIds['reviewer-cp'],
      topic: 'api',
      notify_on: ['update'],
    });

    // Upsert with different notify_on
    const updated = await createSubscription(pool, {
      agent_id: agentIds['reviewer-cp'],
      topic: 'api',
      notify_on: ['update', 'supersede'],
    });

    expect(updated.notify_on).toEqual(['update', 'supersede']);

    const subs = await listSubscriptions(pool, agentIds['reviewer-cp']);
    const apiSub = subs.find((s) => s.topic === 'api');
    expect(apiSub!.notify_on).toEqual(['update', 'supersede']);
  });

  it('findMatchingSubscriptions filters by topic and type', async () => {
    await createSubscription(pool, {
      agent_id: agentIds['ops-cp'],
      topic: 'infrastructure',
      notify_on: ['update', 'revert'],
    });

    const matches = await findMatchingSubscriptions(pool, 'infrastructure', 'update');
    expect(matches.length).toBeGreaterThanOrEqual(1);

    // Should NOT match 'supersede' since ops only subscribed to update + revert
    const noMatch = await findMatchingSubscriptions(pool, 'infrastructure', 'supersede');
    const opsMatch = noMatch.find((s) => s.agent_id === agentIds['ops-cp']);
    expect(opsMatch).toBeUndefined();
  });

  it('delete subscription', async () => {
    const sub = await createSubscription(pool, {
      agent_id: agentIds['launch-cp'],
      topic: 'delete-test',
    });

    const deleted = await deleteSubscription(pool, sub.id);
    expect(deleted).toBe(true);

    const subs = await listSubscriptions(pool, agentIds['launch-cp']);
    expect(subs.find((s) => s.topic === 'delete-test')).toBeUndefined();
  });

  it('deleteAgentSubscriptions removes all', async () => {
    await createSubscription(pool, {
      agent_id: agentIds['launch-cp'],
      topic: 'topic-a',
    });
    await createSubscription(pool, {
      agent_id: agentIds['launch-cp'],
      topic: 'topic-b',
    });

    const count = await deleteAgentSubscriptions(pool, agentIds['launch-cp']);
    expect(count).toBeGreaterThanOrEqual(2);

    const subs = await listSubscriptions(pool, agentIds['launch-cp']);
    expect(subs).toHaveLength(0);
  });
});
