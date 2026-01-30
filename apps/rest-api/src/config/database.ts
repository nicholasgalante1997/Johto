import { Database } from 'bun:sqlite';
import { sqlite } from '@pokemon/database';
import { config } from './index';

let db: Database | null = null;

/**
 * Get a singleton READ-ONLY database connection
 */
export function getDatabase(): Database {
  if (db === null) {
    db = sqlite.createDatabase(config.database.path, {
      readonly: config.database.readonly,
      create: false
    });

    // Enable query-only mode for extra safety
    if (config.database.readonly) {
      db.run('PRAGMA query_only = ON;');
    }
  }

  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db !== null) {
    db.close();
    db = null;
  }
}

/**
 * Check database health
 */
export function checkDatabaseHealth(): boolean {
  try {
    const database = getDatabase();
    const result = database.query('SELECT 1 as ok').get() as { ok: number } | null;
    return result?.ok === 1;
  } catch {
    return false;
  }
}
