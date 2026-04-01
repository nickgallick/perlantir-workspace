// ============================================================
// NEXUS v1 — Context Compiler: Scoring Tests
// Validates exact score calculations from ALGORITHM-REFERENCE.md
// Tests role-differentiated ranking on same data
// Tests missing-signal fallbacks
// ============================================================

import { describe, it, expect } from 'vitest';
import type { Decision, Agent } from '../src/types.js';
import {
  computeDirectAffect,
  computeTagMatching,
  computeRoleRelevance,
  computeSemanticSimilarity,
  computeStatusPenalty,
  computeFreshness,
  scoreDecision,
  scoreDecisions,
  getRoleTagMap,
} from '../src/context-compiler/scoring.js';
import { getRoleTemplate } from '../src/roles.js';

// ---- Test Fixtures ----

function makeDecision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: 'dec-001',
    project_id: 'proj-001',
    title: 'Require rate limiting on all auth endpoints',
    description: 'All auth endpoints must have rate limiting',
    reasoning: 'Prevents brute force attacks',
    made_by: 'architect',
    confidence: 'high',
    status: 'active',
    alternatives_considered: [],
    affects: ['builder', 'ops'],
    tags: ['security', 'api', 'infrastructure'],
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: new Date().toISOString(),
    metadata: {},
    ...overrides,
  };
}

function makeAgent(
  name: string,
  role: string,
  profileOverrides?: Partial<Agent>,
): Agent {
  const profile = getRoleTemplate(role);
  return {
    id: `agent-${name}`,
    project_id: 'proj-001',
    name,
    role,
    relevance_profile: profile,
    context_budget_tokens: 50000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...profileOverrides,
  };
}

const NOW = new Date('2026-04-02T02:00:00Z');

// ============================================================
// Signal A: Direct Affect
// ============================================================
describe('computeDirectAffect', () => {
  it('should return 0.4 when affects includes agent name', () => {
    const decision = makeDecision({ affects: ['builder', 'ops'] });
    const agent = makeAgent('builder', 'builder');
    expect(computeDirectAffect(decision, agent)).toBe(0.4);
  });

  it('should return 0.4 when affects includes agent role', () => {
    const decision = makeDecision({ affects: ['builder', 'ops'] });
    const agent = makeAgent('ops-team', 'ops');
    expect(computeDirectAffect(decision, agent)).toBe(0.4);
  });

  it('should return 0 when affects does not include agent', () => {
    const decision = makeDecision({ affects: ['builder', 'ops'] });
    const agent = makeAgent('launch-team', 'launch');
    expect(computeDirectAffect(decision, agent)).toBe(0);
  });

  it('should return 0 when affects is empty', () => {
    const decision = makeDecision({ affects: [] });
    const agent = makeAgent('builder', 'builder');
    expect(computeDirectAffect(decision, agent)).toBe(0);
  });

  it('should be case-insensitive', () => {
    const decision = makeDecision({ affects: ['Builder'] });
    const agent = makeAgent('builder', 'builder');
    expect(computeDirectAffect(decision, agent)).toBe(0.4);
  });
});

// ============================================================
// Signal B: Tag Matching
// ============================================================
describe('computeTagMatching', () => {
  it('should match worked example 1: builder + security/api/infrastructure', () => {
    const decision = makeDecision({ tags: ['security', 'api', 'infrastructure'] });
    const profile = getRoleTemplate('builder');
    // security=0.6, api=0.9, infrastructure=0.7 → avg=2.2/3=0.733 → ×0.2=0.1467
    const result = computeTagMatching(decision, profile);
    expect(result).toBeCloseTo(0.1467, 3);
  });

  it('should match worked example 2: launch + security/api/infrastructure', () => {
    const decision = makeDecision({ tags: ['security', 'api', 'infrastructure'] });
    const profile = getRoleTemplate('launch');
    // security=0.1 → 1 match, avg=0.1 → ×0.2=0.02
    // api and infrastructure are not in launch weights (or 0)
    const result = computeTagMatching(decision, profile);
    expect(result).toBeCloseTo(0.02, 4);
  });

  it('should return 0 for no matching tags', () => {
    const decision = makeDecision({ tags: ['marketing', 'content'] });
    const profile = getRoleTemplate('builder');
    // marketing=0.0, content=0.0 → no matches with weight > 0
    const result = computeTagMatching(decision, profile);
    expect(result).toBe(0);
  });

  it('should return 0 for empty tags', () => {
    const decision = makeDecision({ tags: [] });
    const profile = getRoleTemplate('builder');
    expect(computeTagMatching(decision, profile)).toBe(0);
  });

  it('should handle single matching tag', () => {
    const decision = makeDecision({ tags: ['architecture'] });
    const profile = getRoleTemplate('builder');
    // architecture=1.0 → avg=1.0 → ×0.2=0.2
    expect(computeTagMatching(decision, profile)).toBeCloseTo(0.2, 4);
  });
});

