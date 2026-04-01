// ============================================================
// NEXUS v1 — Change Propagator
// Spec §10: When decisions change, affected agents learn
// automatically with role-appropriate notifications.
// Adapted from spec: SupabaseClient → pg.Pool per AMB-1
// ============================================================

import pg from 'pg';
import type {
  Decision,
  Agent,
  ChangeEvent,
  RoleNotification,
  Notification,
} from '../types.js';

// ---- Role Context Map (from spec §10) ----
const ROLE_CONTEXT_MAP: Record<string, string> = {
  builder: 'Check if your implementation aligns with this change. Code changes may be needed.',
  reviewer: 'Review criteria may have changed. Update your checklist before the next review.',
  product: 'Scope or requirements may have shifted. Verify alignment with product goals.',
  docs: 'Documentation may need updating. Check all published content for accuracy.',
  launch: 'Public messaging may need updating. Check all content for accuracy.',
  ops: 'Infrastructure or config may be affected. Check deployment alignment.',
  blockchain: 'Smart contracts may need updating. Review on-chain components.',
  challenge: 'Challenge specs may need updating. Verify scoring and rubric alignment.',
  legal: 'Compliance implications may have changed. Review for legal exposure.',
};

export class ChangePropagator {
  private wsClients: Map<string, { readyState: number; send: (data: string) => void }>;

  constructor(
    private pool: pg.Pool,
    wsClients?: Map<string, { readyState: number; send: (data: string) => void }>,
  ) {
    this.wsClients = wsClients || new Map();
  }

  /**
   * Register a WebSocket client for real-time notifications.
   */
  registerClient(agentId: string, ws: { readyState: number; send: (data: string) => void }): void {
    this.wsClients.set(agentId, ws);
  }

  /**
   * Remove a WebSocket client.
   */
  removeClient(agentId: string): void {
    this.wsClients.delete(agentId);
  }

  /**
   * Handle a newly created decision.
   * Notifies all agents listed in decision.affects.
   */
  async onDecisionCreated(decision: Decision): Promise<RoleNotification[]> {
    return this.propagate({
      type: 'decision_created',
      decision_id: decision.id,
      changed_by: decision.made_by,
      changes: { title: { old: null, new: decision.title } },
      affected_agents: decision.affects,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle a decision being superseded by a new one.
   * Notifies agents affected by either the old or new decision.
   */
  async onDecisionSuperseded(
    newDecision: Decision,
    oldDecision: Decision,
  ): Promise<RoleNotification[]> {
    const affected = new Set([...newDecision.affects, ...oldDecision.affects]);
    return this.propagate({
      type: 'decision_superseded',
      decision_id: newDecision.id,
      changed_by: newDecision.made_by,
      changes: {
        title: { old: oldDecision.title, new: newDecision.title },
        description: { old: oldDecision.description, new: newDecision.description },
      },
      affected_agents: Array.from(affected),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle a decision being reverted.
   * Notifies all agents listed in decision.affects.
   */
  async onDecisionReverted(
    decision: Decision,
    revertedBy: string,
  ): Promise<RoleNotification[]> {
    return this.propagate({
      type: 'decision_reverted',
      decision_id: decision.id,
      changed_by: revertedBy,
      changes: { status: { old: 'active', new: 'reverted' } },
      affected_agents: decision.affects,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Core propagation logic:
   * 1. Find agents by name from affected_agents list
   * 2. Generate role-appropriate notification for each
   * 3. Persist to notifications table
   * 4. Send via WebSocket if connected
   * 5. Invalidate context cache
   */
  private async propagate(event: ChangeEvent): Promise<RoleNotification[]> {
    const notifications: RoleNotification[] = [];

    for (const agentName of event.affected_agents) {
      // Find agents with this name in the project
      const { rows: agentRows } = await this.pool.query(
        'SELECT * FROM agents WHERE name = $1',
        [agentName],
      );

      if (!agentRows || agentRows.length === 0) continue;

      for (const agentRow of agentRows) {
        const agent = parseAgentRow(agentRow as Record<string, unknown>);
        const notification = this.generateRoleNotification(agent, event);
        notifications.push(notification);

        // Persist notification to DB
        await this.pool.query(
          `INSERT INTO notifications (agent_id, decision_id, notification_type, message, role_context)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            agent.id,
            event.decision_id ?? null,
            event.type,
            notification.message,
            notification.role_context,
          ],
        );

        // Real-time via WebSocket
        const ws = this.wsClients.get(agent.id);
        if (ws && ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'notification', data: notification }));
        }
      }
    }

    return notifications;
  }

  /**
   * Generate a role-appropriate notification message.
   * Different roles get different context about why the change matters to them.
   */
  private generateRoleNotification(agent: Agent, event: ChangeEvent): RoleNotification {
    let message = '';

    switch (event.type) {
      case 'decision_created':
        message = `New decision by ${event.changed_by}: "${event.changes.title?.new}"`;
        break;
      case 'decision_superseded':
        message = `Decision updated: "${event.changes.title?.old}" → "${event.changes.title?.new}"`;
        break;
      case 'decision_reverted':
        message = `Decision reverted by ${event.changed_by}: "${event.changes.title?.old || event.changes.status?.old || 'unknown'}"`;
        break;
      default:
        message = `Decision changed by ${event.changed_by}`;
    }

    const roleContext =
      ROLE_CONTEXT_MAP[agent.role] ||
      'This decision may affect your current work. Review for impact.';

    const urgency: RoleNotification['urgency'] =
      event.type === 'decision_superseded' || event.type === 'decision_reverted'
        ? 'high'
        : 'medium';

    return {
      agent_id: agent.id,
      agent_name: agent.name,
      agent_role: agent.role,
      message,
      role_context: roleContext,
      urgency,
    };
  }
}

// ============================================================
// Row parser
// ============================================================
function parseAgentRow(row: Record<string, unknown>): Agent {
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
