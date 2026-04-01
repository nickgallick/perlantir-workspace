// ============================================================
// @nexus-ai/sdk — Public API
// ============================================================

export { NexusClient, NexusApiError } from './client.js';
export type { NexusClientConfig, NexusErrorEnvelope, HealthResponse } from './client.js';

// Re-export core types for SDK consumers
export type {
  Project,
  CreateProjectInput,
  Agent,
  CreateAgentInput,
  RelevanceProfile,
  Decision,
  CreateDecisionInput,
  Alternative,
  DecisionEdge,
  EdgeRelationship,
  CreateEdgeInput,
  Artifact,
  ArtifactType,
  CreateArtifactInput,
  SessionSummary,
  Subscription,
  Notification,
  CompileRequest,
  ContextPackage,
  ScoredDecision,
  ScoredArtifact,
  ConnectedDecision,
  ChangeEvent,
  RoleNotification,
  PackInput,
  PackResult,
  NexusConfig,
} from '@nexus-ai/core';

// Re-export role template utilities
export { getRoleTemplate, listRoleTemplates, inspectRoleTemplate } from '@nexus-ai/core';