// ============================================================
// Signal C: Role Relevance
// ============================================================
describe('computeRoleRelevance', () => {
  it('should extract correct roleTagMap for builder', () => {
    const profile = getRoleTemplate('builder');
    const tagMap = getRoleTagMap(profile);
    // weight >= 0.8: architecture(1.0), implementation(1.0), api(0.9), database(0.9), framework(0.8), code(0.8)
    expect(tagMap).toEqual(
      expect.arrayContaining(['architecture', 'implementation', 'api', 'database', 'framework', 'code']),
    );
    expect(tagMap).toHaveLength(6);
  });

  it('should extract correct roleTagMap for launch', () => {
    const profile = getRoleTemplate('launch');
    const tagMap = getRoleTagMap(profile);
    // weight >= 0.8: positioning(1.0), audience(1.0), messaging(1.0), content(0.9), brand(0.9), marketing(1.0), launch(0.8)
    expect(tagMap).toEqual(
      expect.arrayContaining(['positioning', 'audience', 'messaging', 'content', 'brand', 'marketing', 'launch']),
    );
    expect(tagMap).toHaveLength(7);
  });

  it('should match worked example 1: builder with security/api/infrastructure', () => {
    const decision = makeDecision({ tags: ['security', 'api', 'infrastructure'] });
    const profile = getRoleTemplate('builder');
    // roleTagMap: [architecture, implementation, api, database, framework, code]
    // decision tags: [security, api, infrastructure] → 'api' matches → 1 match
    // min(1.0, 1×0.25) × 0.15 = 0.25 × 0.15 = 0.0375
    expect(computeRoleRelevance(decision, profile)).toBeCloseTo(0.0375, 4);
  });

  it('should match worked example 2: launch with security/api/infrastructure', () => {
    const decision = makeDecision({ tags: ['security', 'api', 'infrastructure'] });
    const profile = getRoleTemplate('launch');
    // roleTagMap: [positioning, audience, messaging, content, brand, marketing, launch]
    // decision tags: [security, api, infrastructure] → 0 matches
    expect(computeRoleRelevance(decision, profile)).toBe(0);
  });

  it('should cap at 1.0 for many matches', () => {
    const decision = makeDecision({
      tags: ['architecture', 'implementation', 'api', 'database', 'framework'],
    });
    const profile = getRoleTemplate('builder');
    // 5 matches → min(1.0, 5×0.25) = min(1.0, 1.25) = 1.0 → ×0.15 = 0.15
    expect(computeRoleRelevance(decision, profile)).toBeCloseTo(0.15, 4);
  });
});

// ============================================================
// Signal D: Semantic Similarity
// ============================================================
describe('computeSemanticSimilarity', () => {
  it('should return weighted cosine similarity', () => {
    // Construct vectors with known cosine similarity
    const a = [1, 0, 0];
    const b = [1, 0, 0]; // cos = 1.0
    const decision = makeDecision({ embedding: b });
    expect(computeSemanticSimilarity(decision, a)).toBeCloseTo(0.25, 4);
  });

  it('should return 0 when task embedding is missing', () => {
    const decision = makeDecision({ embedding: [1, 0, 0] });
    expect(computeSemanticSimilarity(decision, undefined)).toBe(0);
  });

  it('should return 0 when decision embedding is missing', () => {
    const decision = makeDecision({ embedding: undefined });
    expect(computeSemanticSimilarity(decision, [1, 0, 0])).toBe(0);
  });

  it('should return 0 for orthogonal vectors', () => {
    const decision = makeDecision({ embedding: [1, 0, 0] });
    expect(computeSemanticSimilarity(decision, [0, 1, 0])).toBeCloseTo(0, 4);
  });

  it('should scale correctly for known similarity', () => {
    // cos(a,b) for [1,1,0] and [1,0,1] = 1/2 = 0.5
    const decision = makeDecision({ embedding: [1, 0, 1] });
    expect(computeSemanticSimilarity(decision, [1, 1, 0])).toBeCloseTo(0.5 * 0.25, 4);
  });
});

