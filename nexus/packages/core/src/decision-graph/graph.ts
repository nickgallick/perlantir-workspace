// ============================================================
// NEXUS v1 — Decision CRUD
// Spec §4 (decisions table) + §7 (graph operations)
// Uses raw pg.Pool per AMB-1 resolution
// ============================================================

import pg from 'pg';
import type {
  Decision,
  CreateDecisionInput,
} from '../types.js';

export type EmbeddingFn = (text: string) => Promise<number[]>;

/**
 * Create a decision with optional embedding and edges.
 * Edges are created in the same transaction.
 */
export async function createDecision(
  pool: pg.Pool,
  input: CreateDecisionInput,
  embedFn?: EmbeddingFn,
): Promise<Decision> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Generate embedding from title + description + reasoning
    let embedding: number[] | null = null;
    if (embedFn) {
      const text = `${input.title}\n${input.description}\n${input.reasoning}`;
      embedding = await embedFn(text);
    }

    const result = await client.query(
      `INSERT INTO decisions (
        project_id, title, description, reasoning, made_by,
        confidence, supersedes_id, alternatives_considered,
        affects, tags, metadata, embedding
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        input.project_id,
        input.title,
        input.description,
        input.reasoning,
        input.made_by,
        input.confidence ?? 'high',
        input.supersedes_id ?? null,
        JSON.stringify(input.alternatives_considered ?? []),
        input.affects ?? [],
        input.tags ?? [],
        JSON.stringify(input.metadata ?? {}),
        embedding ? `[${embedding.join(',')}]` : null,
      ],
    );

    const decision = parseDecisionRow(result.rows[0]);

    // Create edges if provided
    if (input.edges && input.edges.length > 0) {
      for (const edge of input.edges) {
        await client.query(
          `INSERT INTO decision_edges (source_id, target_id, relationship, description)
           VALUES ($1, $2, $3, $4)`,
          [decision.id, edge.target_id, edge.relationship, edge.description ?? null],
        );
      }
    }

    await client.query('COMMIT');
    return decision;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get a single decision by ID.
 */
export async function getDecision(
  pool: pg.Pool,
  id: string,
): Promise<Decision | null> {
  const result = await pool.query(
    'SELECT * FROM decisions WHERE id = $1',
    [id],
  );
  if (result.rows.length === 0) return null;
  return parseDecisionRow(result.rows[0]);
}

/**
 * List decisions for a project with optional filters.
 */
export async function listDecisions(
  pool: pg.Pool,
  projectId: string,
  options?: {
    status?: Decision['status'];
    made_by?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  },
): Promise<Decision[]> {
  const conditions = ['project_id = $1'];
  const params: unknown[] = [projectId];
  let idx = 2;

  if (options?.status) {
    conditions.push(`status = $${idx++}`);
    params.push(options.status);
  }
  if (options?.made_by) {
    conditions.push(`made_by = $${idx++}`);
    params.push(options.made_by);
  }
  if (options?.tags && options.tags.length > 0) {
    conditions.push(`tags && $${idx++}`);
    params.push(options.tags);
  }

  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  const result = await pool.query(
    `SELECT * FROM decisions
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset],
  );

  return result.rows.map((r: Record<string, unknown>) => parseDecisionRow(r));
}

/**
 * Update a decision's status and optional fields.
 */
export async function updateDecisionStatus(
  pool: pg.Pool,
  id: string,
  status: Decision['status'],
  supersedes_id?: string,
): Promise<Decision | null> {
  const setClauses = ['status = $2'];
  const params: unknown[] = [id, status];
  let idx = 3;

  if (supersedes_id !== undefined) {
    setClauses.push(`supersedes_id = $${idx++}`);
    params.push(supersedes_id);
  }

  if (status === 'active') {
    setClauses.push(`validated_at = NOW()`);
  }

  const result = await pool.query(
    `UPDATE decisions SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    params,
  );

  if (result.rows.length === 0) return null;
  return parseDecisionRow(result.rows[0]);
}

/**
 * Parse a raw database row into a typed Decision.
 * Handles JSONB → object conversion and embedding string → number[].
 */
function parseDecisionRow(row: Record<string, unknown>): Decision {
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
