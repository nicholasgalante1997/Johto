import { Job } from '../../scheduler/Job';
import type { JobConfig, JobContext, JobResult } from '../../scheduler/types';
import { BackupService } from '../../services/BackupService';

/**
 * Manages backup retention by removing old backups.
 * Keeps:
 * - Last 7 daily backups
 * - Last 4 weekly backups (Sundays)
 * - Last 3 monthly backups (1st of month)
 * - Minimum of 5 backups always retained
 */
export class RotateBackupsJob extends Job {
  readonly config: JobConfig = {
    name: 'rotate-backups',
    description: 'Manage backup retention by removing old backups',
    schedule: '0 1 * * *', // Daily at 1:00 AM
    enabled: true,
    timeout: 60_000, // 1 minute
    retryAttempts: 1,
    retryDelayMs: 30_000,
    dependsOn: ['backup-database'],
    exclusive: true
  };

  private readonly backupService: BackupService;
  private readonly retention = {
    dailyRetention: 7,
    weeklyRetention: 4,
    monthlyRetention: 3,
    minimumBackups: 5
  };

  constructor() {
    super();
    const backupDir = process.env.BACKUP_DIR ?? './database/backups';
    this.backupService = new BackupService(backupDir);
  }

  async execute(context: JobContext): Promise<JobResult> {
    const startedAt = new Date();
    const logs: string[] = [];
    const metrics: Record<string, number> = {
      total_backups: 0,
      backups_deleted: 0,
      space_freed_bytes: 0,
      backups_retained: 0
    };

    const logger = this.createScopedLogger(context.logger, logs);

    try {
      logger.info('Starting backup rotation...');
      logger.info(
        'Retention policy: %d daily, %d weekly, %d monthly, min %d',
        this.retention.dailyRetention,
        this.retention.weeklyRetention,
        this.retention.monthlyRetention,
        this.retention.minimumBackups
      );

      // List all backups
      const allBackups = await this.backupService.listBackups();
      metrics.total_backups = allBackups.length;
      logger.info('Found %d backups', allBackups.length);

      if (allBackups.length === 0) {
        logger.info('No backups found - nothing to rotate');
        return this.createResult(startedAt, metrics, logs);
      }

      // Get backups to delete based on retention policy
      const toDelete = await this.backupService.getBackupsToDelete(
        allBackups,
        this.retention
      );

      if (toDelete.length === 0) {
        logger.info('All backups within retention policy - nothing to delete');
        metrics.backups_retained = allBackups.length;
        return this.createResult(startedAt, metrics, logs);
      }

      logger.info('Identified %d backups for deletion', toDelete.length);

      // Delete old backups
      for (const backup of toDelete) {
        if (context.abortSignal.aborted) {
          logger.warn('Job aborted - stopping rotation');
          break;
        }

        try {
          await this.backupService.deleteBackup(backup.path);
          metrics.backups_deleted++;
          metrics.space_freed_bytes += backup.sizeBytes;
          logger.info(
            'Deleted: %s (%d bytes)',
            backup.filename,
            backup.sizeBytes
          );
        } catch (error) {
          logger.error(
            'Failed to delete %s: %s',
            backup.filename,
            error instanceof Error ? error.message : error
          );
        }
      }

      metrics.backups_retained =
        metrics.total_backups - metrics.backups_deleted;

      logger.info(
        'Rotation complete: %d deleted, %d retained',
        metrics.backups_deleted,
        metrics.backups_retained
      );
      logger.info(
        'Space freed: %d MB',
        Math.round(metrics.space_freed_bytes / 1024 / 1024)
      );

      context.metrics.increment('backups_rotated', metrics.backups_deleted);
      context.metrics.gauge('backups_retained', metrics.backups_retained);

      return this.createResult(startedAt, metrics, logs);
    } catch (error) {
      logger.error(
        'Rotation failed: %s',
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
    const deleted = result.metrics.backups_deleted ?? 0;
    const retained = result.metrics.backups_retained ?? 0;
    console.log(
      `[RotateBackupsJob] Completed - ${deleted} deleted, ${retained} retained`
    );
  }

  async onFailure(error: Error): Promise<void> {
    console.error(`[RotateBackupsJob] Failed: ${error.message}`);
  }
}
