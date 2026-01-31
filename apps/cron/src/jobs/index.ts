import type { Job } from '../scheduler/Job';

// Sync jobs
import { SyncMissingSetsJob } from './sync/SyncMissingSetsJob';
import { SyncMissingCardsJob } from './sync/SyncMissingCardsJob';
import { ValidateDataIntegrityJob } from './sync/ValidateDataIntegrityJob';

// Backup jobs
import { BackupDatabaseJob } from './backup/BackupDatabaseJob';
import { RotateBackupsJob } from './backup/RotateBackupsJob';
import { ReplicateToPrimaryJob } from './backup/ReplicateToPrimaryJob';

// Health jobs
import { DatabaseHealthCheckJob } from './health/DatabaseHealthCheckJob';
import { CleanupStaleDataJob } from './health/CleanupStaleDataJob';

/**
 * All available jobs in the cron service.
 * Jobs are added here as they are implemented.
 */
export const allJobs: Job[] = [
  // Sync jobs
  new SyncMissingSetsJob(),
  new SyncMissingCardsJob(),
  new ValidateDataIntegrityJob(),

  // Backup jobs
  new BackupDatabaseJob(),
  new RotateBackupsJob(),
  new ReplicateToPrimaryJob(),

  // Health jobs
  new DatabaseHealthCheckJob(),
  new CleanupStaleDataJob()
];

/**
 * Get a job by name.
 */
export function getJobByName(name: string): Job | undefined {
  return allJobs.find((job) => job.config.name === name);
}

/**
 * Get all job configurations for display.
 */
export function getAllJobConfigs() {
  return allJobs.map((job) => job.config);
}

/**
 * Get all job names.
 */
export function getAllJobNames(): string[] {
  return allJobs.map((job) => job.config.name);
}

// Re-export job classes for direct import
export { SyncMissingSetsJob } from './sync/SyncMissingSetsJob';
export { SyncMissingCardsJob } from './sync/SyncMissingCardsJob';
export { ValidateDataIntegrityJob } from './sync/ValidateDataIntegrityJob';
export { BackupDatabaseJob } from './backup/BackupDatabaseJob';
export { RotateBackupsJob } from './backup/RotateBackupsJob';
export { ReplicateToPrimaryJob } from './backup/ReplicateToPrimaryJob';
export { DatabaseHealthCheckJob } from './health/DatabaseHealthCheckJob';
export { CleanupStaleDataJob } from './health/CleanupStaleDataJob';