// ============================================================
// Status Penalty (Signal E)
// ============================================================
describe('computeStatusPenalty', () => {
  it('should return 1.0 for active decisions', () => {
    const decision = makeDecision({ status: 'active' });
    expect(computeStatusPenalty(decision, true)).toBe(1.0);
  });

  it('should return 1.0 for pending decisions', () => {
    const decision = makeDecision({ status: 'pending' });
    expect(computeStatusPenalty(decision, true)).toBe(1.0);
  });

  it('should return 0.4 for superseded with include_superseded=true', () => {
    const decision = makeDecision({ status: 'superseded' });
    expect(computeStatusPenalty(decision, true)).toBe(0.4);
  });

  it('should return 0.1 for superseded with include_superseded=false', () => {
    const decision = makeDecision({ status: 'superseded' });
    expect(computeStatusPenalty(decision, false)).toBe(0.1);
  });

  it('should return 0.05 for reverted', () => {
    const decision = makeDecision({ status: 'reverted' });
    expect(computeStatusPenalty(decision, true)).toBe(0.05);
  });
});

// ============================================================
// Freshness Score
// ============================================================
describe('computeFreshness', () => {
  it('should match worked example: 48h, unvalidated', () => {
    const createdAt = new Date(NOW.getTime() - 48 * 60 * 60 * 1000);
    const decision = makeDecision({
      created_at: createdAt.toISOString(),
      validated_at: undefined,
    });
    // exp(-48 / (7*24)) = exp(-48/168) = exp(-0.2857) ≈ 0.751
    const freshness = computeFreshness(decision, NOW);
    expect(freshness).toBeCloseTo(0.751, 3);
  });

  it('should use 30-day half-life for validated decisions', () => {
    const createdAt = new Date(NOW.getTime() - 48 * 60 * 60 * 1000);
    const decision = makeDecision({
      created_at: createdAt.toISOString(),
      validated_at: new Date().toISOString(),
    });
    // exp(-48 / (30*24)) = exp(-48/720) = exp(-0.0667) ≈ 0.935
    const freshness = computeFreshness(decision, NOW);
    expect(freshness).toBeCloseTo(0.9355, 3);
  });

  it('should return ~1.0 for very recent decisions', () => {
    const decision = makeDecision({
      created_at: NOW.toISOString(),
    });
    expect(computeFreshness(decision, NOW)).toBeCloseTo(1.0, 3);
  });

  it('should decay for old decisions', () => {
    const createdAt = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
    const decision = makeDecision({
      created_at: createdAt.toISOString(),
      validated_at: undefined,
    });
    // exp(-720 / 168) = exp(-4.286) ≈ 0.0138
    const freshness = computeFreshness(decision, NOW);
    expect(freshness).toBeCloseTo(0.0138, 3);
  });
});

