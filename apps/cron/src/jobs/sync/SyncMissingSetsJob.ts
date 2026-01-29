import { Job } from '../../scheduler/Job';
import type { JobConfig, JobContext, JobResult } from '../../scheduler/types';
import { sqlite } from '@pokemon/database';
import { getSets } from '@pokemon/data';

interface DbSet {
  id: string;
  name: string;
  series: string;
  printed_total: number | null;
  total: number | null;
}

interface SourceSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  legalities?: Record<string, string>;
  ptcgoCode?: string;
  releaseDate: string;
  updatedAt: string;
  images?: {
    symbol: string;
    logo: string;
  };
}

/**
 * Syncs missing Pokemon TCG sets from the local data source to the SQLite database.
 */
export class SyncMissingSetsJob extends Job {
  readonly config: JobConfig = {
    name: 'sync-missing-sets',
    description: 'Sync missing Pokemon TCG sets from local data source',
    schedule: '0 2 * * *', // Daily at 2:00 AM
    enabled: true,
    timeout: 300_000, // 5 minutes
    retryAttempts: 3,
    retryDelayMs: 60_000,
    runOnStartup: false,
    exclusive: true,
  };

  async execute(context: JobContext): Promise<JobResult> {
    const startedAt = new Date();
    const logs: string[] = [];
    const metrics: Record<string, number> = {
      sets_checked: 0,
      sets_existing: 0,
      sets_missing: 0,
      sets_synced: 0,
      sets_failed: 0,
    };

    const logger = this.createScopedLogger(context.logger, logs);

    try {
      logger.info('Starting missing sets sync...');

      // Step 1: Get existing sets from SQLite
      const existingSets = sqlite.findAllSets(context.sqliteDb)() as DbSet[];
      const existingSetIds = new Set(existingSets.map((s) => s.id));
      metrics.sets_existing = existingSetIds.size;
      logger.info('Found %d existing sets in database', existingSetIds.size);

      // Step 2: Load local source of truth
      const localSets: SourceSet[] = await getSets();
      metrics.sets_checked = localSets.length;
      logger.info('Found %d sets in local data source', localSets.length);

      // Step 3: Find missing sets
      const missingSets = localSets.filter((set) => !existingSetIds.has(set.id));
      metrics.sets_missing = missingSets.length;

      if (missingSets.length === 0) {
        logger.info('No missing sets found - database is up to date');
        return this.createResult(startedAt, metrics, logs);
      }

      logger.info('Found %d missing sets to sync', missingSets.length);

      // Step 4: Insert missing sets
      const doInsertSet = sqlite.insertSet(context.sqliteDb);

      for (const set of missingSets) {
        // Check for abort signal
        if (context.abortSignal.aborted) {
          logger.warn('Job aborted - stopping sync');
          break;
        }

        try {
          doInsertSet(
            set.id,
            set.name,
            set.series,
            set.printedTotal ?? null,
            set.total ?? null,
            set.legalities ? JSON.stringify(set.legalities) : null,
            set.ptcgoCode ?? null,
            set.releaseDate ?? null,
            set.updatedAt ?? null,
            set.images ? JSON.stringify(set.images) : null
          );
          metrics.sets_synced++;
          logger.info('Synced set: %s (%s)', set.name, set.id);
        } catch (error) {
          metrics.sets_failed++;
          logger.error(
            'Failed to sync set %s: %s',
            set.id,
            error instanceof Error ? error.message : error
          );
        }
      }

      logger.info(
        'Sync complete: %d synced, %d failed out of %d missing',
        metrics.sets_synced,
        metrics.sets_failed,
        metrics.sets_missing
      );

      // Record timing metric
      context.metrics.timing('sync_duration', Date.now() - startedAt.getTime());

      return this.createResult(startedAt, metrics, logs);
    } catch (error) {
      logger.error(
        'Job failed: %s',
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
    console.log(
      `[SyncMissingSetsJob] Completed: ${result.metrics.sets_synced} sets synced`
    );
  }

  async onFailure(error: Error): Promise<void> {
    console.error(`[SyncMissingSetsJob] Failed: ${error.message}`);
  }
}
