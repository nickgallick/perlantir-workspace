// ============================================================
// NEXUS v1 — Context Compiler: Full Pipeline
// Spec §7 (compile + expandGraphContext), §8 (packing), §9 (formatting)
// Orchestrates: fetch → score → expand → pack → format
// ============================================================

import pg from 'pg';
import type {
  Agent,
  Decision,
  CompileRequest,
  ContextPackage,
  ScoredDecision,
  ScoredArtifact,
  Notification,
  SessionSummary,
  ConnectedDecision,
} from '../types.js';
import { scoreDecisions } from './scoring.js';
import type { ScoringResult } from './scoring.js';
import { packIntoBudget } from './packer.js';
import { formatAsMarkdown, formatAsJson } from './formatter.js';
import { getConnectedDecisions } from '../decision-graph/traversal.js';

// ---- Constants ----
const DEFAULT_CONTEXT_BUDGET = 8000;
const GRAPH_SCORE_DECAY = 0.6;
const GRAPH_INCLUSION_THRESHOLD = 0.25; // Decisions scoring >= 0.25 get graph-expanded

export interface CompileOptions {
  debug?: boolean;
  now?: Date;
  embeddingFn?: (text: string) => Promise<number[]>;
}

export interface CompileDebugTrace {
  scoringLog: string[];
  graphExpansionLog: string[];
  packingLog: string[];
  totalDecisionsConsidered: number;
  totalDecisionsAfterExpansion: number;
  totalDecisionsIncluded: number;
}

// ============================================================
// compile() — Full pipeline
// 1. Fetch agent
// 2. Fetch decisions for project
// 3. Optionally generate task embedding
// 4. Score all decisions
// 5. Expand graph neighbors
// 6. Fetch artifacts scored by decision relevance
// 7. Fetch notifications
// 8. Optionally fetch sessions
// 9. Pack into budget
// 10. Format outputs
// ============================================================
export async function compile(
  pool: pg.Pool,
  request: CompileRequest,
  options?: CompileOptions,
): Promise<ContextPackage> {
  const startTime = Date.now();
  const debug = options?.debug ?? false;
  const now = options?.now ?? new Date();
  const debugTrace: CompileDebugTrace = {
    scoringLog: [],
    graphExpansionLog: [],
    packingLog: [],
    totalDecisionsConsidered: 0,
    totalDecisionsAfterExpansion: 0,
    totalDecisionsIncluded: 0,
  };

  // 1. Fetch agent
  const agent = await fetchAgent(pool, request.agent_id);
  if (!agent) {
    throw new Error(`Agent not found: ${request.agent_id}`);
  }

  // 2. Fetch all active + relevant decisions for project
  const decisions = await fetchProjectDecisions(pool, agent.project_id, agent.relevance_profile.include_superseded);
  debugTrace.totalDecisionsConsidered = decisions.length;

  // 3. Generate task embedding if embedder available
  let taskEmbedding: number[] | undefined;
  if (options?.embeddingFn && request.task_description) {
    taskEmbedding = await options.embeddingFn(request.task_description);
  }

  // 4. Score all decisions
  const { results: scoringResults, debugLog } = scoreDecisions(decisions, {
    agent,
    taskEmbedding,
    now,
    debug,
  });

  if (debug && debugLog) {
    debugTrace.scoringLog = debugLog;
  }

  // 5. Expand graph context for high-scoring decisions
  const expandedResults = await expandGraphContext(
    pool,
    scoringResults,
    agent,
    taskEmbedding,
    now,
    debug ? debugTrace : undefined,
  );
  debugTrace.totalDecisionsAfterExpansion = expandedResults.length;

  // 6. Fetch and score artifacts
  const scoredArtifacts = await fetchAndScoreArtifacts(
    pool,
    agent.project_id,
    expandedResults,
  );

  // 7. Fetch notifications
  const notifications = request.include_notifications !== false
    ? await fetchNotifications(pool, agent.id)
    : [];

  // 8. Fetch sessions (opt-in)
  const sessions = request.include_sessions
    ? await fetchSessions(pool, agent.project_id, agent.name, request.session_lookback_days ?? 7)
    : [];

  // 9. Pack into budget
  const maxTokens = request.max_tokens ?? agent.context_budget_tokens ?? DEFAULT_CONTEXT_BUDGET;

  // Sort artifacts by relevance_score desc before packing
  scoredArtifacts.sort((a, b) => b.relevance_score - a.relevance_score);

  const packed = packIntoBudget({
    decisions: expandedResults.map((r) => r.scored),
    artifacts: scoredArtifacts,
    notifications,
    sessions,
    maxTokens,
  });

  debugTrace.totalDecisionsIncluded = packed.decisions.length;

  if (debug) {
    debugTrace.packingLog.push(
      `Budget: ${maxTokens} tokens`,
      `Packed: ${packed.decisions.length} decisions, ${packed.artifacts.length} artifacts, ${packed.notifications.length} notifications, ${packed.sessions.length} sessions`,
      `Used: ${packed.totalTokens} tokens (${((packed.totalTokens / maxTokens) * 100).toFixed(1)}%)`,
      `Relevance threshold: ${packed.relevanceThreshold.toFixed(4)}`,
    );
  }

  // 10. Format
  const formattedMarkdown = formatAsMarkdown(packed, agent.name, agent.role, request.task_description);
  const formattedJson = formatAsJson(packed, agent.name, agent.role, request.task_description);

  const compilationTimeMs = Date.now() - startTime;

  return {
    agent: { name: agent.name, role: agent.role },
    task: request.task_description,
    compiled_at: now.toISOString(),
    token_count: packed.totalTokens,
    budget_used_pct: maxTokens > 0 ? (packed.totalTokens / maxTokens) * 100 : 0,
    decisions: packed.decisions,
    artifacts: packed.artifacts,
    notifications: packed.notifications,
    recent_sessions: packed.sessions,
    formatted_markdown: formattedMarkdown,
    formatted_json: formattedJson,
    decisions_considered: debugTrace.totalDecisionsConsidered,
    decisions_included: debugTrace.totalDecisionsIncluded,
    relevance_threshold_used: packed.relevanceThreshold,
    compilation_time_ms: compilationTimeMs,
  };
}

