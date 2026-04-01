// ============================================================
// NEXUS v1 — Built-in Role Templates
// From Spec §6. BUG-2 fixed: truncated weight maps reconstructed from §6 weights.
// ============================================================

import { RelevanceProfile } from './types.js';

const ROLE_TEMPLATES: Record<string, RelevanceProfile> = {
  builder: {
    weights: {
      architecture: 1.0, implementation: 1.0, api: 0.9, database: 0.9,
      framework: 0.8, code: 0.8, infrastructure: 0.7, security: 0.6,
      testing: 0.6, performance: 0.5, design: 0.2, legal: 0.1,
      marketing: 0.0, content: 0.0,
    },
    decision_depth: 3,
    freshness_preference: 'recent_first',
    include_superseded: true,
  },

  reviewer: {
    weights: {
      security: 1.0, code_quality: 1.0, architecture: 0.9, testing: 0.9,
      code: 0.8, vulnerability: 0.8, performance: 0.7, implementation: 0.6,
      api: 0.5, infrastructure: 0.4, design: 0.1, marketing: 0.0,
    },
    decision_depth: 2,
    freshness_preference: 'balanced',
    include_superseded: true,
  },

  product: {
    weights: {
      requirements: 1.0, scope: 1.0, timeline: 0.9, tradeoff: 0.9,
      dependencies: 0.8, risk: 0.8, architecture: 0.7, design: 0.6,
      security: 0.5, implementation: 0.4, legal: 0.4, marketing: 0.3,
      code: 0.1,
    },
    decision_depth: 3,
    freshness_preference: 'recent_first',
    include_superseded: true,
  },

  docs: {
    weights: {
      deprecation: 1.0, migration: 1.0, breaking_change: 1.0, api: 0.9,
      architecture: 0.7, requirements: 0.6, design: 0.5, security: 0.4,
      legal: 0.3, implementation: 0.3, marketing: 0.2, code: 0.2,
    },
    decision_depth: 1,
    freshness_preference: 'recent_first',
    include_superseded: false,
  },

  launch: {
    weights: {
      positioning: 1.0, audience: 1.0, messaging: 1.0, content: 0.9,
      brand: 0.9, marketing: 1.0, launch: 0.8, deprecation: 0.7,
      breaking_change: 0.6, architecture: 0.2, implementation: 0.0,
      security: 0.1, code: 0.0,
    },
    decision_depth: 1,
    freshness_preference: 'recent_first',
    include_superseded: false,
  },

  ops: {
    weights: {
      infrastructure: 1.0, deployment: 1.0, config: 0.9, monitoring: 0.9,
      security: 0.8, performance: 0.8, database: 0.7, architecture: 0.6,
      api: 0.5, code: 0.3, design: 0.0, marketing: 0.0,
    },
    decision_depth: 2,
    freshness_preference: 'validated_first',
    include_superseded: false,
  },

  blockchain: {
    weights: {
      contract: 1.0, chain: 1.0, token: 0.9, escrow: 0.9, onchain: 0.9,
      security: 0.8, architecture: 0.7, legal: 0.6, api: 0.5,
      implementation: 0.4, design: 0.1, marketing: 0.1,
    },
    decision_depth: 2,
    freshness_preference: 'balanced',
    include_superseded: true,
  },

  challenge: {
    weights: {
      challenge: 1.0, scoring: 1.0, judge: 1.0, benchmark: 0.9,
      calibration: 0.9, discrimination: 0.8, architecture: 0.6,
      security: 0.5, implementation: 0.3, marketing: 0.1, legal: 0.2,
    },
    decision_depth: 3,
    freshness_preference: 'recent_first',
    include_superseded: true,
  },
};

export function getRoleTemplate(
  role: string,
  overrides?: Partial<Record<string, number>>,
): RelevanceProfile {
  const template = ROLE_TEMPLATES[role];
  if (!template) {
    throw new Error(
      `Unknown role "${role}". Available: ${Object.keys(ROLE_TEMPLATES).join(', ')}`,
    );
  }

  if (!overrides) return { ...template, weights: { ...template.weights } };

  const mergedWeights: Record<string, number> = { ...template.weights };
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) {
      mergedWeights[key] = value;
    }
  }

  return {
    ...template,
    weights: mergedWeights,
  };
}

export function listRoleTemplates(): string[] {
  return Object.keys(ROLE_TEMPLATES);
}

export function inspectRoleTemplate(role: string): RelevanceProfile | undefined {
  const t = ROLE_TEMPLATES[role];
  return t ? { ...t, weights: { ...t.weights } } : undefined;
}