// ============================================================
// Full Score: Worked Example 1 — Builder
// ============================================================
describe('scoreDecision — Worked Example 1 (Builder)', () => {
  it('should produce exact scores from ALGORITHM-REFERENCE', () => {
    const createdAt = new Date(NOW.getTime() - 48 * 60 * 60 * 1000);
    const decision = makeDecision({
      created_at: createdAt.toISOString(),
      validated_at: undefined,
      // Use known embedding vectors for predictable cosine similarity
      embedding: [0.72, 0, 0], // simplified
    });

    const agent = makeAgent('builder', 'builder');

    // Task embedding chosen so cos(task, decision) = 0.72
    // With [0.72,0,0] and [1,0,0], cos = 1.0 — not what we want
    // Instead, use the exact values from the spec and override semantic
    // We test individual signals exactly, then the combination formula

    const result = scoreDecision(decision, {
      agent,
      taskEmbedding: undefined, // Test without embedding first
      now: NOW,
    });

    // Without embedding:
    // A = 0.4 (affects includes 'builder')
    // B = (0.6+0.9+0.7)/3 × 0.2 = 0.733×0.2 = 0.1467
    // C = min(1, 1×0.25) × 0.15 = 0.0375
    // D = 0 (no embedding)
    // penalty = 1.0 (active)
    // relevance = 0.5842
    // freshness = 0.751
    // combined = min(1.0, 0.5842×0.7 + 0.751×0.3) = min(1.0, 0.4089 + 0.2253) = 0.6342

    expect(result.breakdown.directAffect).toBe(0.4);
    expect(result.breakdown.tagMatching).toBeCloseTo(0.1467, 3);
    expect(result.breakdown.roleRelevance).toBeCloseTo(0.0375, 4);
    expect(result.breakdown.semanticSimilarity).toBe(0);
    expect(result.breakdown.statusPenalty).toBe(1.0);
    expect(result.breakdown.relevanceScore).toBeCloseTo(0.5842, 3);
    expect(result.breakdown.freshnessScore).toBeCloseTo(0.751, 3);
    expect(result.breakdown.combinedScore).toBeCloseTo(0.6342, 3);
    expect(result.breakdown.inclusionReason).toBe('directly_affects_agent');
  });

  it('should produce spec-exact combined with semantic similarity', () => {
    const createdAt = new Date(NOW.getTime() - 48 * 60 * 60 * 1000);

    // Create vectors with cosine similarity = 0.72
    // cos(a,b) = dot(a,b) / (|a|×|b|)
    // a = [0.72, 0.694, 0], |a| = 1.0
    // b = [1, 0, 0], |b| = 1.0
    // cos = 0.72
    const decisionEmbed = [1, 0, 0];
    const taskEmbed = [0.72, Math.sqrt(1 - 0.72 * 0.72), 0]; // |task| = 1.0, cos = 0.72

    const decision = makeDecision({
      created_at: createdAt.toISOString(),
      validated_at: undefined,
      embedding: decisionEmbed,
    });

    const agent = makeAgent('builder', 'builder');

    const result = scoreDecision(decision, {
      agent,
      taskEmbedding: taskEmbed,
      now: NOW,
    });

    // A=0.4, B=0.1467, C=0.0375, D=0.72×0.25=0.18
    // relevance = 0.7642
    // freshness = 0.751
    // combined = min(1.0, 0.7642×0.7 + 0.751×0.3) = min(1.0, 0.535 + 0.225) = 0.760
    expect(result.breakdown.directAffect).toBe(0.4);
    expect(result.breakdown.semanticSimilarity).toBeCloseTo(0.18, 3);
    expect(result.breakdown.relevanceScore).toBeCloseTo(0.7642, 3);
    expect(result.breakdown.combinedScore).toBeCloseTo(0.760, 2);
    expect(result.breakdown.inclusionReason).toBe('directly_affects_agent');
  });
});

// ============================================================
// Full Score: Worked Example 2 — Launch Agent (Same Decision)
// ============================================================
describe('scoreDecision — Worked Example 2 (Launch)', () => {
  it('should produce much lower score for launch agent', () => {
    const createdAt = new Date(NOW.getTime() - 48 * 60 * 60 * 1000);

    // cos = 0.31 for launch task embedding
    const decisionEmbed = [1, 0, 0];
    const taskEmbed = [0.31, Math.sqrt(1 - 0.31 * 0.31), 0]; // cos = 0.31

    const decision = makeDecision({
      created_at: createdAt.toISOString(),
      validated_at: undefined,
      embedding: decisionEmbed,
    });

    const agent = makeAgent('launch-team', 'launch');

    const result = scoreDecision(decision, {
      agent,
      taskEmbedding: taskEmbed,
      now: NOW,
    });

    // A = 0.0 (launch not in affects)
    // B = 0.1/1 × 0.2 = 0.02 (only security matches, weight 0.1)
    // C = 0.0 (no roleTagMap overlap)
    // D = 0.31 × 0.25 = 0.0775
    // relevance = 0.0975
    // freshness = 0.751
    // combined = min(1.0, 0.0975×0.7 + 0.751×0.3) = 0.0683 + 0.2253 = 0.294
    expect(result.breakdown.directAffect).toBe(0);
    expect(result.breakdown.tagMatching).toBeCloseTo(0.02, 4);
    expect(result.breakdown.roleRelevance).toBe(0);
    expect(result.breakdown.semanticSimilarity).toBeCloseTo(0.0775, 3);
    expect(result.breakdown.relevanceScore).toBeCloseTo(0.0975, 3);
    expect(result.breakdown.combinedScore).toBeCloseTo(0.294, 2);
    expect(result.breakdown.inclusionReason).toBe('moderate_relevance');
  });
});

