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
export { createPool, healthCheck, migrate, migrationStatus } from './db/index.js';
export type { Pool, MigrateResult } from './db/index.js';

// Embeddings & similarity
export {
  createOpenAIEmbedder,
  cosineSimilarity,
} from './context-compiler/index.js';
export type { EmbeddingFn } from './context-compiler/index.js';

// Context Compiler — Scoring
export {
  scoreDecision,
  scoreDecisions,
  computeDirectAffect,
  computeTagMatching,
  computeRoleRelevance,
  computeSemanticSimilarity,
  computeStatusPenalty,
  computeFreshness,
  getRoleTagMap,
} from './context-compiler/index.js';
export type { ScoreBreakdown, ScoringContext, ScoringResult } from './context-compiler/index.js';

// Context Compiler — Assembly
export { compile, expandGraphContext } from './context-compiler/index.js';
export type { CompileOptions, CompileDebugTrace } from './context-compiler/index.js';

// Context Compiler — Packing & Formatting
export { packIntoBudget, estimateTokens } from './context-compiler/index.js';
export { formatAsMarkdown, formatAsJson } from './context-compiler/index.js';

// Change Propagator
export { ChangePropagator } from './change-propagator/index.js';
export {
  createSubscription,
  listSubscriptions,
  findMatchingSubscriptions,
  deleteSubscription,
  deleteAgentSubscriptions,
} from './change-propagator/index.js';
export type { CreateSubscriptionInput } from './change-propagator/index.js';

// Decision Graph — CRUD + traversal
export {
  createDecision,
  getDecision,
  listDecisions,
  updateDecisionStatus,
  createEdge,
  listEdgesBySource,
  listEdgesByTarget,
  listEdgesByDecision,
  deleteEdge,
  listEdgesByRelationship,
  getConnectedDecisions,
  getProjectGraph,
} from './decision-graph/index.js';
export type { CreateEdgeParams } from './decision-graph/index.js';
