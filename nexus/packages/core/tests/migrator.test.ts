// ============================================================
// NEXUS v1 — Migrator Tests
// Tests migration runner against real PostgreSQL
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { migrate, migrationStatus } from '../src/db/migrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_DIR = join(__dirname, '..', '..', '..', 'supabase', 'migrations');

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://nexus:nexus_dev@localhost:5432/nexus';

let pool: pg.Pool;

beforeAll(async () => {
  pool = new pg.Pool({ connectionString: DATABASE_URL, max: 3 });
});

afterAll(async () => {
  await pool.end();
});

describe('migrationStatus', () => {
  it('should report applied and pending migrations', async () => {
    const status = await migrationStatus(pool, MIGRATIONS_DIR);
    // After migrate() has run in another test, all should be applied
    expect(status.applied.length + status.pending.length).toBeGreaterThan(0);
  });
});

describe('migrate (idempotent)', () => {
  it('should be safe to run multiple times', async () => {
    const first = await migrate(pool, MIGRATIONS_DIR);
    const second = await migrate(pool, MIGRATIONS_DIR);

    // Second run should skip everything the first applied
    expect(second.errors).toHaveLength(0);
    // All files either applied or skipped
    expect(second.applied.length + second.skipped.length).toBe(
      first.applied.length + first.skipped.length,
    );
  });

  it('should reject a non-existent migrations directory', async () => {
    await expect(migrate(pool, '/nonexistent/path')).rejects.toThrow(
      'Migrations directory not found',
    );
  });
});
