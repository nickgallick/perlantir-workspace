// ============================================================
// @nexus-ai/core — Public API
// ============================================================

// Types
export type {
  Project, CreateProjectInput,
  Agent, CreateAgentInput, RelevanceProfile,
  Decision, CreateDecisionInput, Alternative,
  DecisionEdge, EdgeRelationship, CreateEdgeInput,
  Artifact, ArtifactType, CreateArtifactInput,
  SessionSummary, Subscription, Notification,
  CompileRequest, ContextPackage,
  ScoredDecision, ScoredArtifact, ConnectedDecision,
  ChangeEvent, RoleNotification,
  PackInput, PackResult,
  NexusConfig,
} from './types.js';

// Role templates
export {
  getRoleTemplate,
  listRoleTemplates,
  inspectRoleTemplate,
} from './roles.js';

// Database
export { createPool, healthCheck } from './db/index.js';
export type { Pool } from './db/index.js';

// Embeddings & similarity
export {
  createOpenAIEmbedder,
  cosineSimilarity,
} from './context-compiler/index.js';
export type { EmbeddingFn } from './context-compiler/index.js';
