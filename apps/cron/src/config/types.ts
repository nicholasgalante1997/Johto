/**
 * Configuration for backup retention policy.
 */
export interface BackupRetentionConfig {
  /** Number of daily backups to retain */
  dailyRetention: number;
  /** Number of weekly backups to retain (Sunday backups) */
  weeklyRetention: number;
  /** Number of monthly backups to retain (1st of month) */
  monthlyRetention: number;
  /** Minimum number of backups to always keep */
  minimumBackups: number;
}

/**
 * Configuration for notification service.
 */
export interface NotificationConfig {
  /** Slack webhook URL for alerts */
  slackWebhookUrl?: string;
  /** Email address for alerts */
  alertEmail?: string;
  /** Minimum severity level to send notifications */
  minSeverity: 'info' | 'warn' | 'error' | 'critical';
}

/**
 * Configuration for the sync jobs.
 */
export interface SyncConfig {
  /** Batch size for card inserts */
  batchSize: number;
  /** Maximum sets to process per run */
  maxSetsPerRun: number;
  /** Whether to prioritize recent sets */
  prioritizeRecent: boolean;
}

/**
 * Complete cron service configuration.
 */
export interface CronServiceConfig {
  /** Timezone for schedule evaluation */
  timezone: string;
  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** Whether metrics collection is enabled */
  metricsEnabled: boolean;
  /** Path to SQLite database */
  databasePath: string;
  /** Directory for backups */
  backupDir: string;
  /** Backup retention settings */
  backupRetention: BackupRetentionConfig;
  /** Notification settings */
  notifications: NotificationConfig;
  /** Sync job settings */
  sync: SyncConfig;
}