// ============================================================
// Core Product Proof: Same Decision, Different Roles, Different Ranking
// ============================================================
describe('Role-Differentiated Ranking', () => {
  it('should rank same decisions differently for builder vs launch', () => {
    const createdAt = new Date(NOW.getTime() - 48 * 60 * 60 * 1000);

    const decisions: Decision[] = [
      makeDecision({
        id: 'sec-1',
        title: 'Rate limiting on auth',
        affects: ['builder', 'ops'],
        tags: ['security', 'api', 'infrastructure'],
        created_at: createdAt.toISOString(),
      }),
      makeDecision({
        id: 'mkt-1',
        title: 'Product positioning strategy',
        affects: ['launch'],
        tags: ['positioning', 'messaging', 'audience'],
        created_at: createdAt.toISOString(),
      }),
      makeDecision({
        id: 'arch-1',
        title: 'Microservices architecture',
        affects: ['builder', 'ops'],
        tags: ['architecture', 'infrastructure', 'api'],
        created_at: createdAt.toISOString(),
      }),
    ];

    const builder = makeAgent('builder', 'builder');
    const launch = makeAgent('launch-team', 'launch');

    const builderResults = scoreDecisions(decisions, { agent: builder, now: NOW });
    const launchResults = scoreDecisions(decisions, { agent: launch, now: NOW });

    // Builder should rank: security & architecture high, marketing low
    const builderOrder = builderResults.results.map((r) => r.scored.decision.id);
    expect(builderOrder[0]).not.toBe('mkt-1');
    // Security and architecture should be top 2 for builder
    expect(builderOrder.slice(0, 2)).toEqual(expect.arrayContaining(['sec-1', 'arch-1']));

    // Launch should rank: marketing high, security & architecture low
    const launchOrder = launchResults.results.map((r) => r.scored.decision.id);
    expect(launchOrder[0]).toBe('mkt-1');

    // The key proof: builder's top decision score >> launch's score for same decision
    const builderSecScore = builderResults.results.find(
      (r) => r.scored.decision.id === 'sec-1',
    )!.scored.combined_score;
    const launchSecScore = launchResults.results.find(
      (r) => r.scored.decision.id === 'sec-1',
    )!.scored.combined_score;
    expect(builderSecScore).toBeGreaterThan(launchSecScore + 0.2);

    // And vice versa for marketing
    const builderMktScore = builderResults.results.find(
      (r) => r.scored.decision.id === 'mkt-1',
    )!.scored.combined_score;
    const launchMktScore = launchResults.results.find(
      (r) => r.scored.decision.id === 'mkt-1',
    )!.scored.combined_score;
    expect(launchMktScore).toBeGreaterThan(builderMktScore + 0.2);
  });

  it('should rank differently for reviewer vs product', () => {
    const createdAt = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);

    const decisions: Decision[] = [
      makeDecision({
        id: 'vuln-1',
        title: 'Fix XSS vulnerability',
        affects: ['reviewer'],
        tags: ['security', 'code_quality', 'vulnerability'],
        created_at: createdAt.toISOString(),
      }),
      makeDecision({
        id: 'scope-1',
        title: 'Reduce MVP scope',
        affects: ['product'],
        tags: ['scope', 'timeline', 'requirements'],
        created_at: createdAt.toISOString(),
      }),
    ];

    const reviewer = makeAgent('reviewer', 'reviewer');
    const product = makeAgent('pm', 'product');

    const reviewerResults = scoreDecisions(decisions, { agent: reviewer, now: NOW });
    const productResults = scoreDecisions(decisions, { agent: product, now: NOW });

    // Reviewer should rank vulnerability first
    expect(reviewerResults.results[0].scored.decision.id).toBe('vuln-1');
    // Product should rank scope first
    expect(productResults.results[0].scored.decision.id).toBe('scope-1');
  });
});

