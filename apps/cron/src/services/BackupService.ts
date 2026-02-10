import { join, basename } from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger('cron:backup');

export interface BackupInfo {
  path: string;
  filename: string;
  timestamp: Date;
  sizeBytes: number;
  compressed: boolean;
  checksum?: string;
}

export interface BackupOptions {
  compress?: boolean;
  verify?: boolean;
}

/**
 * Service for database backup operations.
 */
export class BackupService {
  private readonly backupDir: string;

  constructor(backupDir: string = './database/backups') {
    this.backupDir = backupDir;
  }

  /**
   * Create a backup of the SQLite database.
   */
  async createBackup(
    sourcePath: string,
    options: BackupOptions = {}
  ): Promise<BackupInfo> {
    const { compress = true, verify = true } = options;

    // Ensure backup directory exists
    await this.ensureBackupDir();

    // Generate backup filename with timestamp
    const timestamp = new Date();
    const timestampStr = timestamp.toISOString().replace(/[:.]/g, '-');
    const filename = `pokemon-data-${timestampStr}.sqlite3.db`;
    const backupPath = join(this.backupDir, filename);

    logger.info('Creating backup: %s', filename);

    // Copy the database file
    const sourceFile = Bun.file(sourcePath);
    if (!(await sourceFile.exists())) {
      throw new Error(`Source database not found: ${sourcePath}`);
    }

    await Bun.write(backupPath, sourceFile);
    logger.info('Database copied to: %s', backupPath);

    // Get backup size
    let finalPath = backupPath;
    let sizeBytes = (await Bun.file(backupPath).stat()).size;

    // Compress if requested
    if (compress) {
      const compressedPath = `${backupPath}.gz`;
      const data = await Bun.file(backupPath).arrayBuffer();
      const compressed = Bun.gzipSync(new Uint8Array(data));
      await Bun.write(compressedPath, compressed);

      // Remove uncompressed file
      await Bun.file(backupPath).unlink();

      finalPath = compressedPath;
      sizeBytes = compressed.byteLength;
      logger.info('Compressed backup: %d bytes', sizeBytes);
    }

    // Calculate checksum
    let checksum: string | undefined;
    const backupData = await Bun.file(finalPath).arrayBuffer();
    const hasher = new Bun.CryptoHasher('sha256');
    hasher.update(new Uint8Array(backupData));
    checksum = hasher.digest('hex');
    logger.info('Backup checksum: %s', checksum);

    // Verify backup integrity
    if (verify && !compress) {
      await this.verifyBackup(backupPath);
    }

    return {
      path: finalPath,
      filename: basename(finalPath),
      timestamp,
      sizeBytes,
      compressed: compress,
      checksum
    };
  }

  /**
   * Verify a backup file's integrity.
   */
  async verifyBackup(backupPath: string): Promise<boolean> {
    const { sqlite } = await import('@pokemon/database');

    try {
      // Try to open the backup and run integrity check
      const db = sqlite.createDatabase(backupPath, {
        create: false,
        readwrite: false
      });

      const result = db.query('PRAGMA integrity_check').get() as {
        integrity_check: string;
      };
      db.close();

      const isValid = result.integrity_check === 'ok';
      if (isValid) {
        logger.info('Backup verification passed');
      } else {
        logger.error('Backup verification failed: %s', result.integrity_check);
      }

      return isValid;
    } catch (error) {
      logger.error(
        'Backup verification error: %s',
        error instanceof Error ? error.message : error
      );
      return false;
    }
  }

  /**
   * List all backups in the backup directory.
   */
  async listBackups(): Promise<BackupInfo[]> {
    const backups: BackupInfo[] = [];

    try {
      const glob = new Bun.Glob('pokemon-data-*.sqlite3.db*');
      const files = glob.scanSync({ cwd: this.backupDir });

      for (const filename of files) {
        const path = join(this.backupDir, filename);
        const file = Bun.file(path);
        const stat = await file.stat();

        // Parse timestamp from filename
        const match = filename.match(
          /pokemon-data-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/
        );
        const timestamp = match
          ? new Date(match[1].replace(/-/g, (m, i) => (i > 9 ? ':' : m)))
          : new Date(stat.mtime);

        backups.push({
          path,
          filename,
          timestamp,
          sizeBytes: stat.size,
          compressed: filename.endsWith('.gz')
        });
      }

      // Sort by timestamp descending (newest first)
      backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      logger.warn(
        'Error listing backups: %s',
        error instanceof Error ? error.message : error
      );
    }

    return backups;
  }

  /**
   * Delete a backup file.
   */
  async deleteBackup(backupPath: string): Promise<void> {
    await Bun.file(backupPath).unlink();
    logger.info('Deleted backup: %s', basename(backupPath));
  }

  /**
   * Get backups that should be deleted based on retention policy.
   */
  async getBackupsToDelete(
    backups: BackupInfo[],
    retention: {
      dailyRetention: number;
      weeklyRetention: number;
      monthlyRetention: number;
      minimumBackups: number;
    }
  ): Promise<BackupInfo[]> {
    const {
      dailyRetention,
      weeklyRetention,
      monthlyRetention,
      minimumBackups
    } = retention;

    if (backups.length <= minimumBackups) {
      return [];
    }

    const toKeep = new Set<string>();
    const now = new Date();

    // Sort by date
    const sorted = [...backups].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    // Keep last N daily backups
    let dailyCount = 0;
    for (const backup of sorted) {
      if (dailyCount < dailyRetention) {
        toKeep.add(backup.path);
        dailyCount++;
      }
    }

    // Keep weekly backups (Sundays) for last N weeks
    let weeklyCount = 0;
    for (const backup of sorted) {
      if (backup.timestamp.getDay() === 0 && weeklyCount < weeklyRetention) {
        toKeep.add(backup.path);
        weeklyCount++;
      }
    }

    // Keep monthly backups (1st of month) for last N months
    let monthlyCount = 0;
    for (const backup of sorted) {
      if (backup.timestamp.getDate() === 1 && monthlyCount < monthlyRetention) {
        toKeep.add(backup.path);
        monthlyCount++;
      }
    }

    // Ensure we keep minimum backups
    while (toKeep.size < minimumBackups && sorted.length > toKeep.size) {
      for (const backup of sorted) {
        if (!toKeep.has(backup.path)) {
          toKeep.add(backup.path);
          if (toKeep.size >= minimumBackups) break;
        }
      }
    }

    // Return backups that are not in the keep set
    return sorted.filter((backup) => !toKeep.has(backup.path));
  }

  /**
   * Ensure the backup directory exists.
   */
  private async ensureBackupDir(): Promise<void> {
    const { mkdir } = await import('fs/promises');
    try {
      await mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      // Directory may already exist
    }
  }
}
