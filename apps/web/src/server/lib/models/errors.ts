export class Sqlite3DatabaseConnectionException extends Error {
  constructor(error: unknown) {
    super('Could not connect to "pokemon-data.sqlite3.db"');
    this.message = error instanceof Error ? error.message : String(error);
  }
}
