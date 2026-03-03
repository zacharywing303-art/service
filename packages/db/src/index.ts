import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

export function createDb(connectionString?: string) {
  const url = connectionString || process.env.DATABASE_URL || 'postgresql://openfsm:openfsm@localhost:5432/openfsm';
  const client = postgres(url);
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;

export * from './schema/index.js';
