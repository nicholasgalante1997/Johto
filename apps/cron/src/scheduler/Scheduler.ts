import type { Database } from 'bun:sqlite';
import type { Pool } from 'pg';

import type { Job } from './Job';
import { JobRunner } from './JobRunner';
import { CronParser } from './CronParser';
import type {
  SchedulerConfig,
  SchedulerStatus,
  JobResult,
  JobContext,
  CronSchedule,
} from './types';
import { createLogger, createCollectingLogger } from '../utils/logger';
import { MetricsCollectorImpl } from '../utils/metrics';
import { JobAlreadyRegisteredError, JobNotFoundError } from '../utils/errors';
import { sqlite, postgres } from '@pokemon/database';

/**
 * Internal representation of a registered job.
 */
interface RegisteredJob {
  job: Job;
  schedule: CronSchedule;
  lastRun?: Date;
  nextRun: Date;
}

/**
 * Default scheduler configuration.
 */
const DEFAULT_CONFIG: SchedulerConfig = {
  timezone: 'America/Denver',
  maxConcurrentJobs: 3,
  defaultRetryAttempts: 3,
  defaultRetryDelayMs: 60_000,
  enableMetrics: true,
};

/**
 * Main scheduler engine that manages job lifecycle, scheduling, and execution.
 */
export class Scheduler {
  private readonly config: SchedulerConfig;
  private readonly jobs: Map<string, RegisteredJob> = new Map();
  private readonly runner: JobRunner;
  private readonly logger = createLogger('cron:scheduler');

  private running = false;
  private tickInterval: Timer | null = null;
  private runningJobs: Set<string> = new Set();
  private lastResults: Map<string, JobResult> = new Map();
  private startTime: Date | null = null;
  private abortController: AbortController | null = null;

