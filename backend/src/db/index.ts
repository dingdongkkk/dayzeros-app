import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';
import 'dotenv/config';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dayzeros';

// Configure postgres.js client with SSL support for NeonDB
const queryClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') ? 'require' : undefined,
});

export const db = drizzle(queryClient, { schema });
export { schema };
