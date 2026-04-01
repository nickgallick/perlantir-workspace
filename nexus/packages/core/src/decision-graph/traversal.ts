// ============================================================
// NEXUS v1 — Graph Traversal
// Calls the get_connected_decisions SQL function via pg.Pool
// Spec §4 (function) + §7 (graph expansion)
// ============================================================

import pg from 'pg';
import type { ConnectedDecision } from '../types.js';

/**
 * Find all decisions connected to a starting decision within N hops.
 * Uses the recursive CTE function `get_connected_decisions` defined in the schema.
 *
 * @param pool - pg.Pool instance
 * @param startId - UUID of the origin decision
 * @param maxDepth - maximum hops to traverse (default: 3)
 * @returns connected decisions with depth, path, and relationship info
 */
export async function getConnectedDecisions(
  pool: pg.Pool,
  startId: string,
  maxDepth: number = 3,
): Promise<ConnectedDecision[]> {
  const result = await pool.query<{
    decision_id: string;
    depth: number;
    path: string[];
    via_relationship: string;
  }>(
    'SELECT * FROM get_connected_decisions($1, $2)',
    [startId, maxDepth],
  );

  return result.rows.map((row) => ({
    decision_id: row.decision_id,
    depth: row.depth,
    path: row.path,
    via_relationship: row.via_relationship,
  }));
}

/**
 * Get all decisions in a project's graph as an adjacency list.
 * Useful for visualization or bulk analysis.
 */
export async function getProjectGraph(
  pool: pg.Pool,
  projectId: string,
): Promise<{
  nodes: Array<{ id: string; title: string; status: string }>;
  edges: Array<{ source_id: string; target_id: string; relationship: string }>;
}> {
  const [nodesResult, edgesResult] = await Promise.all([
    pool.query<{ id: string; title: string; status: string }>(
      'SELECT id, title, status FROM decisions WHERE project_id = $1 ORDER BY created_at ASC',
      [projectId],
    ),
    pool.query<{ source_id: string; target_id: string; relationship: string }>(
      `SELECT e.source_id, e.target_id, e.relationship
       FROM decision_edges e
       JOIN decisions d ON e.source_id = d.id
       WHERE d.project_id = $1
       ORDER BY e.created_at ASC`,
      [projectId],
    ),
  ]);

  return {
    nodes: nodesResult.rows,
    edges: edgesResult.rows,
  };
}
