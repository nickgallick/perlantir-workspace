export { createOpenAIEmbedder, cosineSimilarity } from './relevance.js';
export type { EmbeddingFn } from './relevance.js';

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
} from './scoring.js';
export type { ScoreBreakdown, ScoringContext, ScoringResult } from './scoring.js';
