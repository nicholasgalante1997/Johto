import { Job } from '../../scheduler/Job';
import type { JobConfig, JobContext, JobResult } from '../../scheduler/types';
import { NotificationService } from '../../services/NotificationService';
import { statSync } from 'fs';

interface HealthMetrics {
  sqlite_connected: boolean;
  postgres_connected: boolean;
  sqlite_integrity_ok: boolean;
  sqlite_size_bytes: number;
  sqlite_wal_size_bytes: number;
  table_count: number;
  set_count: number;
  card_count: number;
  disk_space_available_mb: number;
}

/**
 * Monitors database health and alerts on issues.
 */
export class DatabaseHealthCheckJob extends Job {
  readonly config: JobConfig = {
    name: 'database-health-check',
    description: 'Monitor database health and alert on issues',
    schedule: '*/15 * * * *', // Every 15 minutes
    enabled: true,
    timeout: 60_000, // 1 minute
    retryAttempts: 1,
    retryDelayMs: 10_000,
    exclusive: false // Can run concurrently with other jobs
  };

  private readonly notificationService: NotificationService;
  private readonly thresholds = {
    maxDbSizeMB: 1000, // Alert if DB > 1GB
    minDiskSpaceMB: 500 // Alert if disk space < 500MB
  };

  constructor() {
    super();
    this.notificationService = new NotificationService();
  }

  async execute(context: JobContext): Promise<JobResult> {
    const startedAt = new Date();
    const logs: string[] = [];
    const metrics: Record<string, number> = {
      health_score: 100,
      issues_found: 0
    };

    const logger = this.createScopedLogger(context.logger, logs);
    const issues: string[] = [];

    try {
      logger.info('Starting database health check...');

      const health: HealthMetrics = {
        sqlite_connected: false,
        postgres_connected: false,
        sqlite_integrity_ok: false,
        sqlite_size_bytes: 0,
        sqlite_wal_size_bytes: 0,
        table_count: 0,
        set_count: 0,
        card_count: 0,
        disk_space_available_mb: 0
      };

      // Check SQLite connectivity
      try {
        const result = context.sqliteDb.query('SELECT 1 as test').get() as {
          test: number;
        };
        health.sqlite_connected = result?.test === 1;
        logger.info('SQLite connection: OK');
      } catch (error) {
        health.sqlite_connected = false;
        issues.push(
          `SQLite connection failed: ${error instanceof Error ? error.message : error}`
        );
        logger.error('SQLite connection: FAILED');
      }

      // Check SQLite integrity (quick check)
      if (health.sqlite_connected) {
        try {
          const result = context.sqliteDb.query('PRAGMA quick_check').get() as {
            quick_check: string;
          };
          health.sqlite_integrity_ok = result?.quick_check === 'ok';
          logger.info(
            'SQLite integrity: %s',
            health.sqlite_integrity_ok ? 'OK' : 'FAILED'
          );

          if (!health.sqlite_integrity_ok) {
            issues.push(
              `SQLite integrity check failed: ${result?.quick_check}`
            );
          }
        } catch (error) {
          health.sqlite_integrity_ok = false;
          issues.push(
            `SQLite integrity check error: ${error instanceof Error ? error.message : error}`
          );
        }
      }

      // Get SQLite database size
      try {
        const dbPath =
          process.env.DATABASE_PATH ?? './database/pokemon-data.sqlite3.db';
        const stats = statSync(dbPath);
        health.sqlite_size_bytes = stats.size;
        metrics.db_size_mb = Math.round(stats.size / 1024 / 1024);
        logger.info('SQLite size: %d MB', metrics.db_size_mb);

        if (metrics.db_size_mb > this.thresholds.maxDbSizeMB) {
          issues.push(
            `Database size (${metrics.db_size_mb} MB) exceeds threshold (${this.thresholds.maxDbSizeMB} MB)`
          );
        }

        // Check WAL file size
        try {
          const walStats = statSync(`${dbPath}-wal`);
          health.sqlite_wal_size_bytes = walStats.size;
          metrics.wal_size_mb = Math.round(walStats.size / 1024 / 1024);
          logger.info('WAL size: %d MB', metrics.wal_size_mb);
        } catch {
          // WAL file may not exist
          metrics.wal_size_mb = 0;
        }
      } catch (error) {
        logger.warn(
          'Could not get database file size: %s',
          error instanceof Error ? error.message : error
        );
      }

      // Get table counts
      if (health.sqlite_connected) {
        try {
          const tables = context.sqliteDb
            .query(
              "SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table'"
            )
            .get() as { cnt: number };
          health.table_count = tables.cnt;

          const sets = context.sqliteDb
            .query('SELECT COUNT(*) as cnt FROM pokemon_card_sets')
            .get() as { cnt: number };
          health.set_count = sets.cnt;
          metrics.set_count = sets.cnt;

          const cards = context.sqliteDb
            .query('SELECT COUNT(*) as cnt FROM pokemon_cards')
            .get() as { cnt: number };
          health.card_count = cards.cnt;
          metrics.card_count = cards.cnt;

          logger.info(
            'Data: %d sets, %d cards',
            health.set_count,
            health.card_count
          );
        } catch (error) {
          logger.warn(
            'Could not get table counts: %s',
            error instanceof Error ? error.message : error
          );
        }
      }

      // Check PostgreSQL connectivity
      try {
        if (context.pgPool) {
          const result = await context.pgPool.query('SELECT 1 as test');
          health.postgres_connected = result.rows[0]?.test === 1;
          logger.info('PostgreSQL connection: OK');
        } else {
          logger.info('PostgreSQL: not configured');
        }
      } catch (error) {
        health.postgres_connected = false;
        // PostgreSQL is optional, so just warn
        logger.warn(
          'PostgreSQL connection: FAILED (%s)',
          error instanceof Error ? error.message : error
        );
      }

      // Calculate health score
      let score = 100;
      if (!health.sqlite_connected) score -= 50;
      if (!health.sqlite_integrity_ok) score -= 30;
      if (!health.postgres_connected && process.env.POSTGRES_HOST) score -= 10;
      if (issues.length > 0) score -= issues.length * 5;

      metrics.health_score = Math.max(0, score);
      metrics.issues_found = issues.length;

      logger.info('Health score: %d/100', metrics.health_score);

      // Send alerts for issues
      if (issues.length > 0) {
        logger.warn('Health issues found: %d', issues.length);
        for (const issue of issues) {
          logger.warn('  - %s', issue);
        }

        // Send notification for critical issues
        if (score < 70) {
          await this.notificationService.sendHealthWarning(
            'Database Health Degraded',
            issues.join('\n'),
            metrics
          );
        }
      }

      context.metrics.gauge('health_score', metrics.health_score);
      context.metrics.gauge('set_count', metrics.set_count ?? 0);
      context.metrics.gauge('card_count', metrics.card_count ?? 0);

      return this.createResult(startedAt, metrics, logs);
    } catch (error) {
      logger.error(
        'Health check failed: %s',
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
    const score = result.metrics.health_score ?? 0;
    const level =
      score >= 90 ? 'HEALTHY' : score >= 70 ? 'DEGRADED' : 'UNHEALTHY';
    console.log(`[DatabaseHealthCheckJob] ${level} - Score: ${score}/100`);
  }

  async onFailure(error: Error): Promise<void> {
    console.error(`[DatabaseHealthCheckJob] Failed: ${error.message}`);
    await this.notificationService.sendJobFailureAlert(this.config.name, error);
  }
}
