// ============================================================
// NEXUS v1 — Hono API Server
// Spec §14: All routes for projects, agents, decisions, edges,
// artifacts, compile, notifications, health
// Adapted: SupabaseClient → pg.Pool per AMB-1
// ============================================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import pg from 'pg';
import {
  createPool,
  healthCheck,
  createDecision,
  getDecision,
  listDecisions,
  updateDecisionStatus,
  createEdge,
  listEdgesByDecision,
  deleteEdge,
  compile,
  ChangePropagator,
} from '@nexus-ai/core';
import type {
  CreateDecisionInput,
  CreateEdgeInput,
  CompileRequest,
} from '@nexus-ai/core';
import { registerErrorHandler, notFoundHandler, AppError } from './middleware/errors.js';
import { authMiddleware } from './middleware/auth.js';
import { requireFields, requireUUID } from './middleware/validate.js';

export interface ServerConfig {
  pool?: pg.Pool;
  databaseUrl?: string;
}

export function createApp(config?: ServerConfig): { app: Hono; pool: pg.Pool } {
  const pool = config?.pool ?? createPool(config?.databaseUrl);
  const propagator = new ChangePropagator(pool);

  const app = new Hono();

  // Global middleware
  app.use('*', cors());
  app.use('/api/*', authMiddleware);

  // Error handler (Hono's onError pattern)
  registerErrorHandler(app);

  // ============================================================
  // Health
  // ============================================================
  app.get('/api/health', async (c) => {
    const dbHealthy = await healthCheck(pool);
    const status = dbHealthy ? 'ok' : 'degraded';
    const statusCode = dbHealthy ? 200 : 503;

    return c.json(
      {
        status,
        version: '1.0.0',
        dependencies: {
          database: dbHealthy ? 'connected' : 'disconnected',
        },
        timestamp: new Date().toISOString(),
      },
      statusCode as 200,
    );
  });

  // ============================================================
  // Projects
  // ============================================================
  app.post('/api/projects', async (c) => {
    const body = await c.req.json();
    requireFields(body, ['name']);

    const result = await pool.query(
      `INSERT INTO projects (name, description, metadata)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [body.name, body.description ?? null, JSON.stringify(body.metadata ?? {})],
    );

    return c.json(parseRow(result.rows[0]), 201);
  });

  app.get('/api/projects/:id', async (c) => {
    const id = c.req.param('id');
    requireUUID(id, 'id');

    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', `Project not found: ${id}`);
    }
    return c.json(parseRow(result.rows[0]));
  });

  // ============================================================
  // Agents
  // ============================================================
  app.post('/api/projects/:id/agents', async (c) => {
    const projectId = c.req.param('id');
    requireUUID(projectId, 'project_id');

    const body = await c.req.json();
    requireFields(body, ['name', 'role', 'relevance_profile']);

    const result = await pool.query(
      `INSERT INTO agents (project_id, name, role, relevance_profile, context_budget_tokens)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        projectId,
        body.name,
        body.role,
        JSON.stringify(body.relevance_profile),
        body.context_budget_tokens ?? 50000,
      ],
    );

    return c.json(parseAgentRow(result.rows[0]), 201);
  });

  app.get('/api/projects/:id/agents', async (c) => {
    const projectId = c.req.param('id');
    requireUUID(projectId, 'project_id');

    const result = await pool.query(
      'SELECT * FROM agents WHERE project_id = $1 ORDER BY created_at ASC',
      [projectId],
    );
    return c.json(result.rows.map((r: Record<string, unknown>) => parseAgentRow(r)));
  });

  // ============================================================
  // Decisions
  // ============================================================
  app.post('/api/projects/:id/decisions', async (c) => {
    const projectId = c.req.param('id');
    requireUUID(projectId, 'project_id');

    const body = await c.req.json();
    requireFields(body, ['title', 'description', 'reasoning', 'made_by']);

    // If superseding, update old decision status
    if (body.supersedes_id) {
      await updateDecisionStatus(pool, body.supersedes_id, 'superseded', undefined);
    }

    const decision = await createDecision(pool, {
      project_id: projectId,
      title: body.title,
      description: body.description,
      reasoning: body.reasoning,
      made_by: body.made_by,
      confidence: body.confidence,
      supersedes_id: body.supersedes_id,
      alternatives_considered: body.alternatives_considered,
      affects: body.affects,
      tags: body.tags,
      metadata: body.metadata,
      edges: body.edges,
    });

    // Propagate notifications
    if (body.supersedes_id) {
      const oldDecision = await getDecision(pool, body.supersedes_id);
      if (oldDecision) {
        await propagator.onDecisionSuperseded(decision, oldDecision);
      }
    } else {
      await propagator.onDecisionCreated(decision);
    }

    return c.json(decision, 201);
  });

  app.get('/api/projects/:id/decisions', async (c) => {
    const projectId = c.req.param('id');
    requireUUID(projectId, 'project_id');

    const status = c.req.query('status') as 'active' | 'superseded' | 'reverted' | 'pending' | undefined;
    const decisions = await listDecisions(pool, projectId, { status });
    return c.json(decisions);
  });

  app.get('/api/decisions/:id', async (c) => {
    const id = c.req.param('id');
    requireUUID(id, 'id');

    const decision = await getDecision(pool, id);
    if (!decision) {
      throw new AppError(404, 'NOT_FOUND', `Decision not found: ${id}`);
    }
    return c.json(decision);
  });

  app.patch('/api/decisions/:id', async (c) => {
    const id = c.req.param('id');
    requireUUID(id, 'id');

    const body = await c.req.json();
    if (!body.status) {
      throw new AppError(400, 'VALIDATION_ERROR', 'status field required for PATCH');
    }

    const updated = await updateDecisionStatus(pool, id, body.status, body.supersedes_id);
    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', `Decision not found: ${id}`);
    }

    if (body.status === 'reverted') {
      await propagator.onDecisionReverted(updated, body.reverted_by ?? 'unknown');
    }

    return c.json(updated);
  });

  // ============================================================
  // Edges
  // ============================================================
  app.post('/api/decisions/:id/edges', async (c) => {
    const sourceId = c.req.param('id');
    requireUUID(sourceId, 'source_id');

    const body = await c.req.json();
    requireFields(body, ['target_id', 'relationship']);
    requireUUID(body.target_id, 'target_id');

    const edge = await createEdge(pool, {
      source_id: sourceId,
      target_id: body.target_id,
      relationship: body.relationship,
      description: body.description,
    });

    return c.json(edge, 201);
  });

  app.get('/api/decisions/:id/edges', async (c) => {
    const decisionId = c.req.param('id');
    requireUUID(decisionId, 'decision_id');

    const edges = await listEdgesByDecision(pool, decisionId);
    return c.json(edges);
  });

  app.delete('/api/edges/:id', async (c) => {
    const id = c.req.param('id');
    requireUUID(id, 'id');

    const deleted = await deleteEdge(pool, id);
    if (!deleted) {
      throw new AppError(404, 'NOT_FOUND', `Edge not found: ${id}`);
    }
    return c.json({ ok: true });
  });

  // ============================================================
  // Graph traversal
  // ============================================================
  app.get('/api/decisions/:id/graph', async (c) => {
    const id = c.req.param('id');
    requireUUID(id, 'id');

    const depth = parseInt(c.req.query('depth') || '3');
    const { getConnectedDecisions } = await import('@nexus-ai/core');
    const connected = await getConnectedDecisions(pool, id, depth);
    return c.json(connected);
  });

  // ============================================================
  // Artifacts
  // ============================================================
  app.post('/api/projects/:id/artifacts', async (c) => {
    const projectId = c.req.param('id');
    requireUUID(projectId, 'project_id');

    const body = await c.req.json();
    requireFields(body, ['name', 'artifact_type', 'produced_by']);

    const result = await pool.query(
      `INSERT INTO artifacts (project_id, name, path, artifact_type, description, content_summary, produced_by, related_decision_ids, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        projectId,
        body.name,
        body.path ?? null,
        body.artifact_type,
        body.description ?? null,
        body.content_summary ?? null,
        body.produced_by,
        body.related_decision_ids ?? [],
        JSON.stringify(body.metadata ?? {}),
      ],
    );

    return c.json(parseRow(result.rows[0]), 201);
  });

  app.get('/api/projects/:id/artifacts', async (c) => {
    const projectId = c.req.param('id');
    requireUUID(projectId, 'project_id');

    const result = await pool.query(
      'SELECT * FROM artifacts WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId],
    );
    return c.json(result.rows.map((r: Record<string, unknown>) => parseRow(r)));
  });

  // ============================================================
  // Compile — THE KEY ENDPOINT
  // ============================================================
  app.post('/api/compile', async (c) => {
    const body = await c.req.json();
    requireFields(body, ['agent_id', 'task_description']);
    requireUUID(body.agent_id, 'agent_id');

    const request: CompileRequest = {
      agent_id: body.agent_id,
      task_description: body.task_description,
      max_tokens: body.max_tokens,
      include_notifications: body.include_notifications,
      include_sessions: body.include_sessions,
      session_lookback_days: body.session_lookback_days,
    };

    const result = await compile(pool, request, {
      debug: body.debug === true,
    });

    return c.json(result);
  });

  // ============================================================
  // Notifications
  // ============================================================
  app.get('/api/agents/:id/notifications', async (c) => {
    const agentId = c.req.param('id');
    requireUUID(agentId, 'agent_id');

    const unread = c.req.query('unread') === 'true';
    const conditions = ['agent_id = $1'];
    if (unread) conditions.push('read_at IS NULL');

    const result = await pool.query(
      `SELECT * FROM notifications WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 50`,
      [agentId],
    );
    return c.json(result.rows.map((r: Record<string, unknown>) => parseRow(r)));
  });

  app.patch('/api/notifications/:id/read', async (c) => {
    const id = c.req.param('id');
    requireUUID(id, 'id');

    const result = await pool.query(
      `UPDATE notifications SET read_at = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );
    if (result.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', `Notification not found: ${id}`);
    }
    return c.json({ ok: true });
  });

  // 404 handler
  app.notFound(notFoundHandler);

  return { app, pool };
}

// ============================================================
// Row parsers
// ============================================================
function parseRow(row: Record<string, unknown>): Record<string, unknown> {
  const parsed = { ...row };
  if (parsed.metadata && typeof parsed.metadata === 'string') {
    parsed.metadata = JSON.parse(parsed.metadata as string);
  }
  if (parsed.created_at) parsed.created_at = String(parsed.created_at);
  if (parsed.updated_at) parsed.updated_at = String(parsed.updated_at);
  return parsed;
}

function parseAgentRow(row: Record<string, unknown>): Record<string, unknown> {
  const parsed = parseRow(row);
  if (parsed.relevance_profile && typeof parsed.relevance_profile === 'string') {
    parsed.relevance_profile = JSON.parse(parsed.relevance_profile as string);
  }
  return parsed;
}
