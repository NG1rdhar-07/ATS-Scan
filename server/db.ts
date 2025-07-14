import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(import.meta.dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set in your .env file. See .env.example for reference.",
  );
}

// Create database connection pool using standard pg for local development
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Add connection timeout and retry options
  connectionTimeoutMillis: 5000,
  max: 20,
  idleTimeoutMillis: 30000,
});

// Test database connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize Drizzle ORM with the pool
export const db = drizzle(pool, { schema });

// Log database connection status
console.log(`Database connection established with ${process.env.NODE_ENV} configuration.`);