// ============================================================
// NEXUS v1 — Canonical Row Parsers
// Single source of truth for converting pg result rows to typed objects.
// All modules import from here — no local parse functions.
// ============================================================

import type {
  Project,
  Agent,
  Decision,
  DecisionEdge,
  Artifact,
  Subscription,
  Notification,
} from '../types.js';

/**
 * Parse a project row from PostgreSQL into a typed Project.
 */
export function parseProjectRow(row: Record<string, unknown>): Project {
  return {
    ...row,
    metadata:
      typeof row.metadata === 'string'
        ? JSON.parse(row.metadata as string)
        : (row.metadata as Record<string, unknown>),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  } as Project;
}

/**
 * Parse an agent row from PostgreSQL into a typed Agent.
 */
export function parseAgentRow(row: Record<string, unknown>): Agent {
  return {
    ...row,
    relevance_profile:
      typeof row.relevance_profile === 'string'
        ? JSON.parse(row.relevance_profile as string)
        : row.relevance_profile,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  } as Agent;
}

/**
 * Parse a decision row from PostgreSQL into a typed Decision.
 */
export function parseDecisionRow(row: Record<string, unknown>): Decision {
  return {
    ...row,
    alternatives_considered:
      typeof row.alternatives_considered === 'string'
        ? JSON.parse(row.alternatives_considered as string)
        : (row.alternatives_considered as Decision['alternatives_considered']),
    metadata:
      typeof row.metadata === 'string'
        ? JSON.parse(row.metadata as string)
        : (row.metadata as Record<string, unknown>),
    embedding: row.embedding
      ? typeof row.embedding === 'string'
        ? JSON.parse(row.embedding as string)
        : (row.embedding as number[])
      : undefined,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    validated_at: row.validated_at ? String(row.validated_at) : undefined,
    supersedes_id: row.supersedes_id ? String(row.supersedes_id) : undefined,
  } as Decision;
}

/**
 * Parse an edge row from PostgreSQL into a typed DecisionEdge.
 */
export function parseEdgeRow(row: Record<string, unknown>): DecisionEdge {
  return {
    ...row,
    created_at: String(row.created_at),
  } as DecisionEdge;
}

/**
 * Parse an artifact row from PostgreSQL into a typed Artifact.
 */
export function parseArtifactRow(row: Record<string, unknown>): Artifact {
  return {
    ...row,
    metadata:
      typeof row.metadata === 'string'
        ? JSON.parse(row.metadata as string)
        : (row.metadata as Record<string, unknown>),
    related_decision_ids: (row.related_decision_ids as string[]) ?? [],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    embedding: row.embedding
      ? typeof row.embedding === 'string'
        ? JSON.parse(row.embedding as string)
        : (row.embedding as number[])
      : undefined,
  } as Artifact;
}

/**
 * Parse a subscription row from PostgreSQL into a typed Subscription.
 */
export function parseSubscriptionRow(row: Record<string, unknown>): Subscription {
  return {
    id: String(row.id),
    agent_id: String(row.agent_id),
    topic: String(row.topic),
    notify_on: row.notify_on as ('update' | 'supersede' | 'revert')[],
  };
}

/**
 * Parse a notification row from PostgreSQL into a typed Notification.
 */
export function parseNotificationRow(row: Record<string, unknown>): Notification {
  return {
    ...row,
    created_at: String(row.created_at),
    read_at: row.read_at ? String(row.read_at) : undefined,
  } as Notification;
}
