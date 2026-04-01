// ============================================================
// NEXUS v1 — Context Compiler: Scoring Layer
// Implements spec §7 scoring algorithm exactly per ALGORITHM-REFERENCE.md
// Pure functions — no database dependency
// ============================================================

import type {
  Decision,
  Agent,
  RelevanceProfile,
  ScoredDecision,
} from '../types.js';
import { cosineSimilarity } from './relevance.js';

// ---- Signal Weights (from spec §7) ----
const WEIGHT_DIRECT_AFFECT = 0.4;
const WEIGHT_TAG_MATCHING = 0.2;
const WEIGHT_ROLE_RELEVANCE = 0.15;
const WEIGHT_SEMANTIC = 0.25;

// ---- Freshness Constants ----
const HALF_LIFE_VALIDATED_DAYS = 30;
const HALF_LIFE_UNVALIDATED_DAYS = 7;

// ---- Status Penalties ----
const PENALTY_SUPERSEDED_INCLUDED = 0.4;
const PENALTY_SUPERSEDED_EXCLUDED = 0.1;
const PENALTY_REVERTED = 0.05;

// ---- Combined Score Blend ----
const RELEVANCE_BLEND = 0.7;
const FRESHNESS_BLEND = 0.3;

// ---- Role Tag Map Threshold ----
// From worked examples: roleTagMap = tags with weight >= 0.8
const ROLE_TAG_MAP_THRESHOLD = 0.8;

// ---- Role Relevance per-match multiplier ----
const ROLE_RELEVANCE_PER_MATCH = 0.25;

export interface ScoreBreakdown {
  directAffect: number;
  tagMatching: number;
  roleRelevance: number;
  semanticSimilarity: number;
  statusPenalty: number;
  relevanceScore: number;
  freshnessScore: number;
  combinedScore: number;
  inclusionReason: string;
}

export interface ScoringContext {
  agent: Agent;
  taskEmbedding?: number[];
  now?: Date;
  debug?: boolean;
}

export interface ScoringResult {
  scored: ScoredDecision;
  breakdown: ScoreBreakdown;
}

// ============================================================
// Signal A: Direct Affect
// 0.4 if decision.affects includes agent.name or agent.role
// ============================================================
export function computeDirectAffect(
  decision: Decision,
  agent: Agent,
): number {
  const affects = decision.affects ?? [];
  const match = affects.some(
    (a) =>
      a.toLowerCase() === agent.name.toLowerCase() ||
      a.toLowerCase() === agent.role.toLowerCase(),
  );
  return match ? WEIGHT_DIRECT_AFFECT : 0;
}

// ============================================================
// Signal B: Tag Matching
// (sum of matching tag weights / count of matching tags) × 0.2
// Only tags present in agent's weight map count as matches
// ============================================================
export function computeTagMatching(
  decision: Decision,
  profile: RelevanceProfile,
): number {
  const tags = decision.tags ?? [];
  if (tags.length === 0) return 0;

  let matchCount = 0;
  let weightSum = 0;

  for (const tag of tags) {
    const weight = profile.weights[tag.toLowerCase()];
    if (weight !== undefined && weight > 0) {
      matchCount++;
      weightSum += weight;
    }
  }

  if (matchCount === 0) return 0;

  const average = weightSum / matchCount;
  return average * WEIGHT_TAG_MATCHING;
}

// ============================================================
// Signal C: Role Relevance
// roleTagMap = tags from agent's weight map with weight >= 0.8
// Count overlaps between decision.tags and roleTagMap
// min(1.0, matchCount × 0.25) × 0.15
// ============================================================
export function getRoleTagMap(profile: RelevanceProfile): string[] {
  return Object.entries(profile.weights)
    .filter(([, weight]) => weight >= ROLE_TAG_MAP_THRESHOLD)
    .map(([tag]) => tag);
}

export function computeRoleRelevance(
  decision: Decision,
  profile: RelevanceProfile,
): number {
  const roleTagMap = getRoleTagMap(profile);
  const decisionTags = (decision.tags ?? []).map((t) => t.toLowerCase());

  let matchCount = 0;
  for (const tag of decisionTags) {
    if (roleTagMap.includes(tag)) {
      matchCount++;
    }
  }

  return Math.min(1.0, matchCount * ROLE_RELEVANCE_PER_MATCH) * WEIGHT_ROLE_RELEVANCE;
}

// ============================================================
// Signal D: Semantic Similarity
// cosine_similarity(task_embedding, decision_embedding) × 0.25
// Falls back to 0 if either embedding is missing
// ============================================================
export function computeSemanticSimilarity(
  decision: Decision,
  taskEmbedding?: number[],
): number {
  if (!taskEmbedding || !decision.embedding) return 0;
  const sim = cosineSimilarity(taskEmbedding, decision.embedding);
  return sim * WEIGHT_SEMANTIC;
}

