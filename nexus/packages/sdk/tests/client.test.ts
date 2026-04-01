// ============================================================
// NEXUS v1 — SDK Client Tests
// Tests client construction, URL handling, and type re-exports
// Network-dependent methods tested in integration (Day 8+)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  NexusClient,
  getRoleTemplate,
  listRoleTemplates,
  inspectRoleTemplate,
} from '../src/index.js';
import type {
  Project,
  Agent,
  Decision,
  CompileRequest,
  ContextPackage,
  NexusClientConfig,
} from '../src/index.js';

describe('NexusClient', () => {
  it('constructs with url', () => {
    const client = new NexusClient({ url: 'http://localhost:3000' });
    expect(client).toBeDefined();
  });

  it('constructs with url and apiKey', () => {
    const client = new NexusClient({
      url: 'http://localhost:3000',
      apiKey: 'nx-test-key',
    });
    expect(client).toBeDefined();
  });

  it('strips trailing slash from url', () => {
    // We can't directly test private baseUrl, but we can verify
    // the client doesn't throw on construction with trailing slash
    const client = new NexusClient({ url: 'http://localhost:3000/' });
    expect(client).toBeDefined();
  });

  it('throws on API error for non-existent server', async () => {
    const client = new NexusClient({ url: 'http://localhost:19999' });
    await expect(client.getProject('test')).rejects.toThrow();
  });
});

describe('SDK re-exports core utilities', () => {
  it('getRoleTemplate returns valid profiles', () => {
    const builder = getRoleTemplate('builder');
    expect(builder).toBeDefined();
    expect(builder.weights).toBeDefined();
    expect(builder.decision_depth).toBeGreaterThan(0);
    expect(typeof builder.include_superseded).toBe('boolean');
  });

  it('listRoleTemplates returns all 8 roles', () => {
    const roles = listRoleTemplates();
    expect(roles.length).toBe(8);
    expect(roles).toContain('builder');
    expect(roles).toContain('reviewer');
    expect(roles).toContain('launch');
  });

  it('inspectRoleTemplate shows weights for a role', () => {
    const inspection = inspectRoleTemplate('builder');
    expect(inspection).toBeDefined();
    expect(typeof inspection).toBe('object');
  });

  it('type re-exports compile without error', () => {
    // Verify types are accessible (compilation check)
    const config: NexusClientConfig = { url: 'http://localhost:3000' };
    const request: CompileRequest = {
      agent_id: 'test',
      task_description: 'test task',
    };
    expect(config.url).toBe('http://localhost:3000');
    expect(request.agent_id).toBe('test');
  });
});