// ============================================================
// expandGraphContext — Spec §7
// For decisions with combined_score >= 0.25, fetch graph neighbors
// Apply score decay: neighbor_score = parent_score × 0.6^depth
// Skip if neighbor already exists with higher score
// ============================================================
export async function expandGraphContext(
  pool: pg.Pool,
  scoringResults: ScoringResult[],
  agent: Agent,
  taskEmbedding: number[] | undefined,
  now: Date,
  debugTrace?: CompileDebugTrace,
): Promise<ScoringResult[]> {
  // Build map of existing scored decisions (by decision ID)
  const scoreMap = new Map<string, ScoringResult>();
  for (const result of scoringResults) {
    scoreMap.set(result.scored.decision.id, result);
  }

  // Expand decisions above threshold
  const toExpand = scoringResults.filter(
    (r) => r.scored.combined_score >= GRAPH_INCLUSION_THRESHOLD,
  );

  for (const result of toExpand) {
    const parentScore = result.scored.combined_score;
    const maxDepth = agent.relevance_profile.decision_depth;

    let connections: ConnectedDecision[];
    try {
      connections = await getConnectedDecisions(
        pool,
        result.scored.decision.id,
        maxDepth,
      );
    } catch {
      // Graph function may not exist in test environments
      connections = [];
    }

    for (const conn of connections) {
      const neighborScore = parentScore * Math.pow(GRAPH_SCORE_DECAY, conn.depth);
      const existingResult = scoreMap.get(conn.decision_id);

      // Skip if already scored higher
      if (existingResult && existingResult.scored.combined_score >= neighborScore) {
        continue;
      }

      // Fetch the neighbor decision
      const neighborDecision = await fetchDecisionById(pool, conn.decision_id);
      if (!neighborDecision) continue;

      const inclusionReason = `graph_neighbor_depth_${conn.depth}_via_${conn.via_relationship}`;

      const scored: ScoredDecision = {
        decision: neighborDecision,
        relevance_score: neighborScore,
        freshness_score: 0, // Graph neighbors don't get independent freshness
        combined_score: neighborScore,
        graph_depth: conn.depth,
        inclusion_reason: inclusionReason,
        connected_decisions: [result.scored.decision.id],
      };

      const neighborResult: ScoringResult = {
        scored,
        breakdown: {
          directAffect: 0,
          tagMatching: 0,
          roleRelevance: 0,
          semanticSimilarity: 0,
          statusPenalty: 1.0,
          relevanceScore: neighborScore,
          freshnessScore: 0,
          combinedScore: neighborScore,
          inclusionReason,
        },
      };

      scoreMap.set(conn.decision_id, neighborResult);

      if (debugTrace) {
        debugTrace.graphExpansionLog.push(
          `[GRAPH] "${neighborDecision.title}" via ${conn.via_relationship} from "${result.scored.decision.title}" depth=${conn.depth} score=${neighborScore.toFixed(4)}`,
        );
      }
    }
  }

  // Return all results sorted by combined_score desc
  const allResults = Array.from(scoreMap.values());
  allResults.sort((a, b) => b.scored.combined_score - a.scored.combined_score);
  return allResults;
}

// ============================================================
// Database fetch helpers
// All use raw pg.Pool per AMB-1
// ============================================================

async function fetchAgent(pool: pg.Pool, agentId: string): Promise<Agent | null> {
  const result = await pool.query(
    'SELECT * FROM agents WHERE id = $1',
    [agentId],
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    ...row,
    relevance_profile: typeof row.relevance_profile === 'string'
      ? JSON.parse(row.relevance_profile)
      : row.relevance_profile,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  } as Agent;
}

