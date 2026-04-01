// ============================================================
// NEXUS v1 — Complete Type Definitions
// From Spec §5, with AMB-1 fix: databaseUrl replaces supabaseUrl/supabaseKey
// ============================================================

// ---------- CORE ENTITIES ----------

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface Agent {
  id: string;
  project_id: string;
  name: string;
  role: string;
  relevance_profile: RelevanceProfile;
  context_budget_tokens: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentInput {
  project_id: string;
  name: string;
  role: string;
  relevance_profile: RelevanceProfile;
  context_budget_tokens?: number;
}

export interface RelevanceProfile {
  weights: Record<string, number>;
  decision_depth: number;
  freshness_preference: 'recent_first' | 'validated_first' | 'balanced';
  include_superseded: boolean;
}

export interface Decision {
  id: string;
  project_id: string;
  title: string;
  description: string;
  reasoning: string;
  made_by: string;
  confidence: 'high' | 'medium' | 'low';
  status: 'active' | 'superseded' | 'reverted' | 'pending';
  supersedes_id?: string;
  alternatives_considered: Alternative[];
  affects: string[];
  tags: string[];
  validated_at?: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
}

export interface CreateDecisionInput {
  project_id: string;
  title: string;
  description: string;
  reasoning: string;
  made_by: string;
  confidence?: 'high' | 'medium' | 'low';
  supersedes_id?: string;
  alternatives_considered?: Alternative[];
  affects?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  edges?: CreateEdgeInput[];
}

export interface Alternative {
  option: string;
  rejected_reason: string;
}

export interface DecisionEdge {
  id: string;
  source_id: string;
  target_id: string;
  relationship: EdgeRelationship;
  description?: string;
  created_at: string;
}

export type EdgeRelationship =
  | 'supersedes' | 'requires' | 'informs' | 'blocks' | 'contradicts';

export interface CreateEdgeInput {
  target_id: string;
  relationship: EdgeRelationship;
  description?: string;
}

export interface Artifact {
  id: string;
  project_id: string;
  name: string;
  path?: string;
  artifact_type: ArtifactType;
  description?: string;
  content_summary?: string;
  content_hash?: string;
  produced_by: string;
  related_decision_ids: string[];
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
}

export type ArtifactType =
  | 'spec' | 'code' | 'design' | 'report'
  | 'config' | 'documentation' | 'other';

export interface CreateArtifactInput {
  project_id: string;
  name: string;
  path?: string;
  artifact_type: ArtifactType;
  description?: string;
  content_summary?: string;
  produced_by: string;
  related_decision_ids?: string[];
}

export interface SessionSummary {
  id: string;
  project_id: string;
  agent_name: string;
  session_date: string;
  topic: string;
  summary: string;
  decision_ids: string[];
  artifact_ids: string[];
  assumptions: string[];
  open_questions: string[];
  lessons_learned: string[];
  created_at: string;
  embedding?: number[];
}

export interface Subscription {
  id: string;
  agent_id: string;
  topic: string;
  notify_on: ('update' | 'supersede' | 'revert')[];
}

export interface Notification {
  id: string;
  agent_id: string;
  decision_id?: string;
  notification_type: string;
  message: string;
  role_context?: string;
  read_at?: string;
  created_at: string;
}

// ---------- CONTEXT COMPILER TYPES ----------

export interface CompileRequest {
  agent_id: string;
  task_description: string;
  max_tokens?: number;
  include_notifications?: boolean;
  include_sessions?: boolean;
  session_lookback_days?: number;
}

export interface ContextPackage {
  agent: { name: string; role: string };
  task: string;
  compiled_at: string;
  token_count: number;
  budget_used_pct: number;
  decisions: ScoredDecision[];
  artifacts: ScoredArtifact[];
  notifications: Notification[];
  recent_sessions: SessionSummary[];
  formatted_markdown: string;
  formatted_json: string;
  decisions_considered: number;
  decisions_included: number;
  relevance_threshold_used: number;
  compilation_time_ms: number;
}

export interface ScoredDecision {
  decision: Decision;
  relevance_score: number;
  freshness_score: number;
  combined_score: number;
  graph_depth: number;
  inclusion_reason: string;
  connected_decisions: string[];
}

export interface ScoredArtifact {
  artifact: Artifact;
  relevance_score: number;
  inclusion_reason: string;
}

export interface ConnectedDecision {
  decision_id: string;
  depth: number;
  path: string[];
  via_relationship: string;
}

export interface ChangeEvent {
  type: string;
  decision_id?: string;
  artifact_id?: string;
  changed_by: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  affected_agents: string[];
  timestamp: string;
}

export interface RoleNotification {
  agent_id: string;
  agent_name: string;
  agent_role: string;
  message: string;
  role_context: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface PackInput {
  decisions: ScoredDecision[];
  artifacts: ScoredArtifact[];
  notifications: Notification[];
  sessions: SessionSummary[];
  maxTokens: number;
}

export interface PackResult {
  decisions: ScoredDecision[];
  artifacts: ScoredArtifact[];
  notifications: Notification[];
  sessions: SessionSummary[];
  totalTokens: number;
  relevanceThreshold: number;
}

// ---------- CONFIG (AMB-1: pg driver, not Supabase) ----------

export interface NexusConfig {
  databaseUrl: string;
  openaiApiKey: string;
  anthropicApiKey?: string;
  embeddingModel?: string;
  defaultContextBudget?: number;
  cacheExpireMinutes?: number;
}