// ============================================================
// Status Penalty (Signal E)
// Applied after summing A+B+C+D
// ============================================================
export function computeStatusPenalty(
  decision: Decision,
  includeSuperseded: boolean,
): number {
  if (decision.status === 'superseded') {
    return includeSuperseded ? PENALTY_SUPERSEDED_INCLUDED : PENALTY_SUPERSEDED_EXCLUDED;
  }
  if (decision.status === 'reverted') {
    return PENALTY_REVERTED;
  }
  return 1.0; // No penalty for active/pending
}

// ============================================================
// Freshness Score
// exp(-age_hours / (half_life_days × 24))
// half_life = 30 days if validated, 7 days if not
// ============================================================
export function computeFreshness(
  decision: Decision,
  now?: Date,
): number {
  const currentTime = now ?? new Date();
  const createdAt = new Date(decision.created_at);
  const ageMs = currentTime.getTime() - createdAt.getTime();
  const ageHours = Math.max(0, ageMs / (1000 * 60 * 60));

  const halfLifeDays = decision.validated_at
    ? HALF_LIFE_VALIDATED_DAYS
    : HALF_LIFE_UNVALIDATED_DAYS;
  const halfLifeHours = halfLifeDays * 24;

  return Math.exp(-ageHours / halfLifeHours);
}

// ============================================================
// Score a single decision for an agent
// Returns full breakdown for debug/traceability
// ============================================================
export function scoreDecision(
  decision: Decision,
  ctx: ScoringContext,
): ScoringResult {
  const profile = ctx.agent.relevance_profile;

  // Compute individual signals
  const directAffect = computeDirectAffect(decision, ctx.agent);
  const tagMatching = computeTagMatching(decision, profile);
  const roleRelevance = computeRoleRelevance(decision, profile);
  const semanticSimilarity = computeSemanticSimilarity(decision, ctx.taskEmbedding);

  // Sum signals
  const rawRelevance = directAffect + tagMatching + roleRelevance + semanticSimilarity;

  // Apply status penalty
  const statusPenalty = computeStatusPenalty(decision, profile.include_superseded);
  const relevanceScore = rawRelevance * statusPenalty;

  // Freshness
  const freshnessScore = computeFreshness(decision, ctx.now);

  // Combined
  const combinedScore = Math.min(
    1.0,
    relevanceScore * RELEVANCE_BLEND + freshnessScore * FRESHNESS_BLEND,
  );

  // Determine inclusion reason
  const inclusionReason = determineInclusionReason(
    directAffect,
    combinedScore,
    decision.status,
  );

  const breakdown: ScoreBreakdown = {
    directAffect,
    tagMatching,
    roleRelevance,
    semanticSimilarity,
    statusPenalty,
    relevanceScore,
    freshnessScore,
    combinedScore,
    inclusionReason,
  };

  const scored: ScoredDecision = {
    decision,
    relevance_score: relevanceScore,
    freshness_score: freshnessScore,
    combined_score: combinedScore,
    graph_depth: 0, // Set during graph expansion
    inclusion_reason: inclusionReason,
    connected_decisions: [], // Populated during graph expansion
  };

  return { scored, breakdown };
}

// ============================================================
// Score multiple decisions and sort by combined_score descending
// ============================================================
export function scoreDecisions(
  decisions: Decision[],
  ctx: ScoringContext,
): { results: ScoringResult[]; debugLog?: string[] } {
  const results: ScoringResult[] = [];
  const debugLog: string[] = [];

  for (const decision of decisions) {
    const result = scoreDecision(decision, ctx);
    results.push(result);

    if (ctx.debug) {
      debugLog.push(formatDebugLine(decision, result.breakdown));
    }
  }

  // Sort by combined_score descending
  results.sort((a, b) => b.scored.combined_score - a.scored.combined_score);

  return { results, debugLog: ctx.debug ? debugLog : undefined };
}

// ============================================================
// Inclusion Reason
// ============================================================
function determineInclusionReason(
  directAffect: number,
  combinedScore: number,
  status: Decision['status'],
): string {
  if (directAffect > 0) return 'directly_affects_agent';
  if (combinedScore >= 0.5) return 'high_relevance';
  if (combinedScore >= 0.2) return 'moderate_relevance';
  if (status === 'superseded') return 'superseded_context';
  return 'low_relevance';
}

// ============================================================
// Debug Formatting
// ============================================================
function formatDebugLine(
  decision: Decision,
  breakdown: ScoreBreakdown,
): string {
  return [
    `[SCORE] "${decision.title}" (${decision.id})`,
    `  A(affect)=${breakdown.directAffect.toFixed(4)}`,
    `  B(tags)=${breakdown.tagMatching.toFixed(4)}`,
    `  C(role)=${breakdown.roleRelevance.toFixed(4)}`,
    `  D(semantic)=${breakdown.semanticSimilarity.toFixed(4)}`,
    `  penalty=${breakdown.statusPenalty.toFixed(2)}`,
    `  relevance=${breakdown.relevanceScore.toFixed(4)}`,
    `  freshness=${breakdown.freshnessScore.toFixed(4)}`,
    `  combined=${breakdown.combinedScore.toFixed(4)}`,
    `  reason="${breakdown.inclusionReason}"`,
  ].join(' | ');
}
