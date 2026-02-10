import { Job } from '../../scheduler/Job';
import type { JobConfig, JobContext, JobResult } from '../../scheduler/types';

/**
 * Removes stale or temporary data and optimizes database.
 */
export class CleanupStaleDataJob extends Job {
  readonly config: JobConfig = {
    name: 'cleanup-stale-data',
    description: 'Remove stale or temporary data and optimize database',
    schedule: '0 5 * * 0', // Weekly on Sunday at 5:00 AM
    enabled: true,
    timeout: 600_000, // 10 minutes
    retryAttempts: 1,
    retryDelayMs: 60_000,
    exclusive: true
  };

  async execute(context: JobContext): Promise<JobResult> {
    const startedAt = new Date();
    const logs: string[] = [];
    const metrics: Record<string, number> = {
      pages_freed: 0,
      size_before_mb: 0,
      size_after_mb: 0,
      space_saved_mb: 0
    };

    const logger = this.createScopedLogger(context.logger, logs);

    try {
      logger.info('Starting database cleanup and optimization...');
      const db = context.sqliteDb;

      // Get database size before cleanup
      const pageCountBefore = db.query('PRAGMA page_count').get() as {
        page_count: number;
      };
      const pageSize = db.query('PRAGMA page_size').get() as {
        page_size: number;
      };
      const sizeBefore =
        (pageCountBefore.page_count * pageSize.page_size) / 1024 / 1024;
      metrics.size_before_mb = Math.round(sizeBefore);
      logger.info('Database size before: %d MB', metrics.size_before_mb);

      // Check for aborted signal
      if (context.abortSignal.aborted) {
        return this.createResult(startedAt, metrics, logs);
      }

      // Run ANALYZE to update query planner statistics
      logger.info('Running ANALYZE...');
      db.run('ANALYZE');
      logger.info('ANALYZE complete');

      // Check for aborted signal
      if (context.abortSignal.aborted) {
        return this.createResult(startedAt, metrics, logs);
      }

      // Run VACUUM to reclaim space and defragment
      logger.info('Running VACUUM...');
      const freeListBefore = db.query('PRAGMA freelist_count').get() as {
        freelist_count: number;
      };
      logger.info(
        'Free pages before VACUUM: %d',
        freeListBefore.freelist_count
      );

      db.run('VACUUM');
      logger.info('VACUUM complete');

      // Get database size after cleanup
      const pageCountAfter = db.query('PRAGMA page_count').get() as {
        page_count: number;
      };
      const sizeAfter =
        (pageCountAfter.page_count * pageSize.page_size) / 1024 / 1024;
      metrics.size_after_mb = Math.round(sizeAfter);
      metrics.space_saved_mb = Math.max(0, Math.round(sizeBefore - sizeAfter));
      metrics.pages_freed = Math.max(
        0,
        pageCountBefore.page_count - pageCountAfter.page_count
      );

      logger.info('Database size after: %d MB', metrics.size_after_mb);
      logger.info('Space saved: %d MB', metrics.space_saved_mb);
      logger.info('Pages freed: %d', metrics.pages_freed);

      // Check for aborted signal
      if (context.abortSignal.aborted) {
        return this.createResult(startedAt, metrics, logs);
      }

      // Checkpoint WAL file to consolidate
      logger.info('Checkpointing WAL...');
      const walResult = db.query('PRAGMA wal_checkpoint(TRUNCATE)').get() as {
        busy: number;
        log: number;
        checkpointed: number;
      };
      logger.info(
        'WAL checkpoint: %d pages checkpointed, %d pages logged',
        walResult.checkpointed,
        walResult.log
      );

      // Reanalyze after vacuum for optimal query plans
      logger.info('Running final ANALYZE...');
      db.run('ANALYZE');

      // Report statistics
      const tableStats = db
        .query(
          `
        SELECT
          (SELECT COUNT(*) FROM pokemon_card_sets) as sets,
          (SELECT COUNT(*) FROM pokemon_cards) as cards
      `
        )
        .get() as { sets: number; cards: number };

      logger.info(
        'Current data: %d sets, %d cards',
        tableStats.sets,
        tableStats.cards
      );
      metrics.set_count = tableStats.sets;
      metrics.card_count = tableStats.cards;

      context.metrics.gauge('db_size_mb', metrics.size_after_mb);
      context.metrics.increment('space_saved_mb', metrics.space_saved_mb);

      return this.createResult(startedAt, metrics, logs);
    } catch (error) {
      logger.error(
        'Cleanup failed: %s',
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
      `[CleanupStaleDataJob] Completed - ${result.metrics.space_saved_mb ?? 0} MB saved, DB now ${result.metrics.size_after_mb ?? 0} MB`
    );
  }

  async onFailure(error: Error): Promise<void> {
    console.error(`[CleanupStaleDataJob] Failed: ${error.message}`);
  }
}
