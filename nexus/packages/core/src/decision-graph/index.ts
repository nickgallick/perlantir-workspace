// ============================================================
// Decision Graph — Barrel Exports
// ============================================================

export {
  createDecision,
  getDecision,
  listDecisions,
  updateDecisionStatus,
} from './graph.js';
export type { EmbeddingFn } from './graph.js';

export {
  createEdge,
  listEdgesBySource,
  listEdgesByTarget,
  listEdgesByDecision,
  deleteEdge,
  listEdgesByRelationship,
} from './queries.js';
export type { CreateEdgeParams } from './queries.js';

export {
  getConnectedDecisions,
  getProjectGraph,
} from './traversal.js';
