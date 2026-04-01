import { describe, it, expect } from 'vitest';
import {
  listRoleTemplates,
  getRoleTemplate,
  inspectRoleTemplate,
} from '../src/roles.js';
import { cosineSimilarity } from '../src/context-compiler/relevance.js';
import { createPool } from '../src/db/client.js';

// ============================================================
// Day 1 Smoke Tests
// Verify: roles load, cosine similarity works, pg pool creates
// ============================================================

describe('Role Templates', () => {
  it('lists 8 role templates', () => {
    const templates = listRoleTemplates();
    expect(templates).toHaveLength(8);
    expect(templates).toContain('builder');
    expect(templates).toContain('reviewer');
    expect(templates).toContain('product');
    expect(templates).toContain('docs');
    expect(templates).toContain('launch');
    expect(templates).toContain('ops');
    expect(templates).toContain('blockchain');
    expect(templates).toContain('challenge');
  });

  it('builder template has expected weights', () => {
    const builder = getRoleTemplate('builder');
    expect(builder.weights.architecture).toBe(1.0);
    expect(builder.weights.implementation).toBe(1.0);
    expect(builder.weights.api).toBe(0.9);
    expect(builder.weights.marketing).toBe(0.0);
    expect(builder.decision_depth).toBe(3);
    expect(builder.freshness_preference).toBe('recent_first');
    expect(builder.include_superseded).toBe(true);
  });

  it('reviewer template has expected weights', () => {
    const reviewer = getRoleTemplate('reviewer');
    expect(reviewer.weights.security).toBe(1.0);
    expect(reviewer.weights.code_quality).toBe(1.0);
    expect(reviewer.decision_depth).toBe(2);
    expect(reviewer.freshness_preference).toBe('balanced');
  });

  it('launch template has expected weights', () => {
    const launch = getRoleTemplate('launch');
    expect(launch.weights.positioning).toBe(1.0);
    expect(launch.weights.messaging).toBe(1.0);
    expect(launch.weights.code).toBe(0.0);
    expect(launch.include_superseded).toBe(false);
  });

  it('weight override works', () => {
    const custom = getRoleTemplate('builder', { security: 1.0 });
    expect(custom.weights.security).toBe(1.0);
    // Original weights preserved
    expect(custom.weights.architecture).toBe(1.0);
  });

  it('override does not mutate original template', () => {
    getRoleTemplate('builder', { security: 1.0 });
    const original = getRoleTemplate('builder');
    expect(original.weights.security).toBe(0.6); // unchanged
  });

  it('unknown role throws descriptive error', () => {
    expect(() => getRoleTemplate('nonexistent')).toThrowError(
      /Unknown role "nonexistent"/,
    );
  });

  it('inspectRoleTemplate returns deep copy', () => {
    const a = inspectRoleTemplate('builder');
    const b = inspectRoleTemplate('builder');
    expect(a).toEqual(b);
    if (a) {
      a.weights.architecture = 999;
      const c = inspectRoleTemplate('builder');
      expect(c?.weights.architecture).toBe(1.0); // not mutated
    }
  });

  it('inspectRoleTemplate returns undefined for unknown role', () => {
    expect(inspectRoleTemplate('nonexistent')).toBeUndefined();
  });
});

describe('Cosine Similarity', () => {
  it('identical vectors have similarity 1', () => {
    const v = [0.1, 0.2, 0.3, 0.4];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0);
  });

  it('orthogonal vectors have similarity 0', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0);
  });

  it('opposite vectors have similarity -1', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1.0);
  });

  it('handles zero vector', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it('handles null/undefined input', () => {
    expect(cosineSimilarity(null as unknown as number[], [1, 2])).toBe(0);
    expect(cosineSimilarity([1, 2], null as unknown as number[])).toBe(0);
  });

  it('handles mismatched lengths', () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });
});

describe('Database Pool', () => {
  it('createPool throws without DATABASE_URL', () => {
    // Temporarily clear env
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      expect(() => createPool()).toThrowError(/DATABASE_URL is required/);
    } finally {
      if (original) process.env.DATABASE_URL = original;
    }
  });

  it('createPool accepts explicit URL', () => {
    // Just verify it creates a pool object (doesn't connect until query)
    const pool = createPool('postgresql://test:test@localhost:5432/test');
    expect(pool).toBeDefined();
    pool.end();
  });
});
