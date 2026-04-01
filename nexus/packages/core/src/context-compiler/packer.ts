// ============================================================
// NEXUS v1 — Token Budget Packer
// Spec §8: Pack scored items into token budget with priority cascade
// Priority: Notifications (10%) → Decisions (55%) → Artifacts (30%) → Sessions (remainder)
// ============================================================

import type {
  ScoredDecision,
  ScoredArtifact,
  Notification,
  SessionSummary,
  PackInput,
  PackResult,
} from '../types.js';

// ---- Budget Allocation Percentages ----
const BUDGET_NOTIFICATIONS = 0.10;
const BUDGET_DECISIONS = 0.55;
const BUDGET_ARTIFACTS = 0.30;
// Sessions get whatever remains

// ---- Token Estimation ----
// Spec §8: Math.ceil(text.length / 4)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ---- Per-item token estimation ----

function decisionTokens(sd: ScoredDecision): number {
  const d = sd.decision;
  return estimateTokens(
    [
      d.title,
      d.description,
      d.reasoning,
      d.made_by,
      d.confidence,
      d.status,
      (d.alternatives_considered ?? []).map((a) => `${a.option}: ${a.rejected_reason}`).join(' '),
      (d.affects ?? []).join(' '),
      (d.tags ?? []).join(' '),
    ].join(' '),
  );
}

function artifactTokens(sa: ScoredArtifact): number {
  const a = sa.artifact;
  return estimateTokens(
    [a.name, a.description || '', a.content_summary || '', a.path || ''].join(' '),
  );
}

function notificationTokens(n: Notification): number {
  return estimateTokens(
    [n.notification_type, n.message, n.role_context || ''].join(' '),
  );
}

function sessionTokens(s: SessionSummary): number {
  return estimateTokens(
    [s.topic, s.summary, s.assumptions.join(' '), s.open_questions.join(' ')].join(' '),
  );
}

// ============================================================
// Pack items into budget with priority cascade
// Items within each category packed in score order (highest first)
// Unused budget flows to next priority level
// ============================================================
export function packIntoBudget(input: PackInput): PackResult {
  const { decisions, artifacts, notifications, sessions, maxTokens } = input;

  // Calculate budget allocations
  const notificationBudget = Math.floor(maxTokens * BUDGET_NOTIFICATIONS);
  const basDecisionBudget = Math.floor(maxTokens * BUDGET_DECISIONS);
  const baseArtifactBudget = Math.floor(maxTokens * BUDGET_ARTIFACTS);

  // Pack notifications first (priority 1)
  const packedNotifications: Notification[] = [];
  let notificationUsed = 0;
  for (const n of notifications) {
    const tokens = notificationTokens(n);
    if (notificationUsed + tokens <= notificationBudget) {
      packedNotifications.push(n);
      notificationUsed += tokens;
    }
  }
  const notificationOverflow = notificationBudget - notificationUsed;

  // Pack decisions (priority 2) — already sorted by combined_score desc
  const decisionBudget = basDecisionBudget + notificationOverflow;
  const packedDecisions: ScoredDecision[] = [];
  let decisionUsed = 0;
  let relevanceThreshold = 0;
  for (const sd of decisions) {
    const tokens = decisionTokens(sd);
    if (decisionUsed + tokens <= decisionBudget) {
      packedDecisions.push(sd);
      decisionUsed += tokens;
      relevanceThreshold = sd.combined_score;
    }
  }
  const decisionOverflow = decisionBudget - decisionUsed;

  // Pack artifacts (priority 3)
  const artifactBudget = baseArtifactBudget + decisionOverflow;
  const packedArtifacts: ScoredArtifact[] = [];
  let artifactUsed = 0;
  for (const sa of artifacts) {
    const tokens = artifactTokens(sa);
    if (artifactUsed + tokens <= artifactBudget) {
      packedArtifacts.push(sa);
      artifactUsed += tokens;
    }
  }
  const artifactOverflow = artifactBudget - artifactUsed;

  // Pack sessions (priority 4) — whatever remains
  const sessionBudget = (maxTokens - notificationUsed - decisionUsed - artifactUsed);
  const packedSessions: SessionSummary[] = [];
  let sessionUsed = 0;
  for (const s of sessions) {
    const tokens = sessionTokens(s);
    if (sessionUsed + tokens <= sessionBudget) {
      packedSessions.push(s);
      sessionUsed += tokens;
    }
  }

  const totalTokens = notificationUsed + decisionUsed + artifactUsed + sessionUsed;

  return {
    decisions: packedDecisions,
    artifacts: packedArtifacts,
    notifications: packedNotifications,
    sessions: packedSessions,
    totalTokens,
    relevanceThreshold,
  };
}
