import type { JobConfig } from '../scheduler/types';

/**
 * Default job configurations.
 * Individual jobs can override these values in their class definition.
 */
export const jobConfigs: JobConfig[] = [
  // Data Synchronization Jobs
  {
    name: 'sync-missing-sets',
    description: 'Sync missing Pokemon TCG sets from local data source',
    schedule: '0 2 * * *', // Daily at 2:00 AM
    enabled: true,
    timeout: 300_000, // 5 minutes
    retryAttempts: 3,
    retryDelayMs: 60_000,
    runOnStartup: false,
    exclusive: true,
  },
  {
    name: 'sync-missing-cards',
    description: 'Sync missing cards for incomplete sets',
    schedule: '0 3 * * *', // Daily at 3:00 AM
    enabled: true,
    timeout: 1_800_000, // 30 minutes
    retryAttempts: 2,
    retryDelayMs: 120_000,
    dependsOn: ['sync-missing-sets'],
    exclusive: true,
  },
  {
    name: 'validate-data-integrity',
    description: 'Validate database integrity and flag data quality issues',
    schedule: '0 6 * * 0', // Weekly on Sunday at 6:00 AM
    enabled: true,
    timeout: 600_000, // 10 minutes
    retryAttempts: 1,
    retryDelayMs: 60_000,
    exclusive: true,
  },

  // Database Backup Jobs
  {
    name: 'backup-database',
    description: 'Create timestamped backup of the SQLite database',
    schedule: '0 0 * * *', // Daily at midnight
    enabled: true,
    timeout: 300_000, // 5 minutes
    retryAttempts: 2,
    retryDelayMs: 30_000,
    exclusive: true,
  },
  {
    name: 'rotate-backups',
    description: 'Manage backup retention by removing old backups',
    schedule: '0 1 * * *', // Daily at 1:00 AM
    enabled: true,
    timeout: 60_000, // 1 minute
    retryAttempts: 1,
    retryDelayMs: 30_000,
    dependsOn: ['backup-database'],
    exclusive: true,
  },
  {
    name: 'replicate-to-primary',
    description: 'Sync SQLite data to PostgreSQL primary database',
    schedule: '0 4 * * *', // Daily at 4:00 AM
    enabled: true,
    timeout: 1_800_000, // 30 minutes
    retryAttempts: 2,
    retryDelayMs: 120_000,
    dependsOn: ['sync-missing-cards'],
    exclusive: true,
  },

  // Health Monitoring Jobs
  {
    name: 'database-health-check',
    description: 'Monitor database health and alert on issues',
    schedule: '*/15 * * * *', // Every 15 minutes
    enabled: true,
    timeout: 60_000, // 1 minute
    retryAttempts: 1,
    retryDelayMs: 10_000,
    exclusive: false, // Can run concurrently
  },
  {
    name: 'cleanup-stale-data',
    description: 'Remove stale or temporary data and optimize database',
    schedule: '0 5 * * 0', // Weekly on Sunday at 5:00 AM
    enabled: true,
    timeout: 600_000, // 10 minutes
    retryAttempts: 1,
    retryDelayMs: 60_000,
    exclusive: true,
  },
];

/**
 * Get a job config by name.
 */
export function getJobConfig(name: string): JobConfig | undefined {
  return jobConfigs.find((config) => config.name === name);
}
