// ============================================================
// NEXUS v1 — Context Output Formatters
// Spec §9: Format packed context as markdown and JSON
// Fixes BUG-4 (truncated template literals) from KNOWN-SPEC-ISSUES
// ============================================================

import type {
  ScoredDecision,
  ScoredArtifact,
  Notification,
  SessionSummary,
  PackResult,
} from '../types.js';

// ============================================================
// Markdown Formatter
// Produces human-readable context document
// ============================================================
export function formatAsMarkdown(pack: PackResult, agentName: string, agentRole: string, task: string): string {
  const lines: string[] = [];

  lines.push(`# Context Package for ${agentName} (${agentRole})`);
  lines.push('');
  lines.push(`**Task:** ${task}`);
  lines.push(`**Compiled:** ${new Date().toISOString()}`);
  lines.push(`**Token budget used:** ${pack.totalTokens}`);
  lines.push('');

  // Notifications section
  if (pack.notifications.length > 0) {
    lines.push('## Notifications');
    lines.push('');
    for (const n of pack.notifications) {
      lines.push(`- **[${n.notification_type}]** ${n.message}`);
      if (n.role_context) {
        lines.push(`  _Context: ${n.role_context}_`);
      }
    }
    lines.push('');
  }

  // Decisions section
  if (pack.decisions.length > 0) {
    lines.push('## Relevant Decisions');
    lines.push('');
    for (const sd of pack.decisions) {
      const d = sd.decision;
      lines.push(`### ${d.title}`);
      lines.push(`   Status: ${d.status} | Score: ${sd.combined_score.toFixed(3)} | Reason: ${sd.inclusion_reason}`);
      lines.push(`   By: ${d.made_by} | Confidence: ${d.confidence} | ${d.created_at.split('T')[0]}`);
      lines.push('');
      lines.push(`   ${d.description}`);
      lines.push('');
      if (d.reasoning) {
        lines.push(`   **Reasoning:** ${d.reasoning}`);
        lines.push('');
      }
      if (d.tags.length > 0) {
        lines.push(`   Tags: ${d.tags.join(', ')}`);
        lines.push('');
      }
      if (sd.connected_decisions.length > 0) {
        lines.push(`   Connected: ${sd.connected_decisions.join(', ')}`);
        lines.push('');
      }
    }
  }

  // Artifacts section
  if (pack.artifacts.length > 0) {
    lines.push('## Related Artifacts');
    lines.push('');
    for (const sa of pack.artifacts) {
      const a = sa.artifact;
      lines.push(`### ${a.name}`);
      lines.push(`   Type: ${a.artifact_type} | Score: ${sa.relevance_score.toFixed(3)}`);
      lines.push(`   By: ${a.produced_by} | Updated: ${a.updated_at?.split('T')[0] || 'unknown'}`);
      lines.push('');
      if (a.content_summary) {
        lines.push(`   ${a.content_summary}`);
        lines.push('');
      }
      if (a.path) {
        lines.push(`   Path: \`${a.path}\``);
        lines.push('');
      }
    }
  }

  // Sessions section
  if (pack.sessions.length > 0) {
    lines.push('## Recent Sessions');
    lines.push('');
    for (const s of pack.sessions) {
      lines.push(`### ${s.topic}`);
      lines.push(`   Agent: ${s.agent_name} | Date: ${s.session_date}`);
      lines.push('');
      lines.push(`   ${s.summary}`);
      lines.push('');
      if (s.open_questions.length > 0) {
        lines.push(`   Open questions: ${s.open_questions.join('; ')}`);
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

// ============================================================
// JSON Formatter
// Produces machine-readable context for agent consumption
// ============================================================
export function formatAsJson(pack: PackResult, agentName: string, agentRole: string, task: string): string {
  const output = {
    agent: { name: agentName, role: agentRole },
    task,
    compiled_at: new Date().toISOString(),
    token_count: pack.totalTokens,
    relevance_threshold: pack.relevanceThreshold,
    notifications: pack.notifications.map((n) => ({
      type: n.notification_type,
      message: n.message,
      role_context: n.role_context || null,
      created_at: n.created_at,
    })),
    decisions: pack.decisions.map((sd) => ({
      id: sd.decision.id,
      title: sd.decision.title,
      status: sd.decision.status,
      description: sd.decision.description,
      reasoning: sd.decision.reasoning,
      made_by: sd.decision.made_by,
      confidence: sd.decision.confidence,
      tags: sd.decision.tags,
      affects: sd.decision.affects,
      score: {
        relevance: sd.relevance_score,
        freshness: sd.freshness_score,
        combined: sd.combined_score,
      },
      graph_depth: sd.graph_depth,
      inclusion_reason: sd.inclusion_reason,
      connected_decisions: sd.connected_decisions,
    })),
    artifacts: pack.artifacts.map((sa) => ({
      id: sa.artifact.id,
      name: sa.artifact.name,
      type: sa.artifact.artifact_type,
      path: sa.artifact.path || null,
      description: sa.artifact.description || null,
      content_summary: sa.artifact.content_summary || null,
      score: sa.relevance_score,
      inclusion_reason: sa.inclusion_reason,
    })),
    sessions: pack.sessions.map((s) => ({
      id: s.id,
      topic: s.topic,
      agent: s.agent_name,
      date: s.session_date,
      summary: s.summary,
      open_questions: s.open_questions,
    })),
  };

  return JSON.stringify(output, null, 2);
}
