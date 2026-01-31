import { Database } from 'bun:sqlite';
import { sqlite } from '@pokemon/database';
import type { Service } from '@pokemon/framework';
import type { Config } from '../config';

/**
 * SQLite database service with lifecycle management.
 * Wraps bun:sqlite and @pokemon/database utilities behind
 * a single injectable service.
 */
export class DatabaseService implements Service {
  private db: Database | null = null;

  constructor(private readonly config: Config['database']) {}

  async start(): Promise<void> {
    this.db = sqlite.createDatabase(this.config.path, {
      readonly: this.config.readonly,
      readwrite: !this.config.readonly,
      create: false
    });

    if (this.config.readonly) {
      this.db.run('PRAGMA query_only = ON;');
    }

    console.log(`[db] Connected to ${this.config.path}`);
  }

  async stop(): Promise<void> {
    this.db?.close();
    this.db = null;
    console.log('[db] Connection closed');
  }

  private get instance(): Database {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  /** Health check — returns true if a simple query succeeds */
  ping(): boolean {
    try {
      this.instance.query('SELECT 1 as ok').get();
      return true;
    } catch {
      return false;
    }
  }

  /** Execute a query returning multiple rows */
  query<T>(
    sql: string,
    ...params: (null | string | number | bigint | boolean | Uint8Array)[]
  ): T[] {
    return this.instance.query(sql).all(...params) as T[];
  }

  /** Execute a query returning a single row or null */
  queryOne<T>(
    sql: string,
    ...params: (null | string | number | bigint | boolean | Uint8Array)[]
  ): T | null {
    return (this.instance.query(sql).get(...params) as T | null) ?? null;
  }

  findUserById(id: number): unknown | null {
    return sqlite.findUserById(this.instance)(id) ?? null;
  }

  findAllUsers(): unknown[] {
    return sqlite.findAllUsers(this.instance)();
  }

  findSetById(id: string): unknown | null {
    return sqlite.findSetById(this.instance)(id) ?? null;
  }

  findSetsBySeries(series: string): unknown[] {
    return sqlite.findSetsBySeries(this.instance)(series);
  }

  findCardById(id: string): unknown | null {
    return sqlite.findCardById(this.instance)(id) ?? null;
  }

  findCardsBySetId(setId: string): unknown[] {
    return sqlite.findCardsBySetId(this.instance)(setId);
  }

  findCardsByName(name: string): unknown[] {
    return sqlite.findCardsByName(this.instance)(name);
  }
}