async function fetchProjectDecisions(
  pool: pg.Pool,
  projectId: string,
  includeSuperseded: boolean,
): Promise<Decision[]> {
  const statuses = includeSuperseded
    ? ['active', 'pending', 'superseded']
    : ['active', 'pending'];

  const result = await pool.query(
    `SELECT * FROM decisions
     WHERE project_id = $1 AND status = ANY($2)
     ORDER BY created_at DESC`,
    [projectId, statuses],
  );

  return result.rows.map((row: Record<string, unknown>) => parseDecisionRow(row));
}

async function fetchDecisionById(pool: pg.Pool, id: string): Promise<Decision | null> {
  const result = await pool.query(
    'SELECT * FROM decisions WHERE id = $1',
    [id],
  );
  if (result.rows.length === 0) return null;
  return parseDecisionRow(result.rows[0]);
}

async function fetchAndScoreArtifacts(
  pool: pg.Pool,
  projectId: string,
  scoringResults: ScoringResult[],
): Promise<ScoredArtifact[]> {
  // Fetch all artifacts for the project
  const result = await pool.query(
    'SELECT * FROM artifacts WHERE project_id = $1',
    [projectId],
  );

  if (result.rows.length === 0) return [];

  // Build decision score map for artifact relevance
  const decisionScoreMap = new Map<string, number>();
  for (const r of scoringResults) {
    decisionScoreMap.set(r.scored.decision.id, r.scored.combined_score);
  }

  // Score artifacts by their related decisions' scores
  const scored: ScoredArtifact[] = [];
  for (const row of result.rows) {
    const artifact = parseArtifactRow(row);
    const relatedIds = artifact.related_decision_ids ?? [];

    // Artifact relevance = max score of related decisions
    let maxScore = 0;
    let reason = 'project_artifact';
    for (const decId of relatedIds) {
      const decScore = decisionScoreMap.get(decId);
      if (decScore && decScore > maxScore) {
        maxScore = decScore;
        reason = `related_to_decision`;
      }
    }

    scored.push({
      artifact,
      relevance_score: maxScore,
      inclusion_reason: reason,
    });
  }

  return scored;
}

async function fetchNotifications(
  pool: pg.Pool,
  agentId: string,
): Promise<Notification[]> {
  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE agent_id = $1 AND read_at IS NULL
     ORDER BY created_at DESC
     LIMIT 50`,
    [agentId],
  );

  return result.rows.map((row: Record<string, unknown>) => ({
    ...row,
    created_at: String(row.created_at),
    read_at: row.read_at ? String(row.read_at) : undefined,
  })) as Notification[];
}

async function fetchSessions(
  pool: pg.Pool,
  projectId: string,
  agentName: string,
  lookbackDays: number,
): Promise<SessionSummary[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  const result = await pool.query(
    `SELECT * FROM session_summaries
     WHERE project_id = $1 AND agent_name = $2 AND session_date >= $3
     ORDER BY session_date DESC
     LIMIT 20`,
    [projectId, agentName, cutoff.toISOString()],
  );

  return result.rows.map((row: Record<string, unknown>) => ({
    ...row,
    created_at: String(row.created_at),
    session_date: String(row.session_date),
  })) as SessionSummary[];
}

// ============================================================
// Row parsers (shared patterns with graph.ts)
// ============================================================

function parseDecisionRow(row: Record<string, unknown>): Decision {
  return {
    ...row,
    alternatives_considered:
      typeof row.alternatives_considered === 'string'
        ? JSON.parse(row.alternatives_considered as string)
        : (row.alternatives_considered as Decision['alternatives_considered']),
    metadata:
      typeof row.metadata === 'string'
        ? JSON.parse(row.metadata as string)
        : (row.metadata as Record<string, unknown>),
    embedding: row.embedding
      ? typeof row.embedding === 'string'
        ? JSON.parse(row.embedding as string)
        : (row.embedding as number[])
      : undefined,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    validated_at: row.validated_at ? String(row.validated_at) : undefined,
    supersedes_id: row.supersedes_id ? String(row.supersedes_id) : undefined,
  } as Decision;
}

function parseArtifactRow(row: Record<string, unknown>): ScoredArtifact['artifact'] {
  return {
    ...row,
    metadata:
      typeof row.metadata === 'string'
        ? JSON.parse(row.metadata as string)
        : (row.metadata as Record<string, unknown>),
    related_decision_ids: row.related_decision_ids as string[] ?? [],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    embedding: row.embedding
      ? typeof row.embedding === 'string'
        ? JSON.parse(row.embedding as string)
        : (row.embedding as number[])
      : undefined,
  } as ScoredArtifact['artifact'];
}
