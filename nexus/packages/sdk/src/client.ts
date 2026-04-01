// ============================================================
// NEXUS v1 — TypeScript SDK Client
// Spec §15: Full client with CRUD + convenience helpers
// Day 7: Complete server surface coverage, typed errors,
//         edge/artifact/health methods
// ============================================================

import type {
  Project,
  CreateProjectInput,
  Agent,
  CreateAgentInput,
  Decision,
  CreateDecisionInput,
  DecisionEdge,
  CreateEdgeInput,
  Artifact,
  CreateArtifactInput,
  Notification,
  CompileRequest,
  ContextPackage,
  RelevanceProfile,
  ConnectedDecision,
} from '@nexus-ai/core';
import { getRoleTemplate } from '@nexus-ai/core';

// ---- Error Types ----

/** Server error envelope shape: { error: { code, message, details? } } */
export interface NexusErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Typed error preserving the server's error envelope.
 * Consumers can inspect `.code`, `.serverMessage`, `.details`, and `.status`.
 */
export class NexusApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly serverMessage: string;
  public readonly details?: unknown;

  constructor(status: number, envelope: NexusErrorEnvelope) {
    const msg = `Nexus API error (${status}/${envelope.error.code}): ${envelope.error.message}`;
    super(msg);
    this.name = 'NexusApiError';
    this.status = status;
    this.code = envelope.error.code;
    this.serverMessage = envelope.error.message;
    this.details = envelope.error.details;
  }
}

// ---- Health Types ----

export interface HealthResponse {
  status: 'ok' | 'degraded';
  version: string;
  dependencies: { database: string };
  timestamp: string;
}

// ---- Client ----

export interface NexusClientConfig {
  url: string;
  apiKey?: string;
}