  // Database connections
  private sqliteDb: Database | null = null;
  private pgPool: Pool | null = null;

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.runner = new JobRunner({
      onRetry: (attempt, error, jobName) => {
        this.logger.warn(
          'Job %s retry attempt %d after error: %s',
          jobName,
          attempt,
          error.message
        );
      },
    });
  }

  /**
   * Register a job with the scheduler.
   *
   * @throws JobAlreadyRegisteredError if a job with the same name exists
   */
  register(job: Job): void {
    if (this.jobs.has(job.config.name)) {
      throw new JobAlreadyRegisteredError(job.config.name);
    }

    // Validate cron expression
    const schedule = CronParser.parse(job.config.schedule);
    const nextRun = CronParser.getNextRunTime(schedule);

    this.jobs.set(job.config.name, { job, schedule, nextRun });
    this.logger.info(
      'Registered job: %s (schedule: %s, next run: %s)',
      job.config.name,
      job.config.schedule,
      nextRun.toISOString()
    );
  }

  /**
   * Start the scheduler.
   *
   * @throws Error if already running
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new Error('Scheduler is already running');
    }

    this.logger.info('Starting scheduler...');

    // Initialize database connections
    await this.initializeDatabases();

    this.running = true;
    this.startTime = new Date();
    this.abortController = new AbortController();

    // Run startup jobs
    await this.runStartupJobs();

    // Start the tick loop (check every minute)
    this.tickInterval = setInterval(() => this.tick(), 60_000);

    // Run first tick immediately
    await this.tick();

    this.logger.info('Scheduler started with %d jobs', this.jobs.size);
  }

  /**
   * Stop the scheduler gracefully.
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.logger.info('Stopping scheduler...');

    // Clear the tick interval
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    // Signal all running jobs to abort
    if (this.abortController) {
      this.abortController.abort();
    }

    // Wait for running jobs to complete (with timeout)
    const waitStart = Date.now();
    const maxWait = 30_000; // 30 seconds

    while (this.runningJobs.size > 0 && Date.now() - waitStart < maxWait) {
      this.logger.info(
        'Waiting for %d jobs to complete...',
        this.runningJobs.size
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (this.runningJobs.size > 0) {
      this.logger.warn(
        'Forcefully stopping with %d jobs still running',
        this.runningJobs.size
      );
    }

    // Close database connections
    await this.closeDatabases();

    this.running = false;
    this.logger.info('Scheduler stopped');
  }

  /**
   * Run a specific job immediately (for CLI usage).
   *
   * @throws JobNotFoundError if the job doesn't exist
   */
  async runNow(jobName: string): Promise<JobResult> {
    const registered = this.jobs.get(jobName);
    if (!registered) {
      throw new JobNotFoundError(jobName);
    }

    // Ensure databases are initialized
    if (!this.sqliteDb || !this.pgPool) {
      await this.initializeDatabases();
    }

    // Create a new abort controller for this single run
    const controller = new AbortController();
    return this.executeJob(registered, controller);
  }

  /**
   * Get current scheduler status.
   */
  getStatus(): SchedulerStatus {
    return {
      running: this.running,
      registeredJobs: Array.from(this.jobs.keys()),
      runningJobs: Array.from(this.runningJobs),
      lastExecutions: new Map(this.lastResults),
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
    };
  }

  /**
   * Get the last result for a specific job.
   */
  getLastResult(jobName: string): JobResult | undefined {
    return this.lastResults.get(jobName);
  }

  /**
   * Get all registered job configurations.
   */
  getJobConfigs() {
    return Array.from(this.jobs.values()).map((r) => ({
      ...r.job.config,
      lastRun: r.lastRun,
      nextRun: r.nextRun,
    }));
  }

  /**
   * Main tick - check and run due jobs.
   */
  private async tick(): Promise<void> {
    const now = new Date();

    for (const [name, registered] of this.jobs) {
      // Skip disabled jobs
      if (!registered.job.config.enabled) {
        continue;
      }

      // Skip if already running and exclusive
      if (registered.job.config.exclusive && this.runningJobs.has(name)) {
        continue;
      }

      // Check if job is due
      if (now >= registered.nextRun) {
        // Check dependencies
        if (!this.areDependenciesMet(registered.job)) {
          this.logger.debug('Job %s skipped - dependencies not met', name);
          continue;
        }

        // Check concurrent job limit
        if (this.runningJobs.size >= this.config.maxConcurrentJobs) {
          this.logger.debug(
            'Job %s deferred - max concurrent jobs reached',
            name
          );
          continue;
        }

        // Execute job (don't await - run in background)
        this.executeJob(registered, this.abortController!).catch((error) => {
          this.logger.error(
            'Job %s failed: %s',
            name,
            error instanceof Error ? error.message : error
          );
        });
      }
    }
  }

  /**
   * Execute a job and update state.
   */
  private async executeJob(
    registered: RegisteredJob,
    abortController: AbortController
  ): Promise<JobResult> {
    const { job, schedule } = registered;
    const name = job.config.name;

    this.runningJobs.add(name);
    this.logger.info('Starting job: %s', name);

    try {
      const context = this.createJobContext(name, abortController);
      const result = await this.runner.run(job, context);

      this.lastResults.set(name, result);
      registered.lastRun = new Date();
      registered.nextRun = CronParser.getNextRunTime(schedule);

      if (result.success) {
        this.logger.info(
          'Job %s completed successfully in %dms',
          name,
          result.durationMs
        );
      } else {
        this.logger.error('Job %s failed: %s', name, result.error?.message);
      }

      return result;
    } finally {
      this.runningJobs.delete(name);
    }
  }

  /**
   * Create execution context for a job.
   */
  private createJobContext(
    jobName: string,
    abortController: AbortController
  ): JobContext {
    const logs: string[] = [];
    return {
      logger: createCollectingLogger(`cron:job:${jobName}`, logs),
      metrics: new MetricsCollectorImpl(),
      sqliteDb: this.sqliteDb!,
      pgPool: this.pgPool!,
      abortSignal: abortController.signal,
    };
  }

  /**
   * Check if all dependencies for a job have completed successfully today.
   */
  private areDependenciesMet(job: Job): boolean {
    const deps = job.config.dependsOn ?? [];
    const today = new Date().toDateString();

    for (const depName of deps) {
      const lastResult = this.lastResults.get(depName);
      if (!lastResult) {
        return false;
      }
      // Check if dependency ran successfully today
      if (
        lastResult.completedAt.toDateString() !== today ||
        !lastResult.success
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Run jobs marked with runOnStartup.
   */
  private async runStartupJobs(): Promise<void> {
    const startupJobs = Array.from(this.jobs.values()).filter(
      (r) => r.job.config.runOnStartup && r.job.config.enabled
    );

    if (startupJobs.length === 0) {
      return;
    }

    this.logger.info('Running %d startup jobs...', startupJobs.length);

    for (const registered of startupJobs) {
      try {
        await this.executeJob(registered, this.abortController!);
      } catch (error) {
        this.logger.error(
          'Startup job %s failed: %s',
          registered.job.config.name,
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  /**
   * Initialize database connections.
   */
  private async initializeDatabases(): Promise<void> {
    const dbPath =
      process.env.DATABASE_PATH ?? './database/pokemon-data.sqlite3.db';

    try {
      this.sqliteDb = sqlite.createDatabase(dbPath, {
        create: true,
        readwrite: true,
      });

      // Initialize schema if needed
      sqlite.initSchema(this.sqliteDb);

      this.logger.info('SQLite database initialized: %s', dbPath);
    } catch (error) {
      this.logger.warn(
        'Failed to initialize SQLite: %s',
        error instanceof Error ? error.message : error
      );
      // Create an in-memory database as fallback
      this.sqliteDb = sqlite.createDatabase(':memory:');
      sqlite.initSchema(this.sqliteDb);
    }

    try {
      this.pgPool = postgres.getPool();
      this.logger.info('PostgreSQL pool initialized');
    } catch (error) {
      this.logger.warn(
        'Failed to initialize PostgreSQL: %s',
        error instanceof Error ? error.message : error
      );
      // PostgreSQL is optional for some jobs
      this.pgPool = null as unknown as Pool;
    }
  }

  /**
   * Close database connections.
   */
  private async closeDatabases(): Promise<void> {
    if (this.sqliteDb) {
      try {
        this.sqliteDb.close();
      } catch (error) {
        this.logger.warn(
          'Error closing SQLite: %s',
          error instanceof Error ? error.message : error
        );
      }
      this.sqliteDb = null;
    }

    if (this.pgPool) {
      try {
        await this.pgPool.end();
      } catch (error) {
        this.logger.warn(
          'Error closing PostgreSQL: %s',
          error instanceof Error ? error.message : error
        );
      }
      this.pgPool = null;
    }

    this.logger.info('Database connections closed');
  }
}
