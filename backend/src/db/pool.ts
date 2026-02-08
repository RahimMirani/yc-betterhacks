import { Pool } from '@neondatabase/serverless';
import { config } from '../config';

export const pool = new Pool({ connectionString: config.databaseUrl });

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return (result.rows ?? []) as T[];
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
