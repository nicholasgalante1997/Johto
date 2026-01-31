import type { JobConfig, JobContext, JobResult, JobLogger } from './types';

/**
 * Abstract base class for all cron jobs.
 *
 * Jobs must implement:
 * - config: Static job configuration
 * - execute(): The actual job logic
 *
 * Jobs may optionally implement:
 * - onSuccess(): Called after successful execution
 * - onFailure(): Called after failed execution
 */
export abstract class Job {
  /**
   * Job configuration including schedule, timeout, retries, etc.
   */
  abstract readonly config: JobConfig;

  /**
   * Execute the job logic.
   *
   * @param context - Provides logger, metrics, database connections, abort signal
   * @returns JobResult with execution details and metrics
   */
  abstract execute(context: JobContext): Promise<JobResult>;

  /**
   * Called after successful job execution.
   * Use for cleanup, notifications, or follow-up actions.
   */
  async onSuccess?(result: JobResult): Promise<void>;

  /**
   * Called after job execution fails (all retries exhausted).
   * Use for error notifications or recovery actions.
   */
  async onFailure?(error: Error, context: JobContext): Promise<void>;

  /**
   * Create a standardized JobResult.
   *
   * @param startedAt - When the job started
   * @param metrics - Metrics collected during execution
   * @param logs - Log messages collected during execution
   * @param error - Error that caused failure, if any
   */
  protected createResult(
    startedAt: Date,
    metrics: Record<string, number>,
    logs: string[],
    error?: Error
  ): JobResult {
    const completedAt = new Date();
    return {
      success: !error,
      jobName: this.config.name,
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      metrics,
      logs,
      error
    };
  }

  /**
   * Helper to create a scoped logger that collects logs for the result.
   *
   * @param baseLogger - The base logger to wrap
   * @param logs - Array to collect log messages into
   */
  protected createScopedLogger(
    baseLogger: JobLogger,
    logs: string[]
  ): JobLogger {
    const addLog = (level: string, message: string, args: unknown[]) => {
      const timestamp = new Date().toISOString();
      const formattedMessage = this.formatMessage(message, args);
      logs.push(`[${timestamp}] [${level.toUpperCase()}] ${formattedMessage}`);
    };

    return {
      debug: (msg, ...args) => {
        addLog('debug', msg, args);
        baseLogger.debug(msg, ...args);
      },
      info: (msg, ...args) => {
        addLog('info', msg, args);
        baseLogger.info(msg, ...args);
      },
      warn: (msg, ...args) => {
        addLog('warn', msg, args);
        baseLogger.warn(msg, ...args);
      },
      error: (msg, ...args) => {
        addLog('error', msg, args);
        baseLogger.error(msg, ...args);
      }
    };
  }

  /**
   * Format a message with printf-style arguments.
   */
  private formatMessage(message: string, args: unknown[]): string {
    if (args.length === 0) {
      return message;
    }

    let argIndex = 0;
    return message.replace(/%[sdjoO]/g, (match) => {
      if (argIndex >= args.length) {
        return match;
      }

      const arg = args[argIndex++];

      switch (match) {
        case '%s':
          return String(arg);
        case '%d':
          return String(Number(arg));
        case '%j':
        case '%o':
        case '%O':
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        default:
          return match;
      }
    });
  }
}
