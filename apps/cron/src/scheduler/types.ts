import type { Database } from 'bun:sqlite';
import type { Pool } from 'pg';

/**
 * Configuration for the scheduler engine.
 */
export interface SchedulerConfig {
  /** Timezone for cron schedule evaluation (e.g., 'America/New_York') */
  timezone: string;
  /** Maximum number of jobs that can run concurrently */
  maxConcurrentJobs: number;
  /** Default number of retry attempts for failed jobs */
  defaultRetryAttempts: number;
  /** Default delay between retry attempts in milliseconds */
  defaultRetryDelayMs: number;
  /** Whether to collect and report job metrics */
  enableMetrics: boolean;
}

/**
 * Configuration for an individual job.
 */
export interface JobConfig {
  /** Unique identifier for the job */
  name: string;
  /** Human-readable description of what the job does */
  description: string;
  /** Cron expression defining when the job runs (e.g., '0 2 * * *') */
  schedule: string;
  /** Whether the job is enabled and should be scheduled */
  enabled: boolean;
  /** Maximum execution time in milliseconds before the job is cancelled */
  timeout: number;
  /** Number of retry attempts if the job fails */
  retryAttempts: number;
  /** Delay between retry attempts in milliseconds */
  retryDelayMs: number;
  /** Names of jobs that must complete successfully before this job runs */
  dependsOn?: string[];
  /** Whether to run this job immediately when the scheduler starts */
  runOnStartup?: boolean;
  /** Whether to prevent concurrent executions of this job */
  exclusive?: boolean;
}

/**
 * Execution context provided to jobs during execution.
 */
export interface JobContext {
  /** Logger instance scoped to the job */
  logger: JobLogger;
  /** Metrics collector for the job */
  metrics: MetricsCollector;
  /** SQLite database connection */
  sqliteDb: Database;
  /** PostgreSQL connection pool */
  pgPool: Pool;
  /** Abort signal to check for cancellation */
  abortSignal: AbortSignal;
}

/**
 * Logger interface for job execution.
 */
export interface JobLogger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

/**
 * Metrics collector interface for job instrumentation.
 */
export interface MetricsCollector {
  /** Increment a counter metric */
  increment(name: string, value?: number): void;
  /** Set a gauge metric to a specific value */
  gauge(name: string, value: number): void;
  /** Record a timing metric in milliseconds */
  timing(name: string, durationMs: number): void;
  /** Get all collected metrics */
  getMetrics(): Record<string, number>;
}

/**
 * Result of a job execution.
 */
export interface JobResult {
  /** Whether the job completed successfully */
  success: boolean;
  /** Name of the job that was executed */
  jobName: string;
  /** When the job started executing */
  startedAt: Date;
  /** When the job finished executing */
  completedAt: Date;
  /** Total execution time in milliseconds */
  durationMs: number;
  /** Metrics collected during execution */
  metrics: Record<string, number>;
  /** Log messages collected during execution */
  logs: string[];
  /** Error that caused the job to fail, if any */
  error?: Error;
}

/**
 * Current status of the scheduler.
 */
export interface SchedulerStatus {
  /** Whether the scheduler is currently running */
  running: boolean;
  /** Names of all registered jobs */
  registeredJobs: string[];
  /** Names of currently executing jobs */
  runningJobs: string[];
  /** Most recent execution result for each job */
  lastExecutions: Map<string, JobResult>;
  /** Time in milliseconds since the scheduler started */
  uptime: number;
}

/**
 * Parsed representation of a cron expression.
 */
export interface CronSchedule {
  /** Valid minute values (0-59) */
  minute: number[];
  /** Valid hour values (0-23) */
  hour: number[];
  /** Valid day-of-month values (1-31) */
  dayOfMonth: number[];
  /** Valid month values (1-12) */
  month: number[];
  /** Valid day-of-week values (0-6, Sunday = 0) */
  dayOfWeek: number[];
}

/**
 * Possible states for a job execution.
 */
export type JobState =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Tracking information for a job execution.
 */
export interface JobExecution {
  /** Name of the job being executed */
  jobName: string;
  /** Current state of the execution */
  state: JobState;
  /** When the execution started */
  startedAt?: Date;
  /** When the execution completed */
  completedAt?: Date;
  /** Current retry attempt number (1-based) */
  attempt: number;
  /** Result of the execution, if completed */
  result?: JobResult;
}
