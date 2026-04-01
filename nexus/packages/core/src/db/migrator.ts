// ============================================================
// NEXUS v1 — Migration Runner
// Applies SQL migration files via pg.Pool (no psql dependency)
// ============================================================

import pg from 'pg';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const MIGRATIONS_TABLE = '_nexus_migrations';

interface MigrationRecord {
  name: string;
  applied_at: string;
}

/**
 * Ensure the migrations tracking table exists.
 */
async function ensureMigrationsTable(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

/**
 * Get list of already-applied migration names.
 */
async function getAppliedMigrations(pool: pg.Pool): Promise<Set<string>> {
  const result = await pool.query<MigrationRecord>(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id ASC`,
  );
  return new Set(result.rows.map((r) => r.name));
}

/**
 * Discover .sql files in the migrations directory, sorted by name.
 */
function discoverMigrations(migrationsDir: string): string[] {
  if (!existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

export interface MigrateResult {
  applied: string[];
  skipped: string[];
  errors: Array<{ name: string; error: string }>;
}

/**
 * Run all pending migrations inside individual transactions.
 *
 * @param pool - pg.Pool instance
 * @param migrationsDir - absolute path to the directory containing .sql files
 * @returns summary of applied, skipped, and errored migrations
 */
export async function migrate(
  pool: pg.Pool,
  migrationsDir: string,
): Promise<MigrateResult> {
  const dir = resolve(migrationsDir);
  await ensureMigrationsTable(pool);

  const applied = await getAppliedMigrations(pool);
  const files = discoverMigrations(dir);

  const result: MigrateResult = { applied: [], skipped: [], errors: [] };

  for (const file of files) {
    if (applied.has(file)) {
      result.skipped.push(file);
      continue;
    }

    const sql = readFileSync(join(dir, file), 'utf-8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`,
        [file],
      );
      await client.query('COMMIT');
      result.applied.push(file);
    } catch (err) {
      await client.query('ROLLBACK');
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({ name: file, error: message });
    } finally {
      client.release();
    }
  }

  return result;
}

/**
 * Get migration status: which are applied and which are pending.
 */
export async function migrationStatus(
  pool: pg.Pool,
  migrationsDir: string,
): Promise<{ applied: string[]; pending: string[] }> {
  const dir = resolve(migrationsDir);
  await ensureMigrationsTable(pool);

  const appliedSet = await getAppliedMigrations(pool);
  const files = discoverMigrations(dir);

  return {
    applied: files.filter((f) => appliedSet.has(f)),
    pending: files.filter((f) => !appliedSet.has(f)),
  };
}
