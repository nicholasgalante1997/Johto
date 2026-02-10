import type { CronServiceConfig } from './types';

export type { CronServiceConfig } from './types';

/**
 * Load configuration from environment variables with defaults.
 */
export function loadConfig(): CronServiceConfig {
  return {
    timezone: process.env.CRON_TIMEZONE ?? 'America/New_York',
    logLevel:
      (process.env.CRON_LOG_LEVEL as CronServiceConfig['logLevel']) ?? 'info',
    metricsEnabled: process.env.CRON_METRICS_ENABLED !== 'false',
    databasePath:
      process.env.DATABASE_PATH ?? './database/pokemon-data.sqlite3.db',
    backupDir: process.env.BACKUP_DIR ?? './database/backups',
    backupRetention: {
      dailyRetention: parseInt(process.env.BACKUP_DAILY_RETENTION ?? '7', 10),
      weeklyRetention: parseInt(process.env.BACKUP_WEEKLY_RETENTION ?? '4', 10),
      monthlyRetention: parseInt(
        process.env.BACKUP_MONTHLY_RETENTION ?? '3',
        10
      ),
      minimumBackups: parseInt(process.env.BACKUP_MINIMUM ?? '3', 10)
    },
    notifications: {
      slackWebhookUrl: process.env.NOTIFICATION_WEBHOOK_URL,
      alertEmail: process.env.NOTIFICATION_EMAIL,
      minSeverity:
        (process.env.NOTIFICATION_MIN_SEVERITY as
          | 'info'
          | 'warn'
          | 'error'
          | 'critical') ?? 'error'
    },
    sync: {
      batchSize: parseInt(process.env.SYNC_BATCH_SIZE ?? '100', 10),
      maxSetsPerRun: parseInt(process.env.SYNC_MAX_SETS_PER_RUN ?? '10', 10),
      prioritizeRecent: process.env.SYNC_PRIORITIZE_RECENT !== 'false'
    }
  };
}

/**
 * Validate configuration and log warnings for missing values.
 */
export function validateConfig(config: CronServiceConfig): string[] {
  const warnings: string[] = [];

  if (!process.env.POKEMON_TCG_API_KEY) {
    warnings.push('POKEMON_TCG_API_KEY not set - API sync will fail');
  }

  if (!process.env.POSTGRES_HOST) {
    warnings.push('PostgreSQL not configured - replication will be skipped');
  }

  if (
    !config.notifications.slackWebhookUrl &&
    !config.notifications.alertEmail
  ) {
    warnings.push(
      'No notification channels configured - alerts will only be logged'
    );
  }

  return warnings;
}
