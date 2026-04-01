// ============================================================
// NEXUS v1 — Database Client (pg.Pool)
// AMB-1 resolution: raw pg driver, not Supabase client
// ============================================================

import pg from 'pg';
const { Pool } = pg;
export type { Pool } from 'pg';

export function createPool(databaseUrl?: string): pg.Pool {
  const connectionString = databaseUrl || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required. Set it in environment or pass databaseUrl to createPool().',
    );
  }
  return new Pool({ connectionString, max: 20 });
}

export async function healthCheck(pool: pg.Pool): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1 AS ok');
    return result.rows[0]?.ok === 1;
  } catch {
    return false;
  }
}
