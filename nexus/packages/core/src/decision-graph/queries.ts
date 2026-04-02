// ============================================================
// NEXUS v1 — Edge CRUD
// Spec §4 (decision_edges table)
// ============================================================

import pg from 'pg';
import { parseEdgeRow } from '../db/parsers.js';
import type { DecisionEdge, EdgeRelationship } from '../types.js';

export interface CreateEdgeParams {
  source_id: string;
  target_id: string;
  relationship: EdgeRelationship;
  description?: string;
}

/**
 * Create an edge between two decisions.
 */
export async function createEdge(
  pool: pg.Pool,
  params: CreateEdgeParams,
): Promise<DecisionEdge> {
  const result = await pool.query(
    `INSERT INTO decision_edges (source_id, target_id, relationship, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [params.source_id, params.target_id, params.relationship, params.description ?? null],
  );
  return parseEdgeRow(result.rows[0]);
}

/**
 * List all edges originating from a decision.
 */
export async function listEdgesBySource(
  pool: pg.Pool,
  sourceId: string,
): Promise<DecisionEdge[]> {
  const result = await pool.query(
    `SELECT * FROM decision_edges WHERE source_id = $1 ORDER BY created_at ASC`,
    [sourceId],
  );
  return result.rows.map((r: Record<string, unknown>) => parseEdgeRow(r));
}

/**
 * List all edges targeting a decision.
 */
export async function listEdgesByTarget(
  pool: pg.Pool,
  targetId: string,
): Promise<DecisionEdge[]> {
  const result = await pool.query(
    `SELECT * FROM decision_edges WHERE target_id = $1 ORDER BY created_at ASC`,
    [targetId],
  );
  return result.rows.map((r: Record<string, unknown>) => parseEdgeRow(r));
}

/**
 * List all edges for a decision (both directions).
 */
export async function listEdgesByDecision(
  pool: pg.Pool,
  decisionId: string,
): Promise<DecisionEdge[]> {
  const result = await pool.query(
    `SELECT * FROM decision_edges
     WHERE source_id = $1 OR target_id = $1
     ORDER BY created_at ASC`,
    [decisionId],
  );
  return result.rows.map((r: Record<string, unknown>) => parseEdgeRow(r));
}

/**
 * Delete an edge by ID.
 */
export async function deleteEdge(
  pool: pg.Pool,
  edgeId: string,
): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM decision_edges WHERE id = $1',
    [edgeId],
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * List edges filtered by relationship type within a project.
 */
export async function listEdgesByRelationship(
  pool: pg.Pool,
  projectId: string,
  relationship: EdgeRelationship,
): Promise<DecisionEdge[]> {
  const result = await pool.query(
    `SELECT e.* FROM decision_edges e
     JOIN decisions d ON e.source_id = d.id
     WHERE d.project_id = $1 AND e.relationship = $2
     ORDER BY e.created_at ASC`,
    [projectId, relationship],
  );
  return result.rows.map((r: Record<string, unknown>) => parseEdgeRow(r));
}


