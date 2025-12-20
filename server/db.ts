/**
 * Database connection using Drizzle ORM with Neon Serverless
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";

// Check if DATABASE_URL is available
const databaseUrl = process.env.DATABASE_URL;

// Create the database connection if DATABASE_URL is available
export const sql = databaseUrl ? neon(databaseUrl) : null;
export const db = sql ? drizzle(sql, { schema }) : null;

// Export a function to check if database is available
export function isDatabaseAvailable(): boolean {
  return db !== null;
}

