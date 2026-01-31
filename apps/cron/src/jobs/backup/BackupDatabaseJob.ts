import { Job } from '../../scheduler/Job';
import type { JobConfig, JobContext, JobResult } from '../../scheduler/types';
import { BackupService } from '../../services/BackupService';

/**
 * Creates timestamped backups of the SQLite database.
 */
export class BackupDatabaseJob extends Job {
  readonly config: JobConfig = {
    name: 'backup-database',
    description: 'Create timestamped backup of the SQLite database',
    schedule: '0 0 * * *', // Daily at midnight
    enabled: true,
    timeout: 300_000, // 5 minutes
    retryAttempts: 2,
    retryDelayMs: 30_000,
    exclusive: true
  };

  private readonly backupService: BackupService;

  constructor() {
    super();
    const backupDir = process.env.BACKUP_DIR ?? './database/backups';
    this.backupService = new BackupService(backupDir);
  }

  async execute(context: JobContext): Promise<JobResult> {
    const startedAt = new Date();
    const logs: string[] = [];
    const metrics: Record<string, number> = {
      backup_created: 0,
      backup_size_bytes: 0,
      backup_verified: 0
    };

    const logger = this.createScopedLogger(context.logger, logs);

    try {
      logger.info('Starting database backup...');

      // Get database path
      const dbPath =
        process.env.DATABASE_PATH ?? './database/pokemon-data.sqlite3.db';

      // Create backup
      const backup = await this.backupService.createBackup(dbPath, {
        compress: true,
        verify: false // Can't verify compressed backups directly
      });

      metrics.backup_created = 1;
      metrics.backup_size_bytes = backup.sizeBytes;

      logger.info('Backup created: %s', backup.filename);
      logger.info('Backup size: %d bytes', backup.sizeBytes);
      logger.info('Compressed: %s', backup.compressed ? 'yes' : 'no');

      if (backup.checksum) {
        logger.info('Checksum (SHA256): %s', backup.checksum);
      }

      // List existing backups for stats
      const allBackups = await this.backupService.listBackups();
      logger.info('Total backups in storage: %d', allBackups.length);

      const totalSize = allBackups.reduce((sum, b) => sum + b.sizeBytes, 0);
      logger.info(
        'Total backup storage used: %d MB',
        Math.round(totalSize / 1024 / 1024)
      );

      context.metrics.increment('backups_created');
      context.metrics.gauge('backup_size_bytes', backup.sizeBytes);
      context.metrics.gauge('total_backups', allBackups.length);

      return this.createResult(startedAt, metrics, logs);
    } catch (error) {
      logger.error(
        'Backup failed: %s',
        error instanceof Error ? error.message : error
      );
      return this.createResult(
        startedAt,
        metrics,
        logs,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async onSuccess(result: JobResult): Promise<void> {
    const sizeKB = Math.round((result.metrics.backup_size_bytes ?? 0) / 1024);
    console.log(`[BackupDatabaseJob] Completed - ${sizeKB} KB backup created`);
  }

  async onFailure(error: Error): Promise<void> {
    console.error(`[BackupDatabaseJob] Failed: ${error.message}`);
  }
}