export class NexusClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: NexusClientConfig) {
    this.baseUrl = config.url.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let envelope: NexusErrorEnvelope;
      try {
        const json = await res.json();
        if (json && typeof json === 'object' && 'error' in json) {
          envelope = json as NexusErrorEnvelope;
        } else {
          envelope = { error: { code: 'UNKNOWN', message: JSON.stringify(json) } };
        }
      } catch {
        envelope = { error: { code: 'UNKNOWN', message: await res.text().catch(() => 'Unknown error') } };
      }
      throw new NexusApiError(res.status, envelope);
    }

    return res.json() as Promise<T>;
  }

  // ---- Core CRUD ----

  async createProject(input: CreateProjectInput): Promise<Project> {
    return this.request('POST', '/api/projects', input);
  }

  async getProject(id: string): Promise<Project> {
    return this.request('GET', `/api/projects/${id}`);
  }

  async registerAgent(input: CreateAgentInput): Promise<Agent> {
    return this.request('POST', `/api/projects/${input.project_id}/agents`, input);
  }

  async listAgents(projectId: string): Promise<Agent[]> {
    return this.request('GET', `/api/projects/${projectId}/agents`);
  }

  async recordDecision(input: CreateDecisionInput): Promise<Decision> {
    return this.request('POST', `/api/projects/${input.project_id}/decisions`, input);
  }

  async getDecision(id: string): Promise<Decision> {
    return this.request('GET', `/api/decisions/${id}`);
  }

  async listDecisions(projectId: string, filters?: { status?: string }): Promise<Decision[]> {
    const params = filters?.status ? `?status=${filters.status}` : '';
    return this.request('GET', `/api/projects/${projectId}/decisions${params}`);
  }

  async supersedeDecision(input: CreateDecisionInput): Promise<Decision> {
    return this.request('POST', `/api/projects/${input.project_id}/decisions`, input);
  }

  async updateDecisionStatus(
    id: string,
    status: 'active' | 'superseded' | 'reverted' | 'pending',
    opts?: { supersedes_id?: string; reverted_by?: string },
  ): Promise<Decision> {
    return this.request('PATCH', `/api/decisions/${id}`, { status, ...opts });
  }

  // ---- Edges ----

  async createEdge(sourceDecisionId: string, input: Omit<CreateEdgeInput, 'source_id'>): Promise<DecisionEdge> {
    return this.request('POST', `/api/decisions/${sourceDecisionId}/edges`, input);
  }

  async listEdges(decisionId: string): Promise<DecisionEdge[]> {
    return this.request('GET', `/api/decisions/${decisionId}/edges`);
  }

  async deleteEdge(edgeId: string): Promise<{ ok: boolean }> {
    return this.request('DELETE', `/api/edges/${edgeId}`);
  }

  // ---- Artifacts ----

  async registerArtifact(input: CreateArtifactInput): Promise<Artifact> {
    return this.request('POST', `/api/projects/${input.project_id}/artifacts`, input);
  }

  async listArtifacts(projectId: string): Promise<Artifact[]> {
    return this.request('GET', `/api/projects/${projectId}/artifacts`);
  }

  // ---- Notifications ----

  async getNotifications(agentId: string, unreadOnly?: boolean): Promise<Notification[]> {
    return this.request('GET', `/api/agents/${agentId}/notifications${unreadOnly ? '?unread=true' : ''}`);
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.request('PATCH', `/api/notifications/${id}/read`, {});
  }

  async compileContext(request: CompileRequest): Promise<ContextPackage> {
    return this.request('POST', '/api/compile', request);
  }

  async getDecisionGraph(id: string, depth?: number): Promise<ConnectedDecision[]> {
    return this.request('GET', `/api/decisions/${id}/graph${depth ? '?depth=' + depth : ''}`);
  }

  // ---- Health ----

  async health(): Promise<HealthResponse> {
    return this.request('GET', '/api/health');
  }

  // ---- Convenience Helpers ----

  /**
   * Register an agent using a built-in role template.
   * Optionally override specific weights or set a custom budget.
   */
  async createRoleAgent(
    projectId: string,
    name: string,
    role: string,
    weightOverrides?: Partial<Record<string, number>>,
    contextBudget?: number,
  ): Promise<Agent> {
    const profile = getRoleTemplate(role, weightOverrides);
    return this.registerAgent({
      project_id: projectId,
      name,
      role,
      relevance_profile: profile,
      context_budget_tokens: contextBudget || 50000,
    });
  }

  /**
   * Compile context by agent name instead of ID.
   */
  async compileForAgent(
    agentName: string,
    taskDescription: string,
    projectId: string,
    maxTokens?: number,
  ): Promise<ContextPackage> {
    const agents = await this.listAgents(projectId);
    const agent = agents.find((a) => a.name === agentName);
    if (!agent) throw new Error(`Agent "${agentName}" not found`);
    return this.compileContext({
      agent_id: agent.id,
      task_description: taskDescription,
      max_tokens: maxTokens,
    });
  }

  /**
   * Record a decision with edges in one call.
   */
  async recordDecisionWithEdges(
    input: CreateDecisionInput & { edges?: Array<{ target_id: string; relationship: string; description?: string }> },
  ): Promise<Decision> {
    return this.request('POST', `/api/projects/${input.project_id}/decisions`, input);
  }

  /**
   * Seed a demo project with realistic software team decisions.
   * Returns the project, agents, and decisions for demo use.
   */
  async seedSoftwareTeamDemo(): Promise<{
    project: Project;
    agents: Record<string, Agent>;
    decisions: Decision[];
  }> {
    const project = await this.createProject({
      name: 'Demo: Software Team',
      description: 'Multi-agent team building a product with auth, API, and deployment decisions',
    });

    const agents: Record<string, Agent> = {};
    for (const role of ['builder', 'reviewer', 'product', 'docs', 'launch', 'ops']) {
      agents[role] = await this.createRoleAgent(project.id, role, role);
    }

    const decisions: Decision[] = [];
    const seeds: Array<Omit<CreateDecisionInput, 'project_id'>> = [
      {
        title: 'Use stateless JWT for API authentication',
        description: 'API routes use JWT tokens. No server-side sessions.',
        reasoning: 'Scalability and statelessness for distributed deployment',
        made_by: 'architect',
        affects: ['builder', 'reviewer', 'ops'],
        tags: ['security', 'api', 'architecture'],
      },
      {
        title: 'Rotate refresh tokens on every renewal',
        description: 'Each refresh token use invalidates the old one',
        reasoning: 'Prevents token replay attacks',
        made_by: 'architect',
        affects: ['builder', 'reviewer'],
        tags: ['security', 'implementation'],
      },
      {
        title: 'Split auth API from web auth flow',
        description: 'Separate endpoints for API token auth vs browser cookie auth',
        reasoning: 'Different security models for different clients',
        made_by: 'architect',
        affects: ['builder', 'docs'],
        tags: ['api', 'architecture'],
      },
      {
        title: 'Use edge-compatible middleware only',
        description: 'All middleware must work in edge runtime environments',
        reasoning: 'Deploy to Cloudflare Workers and Vercel Edge',
        made_by: 'architect',
        affects: ['builder', 'ops'],
        tags: ['infrastructure', 'architecture', 'deployment'],
      },
      {
        title: 'Move audit logging to async queue',
        description: 'Auth events logged asynchronously to avoid request latency',
        reasoning: 'Performance optimization for auth flows',
        made_by: 'architect',
        affects: ['builder', 'ops'],
        tags: ['performance', 'infrastructure'],
      },
      {
        title: 'Deprecate legacy /login route by May 1',
        description: 'Old /login returns 301 redirect, removed after grace period',
        reasoning: 'Clean up tech debt, consolidate auth endpoints',
        made_by: 'product',
        affects: ['builder', 'launch', 'docs'],
        tags: ['deprecation', 'api', 'breaking_change'],
      },
      {
        title: 'Delay SSO until post-launch',
        description: 'No SAML/OIDC in v1. Email/password and API key only.',
        reasoning: 'Scope management — SSO adds 3 weeks',
        made_by: 'product',
        affects: ['builder', 'launch', 'docs'],
        tags: ['scope', 'requirements'],
      },
      {
        title: 'Require rate limiting on all auth endpoints',
        description: '10 attempts/min per IP on login, 5/min on token refresh',
        reasoning: 'Prevent brute force attacks',
        made_by: 'architect',
        affects: ['builder', 'reviewer', 'ops'],
        tags: ['security', 'api', 'infrastructure'],
      },
      {
        title: 'Store password hashes with Argon2id',
        description: 'Argon2id with OWASP-recommended parameters',
        reasoning: 'Current best practice for password hashing',
        made_by: 'architect',
        affects: ['builder', 'reviewer'],
        tags: ['security', 'implementation'],
      },
      {
        title: 'Use feature flags for auth method rollout',
        description: 'Each auth method controlled by feature flag for gradual rollout',
        reasoning: 'Risk mitigation for auth changes',
        made_by: 'product',
        affects: ['builder', 'launch', 'ops'],
        tags: ['deployment', 'infrastructure', 'scope'],
      },
    ];

    for (const seed of seeds) {
      const d = await this.recordDecision({
        project_id: project.id,
        ...seed,
        confidence: 'high',
      });
      decisions.push(d);
    }

    // Create edges (from spec §17 pattern)
    // JWT requires token rotation
    await this.request('POST', `/api/decisions/${decisions[0].id}/edges`, {
      target_id: decisions[1].id,
      relationship: 'requires',
    });
    // Split auth informs JWT
    await this.request('POST', `/api/decisions/${decisions[2].id}/edges`, {
      target_id: decisions[0].id,
      relationship: 'informs',
    });
    // Rate limiting requires Argon2
    await this.request('POST', `/api/decisions/${decisions[7].id}/edges`, {
      target_id: decisions[8].id,
      relationship: 'requires',
    });
    // Feature flags inform deprecation
    await this.request('POST', `/api/decisions/${decisions[9].id}/edges`, {
      target_id: decisions[5].id,
      relationship: 'informs',
    });

    return { project, agents, decisions };
  }
}
