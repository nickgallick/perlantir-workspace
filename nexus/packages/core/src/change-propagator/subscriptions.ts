// ============================================================
// NEXUS v1 — Subscription Management
// Spec §10: Manages agent subscriptions to decision topics
// Uses raw pg.Pool per AMB-1
// ============================================================

import pg from 'pg';
import { parseSubscriptionRow } from '../db/parsers.js';
import type { Subscription } from '../types.js';

export interface CreateSubscriptionInput {
  agent_id: string;
  topic: string;
  notify_on?: ('update' | 'supersede' | 'revert')[];
}

/**
 * Create or update a subscription (upsert on agent_id + topic).
 */
export async function createSubscription(
  pool: pg.Pool,
  input: CreateSubscriptionInput,
): Promise<Subscription> {
  const notifyOn = input.notify_on ?? ['update', 'supersede', 'revert'];
  const result = await pool.query(
    `INSERT INTO subscriptions (agent_id, topic, notify_on)
     VALUES ($1, $2, $3)
     ON CONFLICT ON CONSTRAINT uq_subscription
     DO UPDATE SET notify_on = $3
     RETURNING *`,
    [input.agent_id, input.topic, notifyOn],
  );
  return parseSubscriptionRow(result.rows[0]);
}

/**
 * List all subscriptions for an agent.
 */
export async function listSubscriptions(
  pool: pg.Pool,
  agentId: string,
): Promise<Subscription[]> {
  const result = await pool.query(
    'SELECT * FROM subscriptions WHERE agent_id = $1 ORDER BY created_at ASC',
    [agentId],
  );
  return result.rows.map((r: Record<string, unknown>) => parseSubscriptionRow(r));
}

/**
 * Find subscriptions matching a topic pattern.
 * Matches exact topic or subscriptions where the topic is a prefix.
 */
export async function findMatchingSubscriptions(
  pool: pg.Pool,
  topic: string,
  notifyType: 'update' | 'supersede' | 'revert',
): Promise<Subscription[]> {
  const result = await pool.query(
    `SELECT * FROM subscriptions
     WHERE topic = $1 AND $2 = ANY(notify_on)
     ORDER BY created_at ASC`,
    [topic, notifyType],
  );
  return result.rows.map((r: Record<string, unknown>) => parseSubscriptionRow(r));
}

/**
 * Delete a subscription.
 */
export async function deleteSubscription(
  pool: pg.Pool,
  subscriptionId: string,
): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM subscriptions WHERE id = $1',
    [subscriptionId],
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Delete all subscriptions for an agent.
 */
export async function deleteAgentSubscriptions(
  pool: pg.Pool,
  agentId: string,
): Promise<number> {
  const result = await pool.query(
    'DELETE FROM subscriptions WHERE agent_id = $1',
    [agentId],
  );
  return result.rowCount ?? 0;
}


