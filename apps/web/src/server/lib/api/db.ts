import { Database } from 'bun:sqlite';
import { sqlite } from '@pokemon/database';
import path from 'path';
import { Sqlite3DatabaseConnectionException } from '../models/errors.js';

let db: Database | null = null;

/**
 * Get a singleton READ-ONLY database connection
 * @returns Database instance
 */
export function getDatabase(): Database {
  if (db === null) {
    try {
      // Server runs from apps/web, so go up two levels to project root
      const dbPath = path.join(
        process.cwd(),
        '../../',
        'database',
        'pokemon-data.sqlite3.db'
      );

      // Create READ-ONLY database connection
      db = sqlite.createDatabase(dbPath, {
        readonly: true,
        create: false
      });

      // Enable query-only mode for extra safety
      db.run('PRAGMA query_only = ON;');
    } catch (e) {
      throw new Sqlite3DatabaseConnectionException(e);
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