// ============================================================
// Missing-Signal Fallbacks
// ============================================================
describe('Missing-Signal Fallbacks', () => {
  it('should score correctly with no embedding', () => {
    const decision = makeDecision({ embedding: undefined });
    const agent = makeAgent('builder', 'builder');
    const result = scoreDecision(decision, { agent, now: NOW });
    expect(result.breakdown.semanticSimilarity).toBe(0);
    // Should still produce valid combined score from other signals
    expect(result.scored.combined_score).toBeGreaterThan(0);
  });

  it('should score correctly with no tags', () => {
    const decision = makeDecision({ tags: [] });
    const agent = makeAgent('builder', 'builder');
    const result = scoreDecision(decision, { agent, now: NOW });
    expect(result.breakdown.tagMatching).toBe(0);
    expect(result.breakdown.roleRelevance).toBe(0);
    // Still has directAffect + freshness
    expect(result.scored.combined_score).toBeGreaterThan(0);
  });

  it('should score correctly with no affects', () => {
    const decision = makeDecision({ affects: [] });
    const agent = makeAgent('builder', 'builder');
    const result = scoreDecision(decision, { agent, now: NOW });
    expect(result.breakdown.directAffect).toBe(0);
    expect(result.scored.combined_score).toBeGreaterThan(0);
  });

  it('should score correctly with all signals missing', () => {
    const decision = makeDecision({
      affects: [],
      tags: [],
      embedding: undefined,
    });
    const agent = makeAgent('builder', 'builder');
    const result = scoreDecision(decision, { agent, now: NOW });
    // Only freshness contributes
    expect(result.breakdown.directAffect).toBe(0);
    expect(result.breakdown.tagMatching).toBe(0);
    expect(result.breakdown.roleRelevance).toBe(0);
    expect(result.breakdown.semanticSimilarity).toBe(0);
    expect(result.breakdown.relevanceScore).toBe(0);
    // Combined = 0×0.7 + freshness×0.3 > 0
    expect(result.scored.combined_score).toBeGreaterThan(0);
    expect(result.scored.combined_score).toBeLessThan(0.4);
  });
});

// ============================================================
// Status Penalty Integration
// ============================================================
describe('Status Penalty Integration', () => {
  it('should reduce superseded decision score significantly', () => {
    const createdAt = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);
    const active = makeDecision({
      id: 'active-1',
      status: 'active',
      created_at: createdAt.toISOString(),
    });
    const superseded = makeDecision({
      id: 'superseded-1',
      status: 'superseded',
      created_at: createdAt.toISOString(),
    });

    const agent = makeAgent('builder', 'builder');

    const activeResult = scoreDecision(active, { agent, now: NOW });
    const supersededResult = scoreDecision(superseded, { agent, now: NOW });

    // Builder has include_superseded=true → penalty=0.4
    expect(supersededResult.breakdown.statusPenalty).toBe(0.4);
    expect(supersededResult.scored.combined_score).toBeLessThan(
      activeResult.scored.combined_score,
    );
  });

  it('should nearly eliminate reverted decision score', () => {
    const createdAt = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);
    const decision = makeDecision({
      status: 'reverted',
      created_at: createdAt.toISOString(),
    });
    const agent = makeAgent('builder', 'builder');
    const result = scoreDecision(decision, { agent, now: NOW });
    expect(result.breakdown.statusPenalty).toBe(0.05);
    // Relevance should be nearly zero after 0.05 penalty
    expect(result.breakdown.relevanceScore).toBeLessThan(0.05);
  });
});

// ============================================================
// Debug Mode
// ============================================================
describe('Debug Logging', () => {
  it('should produce debug log when debug=true', () => {
    const decisions = [makeDecision()];
    const agent = makeAgent('builder', 'builder');
    const { debugLog } = scoreDecisions(decisions, { agent, now: NOW, debug: true });
    expect(debugLog).toBeDefined();
    expect(debugLog).toHaveLength(1);
    expect(debugLog![0]).toContain('[SCORE]');
    expect(debugLog![0]).toContain('A(affect)=');
    expect(debugLog![0]).toContain('combined=');
  });

  it('should not produce debug log when debug=false', () => {
    const decisions = [makeDecision()];
    const agent = makeAgent('builder', 'builder');
    const { debugLog } = scoreDecisions(decisions, { agent, now: NOW, debug: false });
    expect(debugLog).toBeUndefined();
  });
});

// ============================================================
// Determinism
// ============================================================
describe('Determinism', () => {
  it('should produce identical scores on repeated calls', () => {
    const decision = makeDecision({
      created_at: new Date(NOW.getTime() - 100 * 60 * 60 * 1000).toISOString(),
      embedding: [0.5, 0.5, 0.5],
    });
    const agent = makeAgent('builder', 'builder');
    const task = [0.3, 0.7, 0.1];

    const r1 = scoreDecision(decision, { agent, taskEmbedding: task, now: NOW });
    const r2 = scoreDecision(decision, { agent, taskEmbedding: task, now: NOW });

    expect(r1.scored.combined_score).toBe(r2.scored.combined_score);
    expect(r1.scored.relevance_score).toBe(r2.scored.relevance_score);
    expect(r1.scored.freshness_score).toBe(r2.scored.freshness_score);
  });
});
