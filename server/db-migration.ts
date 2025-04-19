/**
 * Database migration script for external databases table
 */
import { db } from './db';
import { externalDatabases } from '../shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Run database migrations to create necessary tables
 */
export async function runMigrations() {
  console.log('Running database migrations...');

  try {
    // Create external_databases table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS external_databases (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type VARCHAR(20) NOT NULL,
        host TEXT NOT NULL,
        port INTEGER NOT NULL,
        database TEXT NOT NULL,
        schema TEXT,
        credentials TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_connected TIMESTAMP,
        tags TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by TEXT NOT NULL
      )
    `);
    
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

/**
 * Run this function to migrate the database
 */
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed, exiting...');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}