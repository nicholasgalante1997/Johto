import type { Job } from './Job';
import type { JobContext, JobResult } from './types';
import { JobTimeoutError, JobCancelledError } from '../utils/errors';

/**
 * Options for job execution.
 */
export interface JobRunnerOptions {
  /** Callback invoked before each retry attempt */
  onRetry?: (attempt: number, error: Error, jobName: string) => void;
}

/**
 * Executes jobs with timeout, retry logic, and abort handling.
 */
export class JobRunner {
  private readonly options: JobRunnerOptions;

  constructor(options: JobRunnerOptions = {}) {
    this.options = options;
  }

  /**
   * Run a job with timeout and retry logic.
   *
   * @param job - The job to execute
   * @param context - The execution context
   * @returns The job result
   */
  async run(job: Job, context: JobContext): Promise<JobResult> {
    const { timeout, retryAttempts, retryDelayMs } = job.config;
    let lastError: Error | undefined;
    const totalAttempts = retryAttempts + 1;

    for (let attempt = 1; attempt <= totalAttempts; attempt++) {
      // Check if cancelled before starting
      if (context.abortSignal.aborted) {
        throw new JobCancelledError(job.config.name);
      }

      try {
        const result = await this.executeWithTimeout(job, context, timeout);

        // Call success hook if defined and execution succeeded
        if (result.success && job.onSuccess) {
          try {
            await job.onSuccess(result);
          } catch (hookError) {
            // Log but don't fail the job if the success hook fails
            context.logger.warn(
              'Success hook failed for job %s: %s',
              job.config.name,
              hookError instanceof Error ? hookError.message : hookError
            );
          }
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on cancellation
        if (error instanceof JobCancelledError) {
          throw error;
        }

        // Check if we have more retries
        const isLastAttempt = attempt === totalAttempts;
        if (!isLastAttempt) {
          context.logger.warn(
            'Job %s failed on attempt %d/%d: %s. Retrying in %dms...',
            job.config.name,
            attempt,
            totalAttempts,
            lastError.message,
            retryDelayMs
          );

          // Invoke retry callback if provided
          this.options.onRetry?.(attempt, lastError, job.config.name);

          // Wait before retrying
          await this.delay(retryDelayMs, context.abortSignal);
        }
      }
    }

    // All retries exhausted - call failure hook
    if (job.onFailure && lastError) {
      try {
        await job.onFailure(lastError, context);
      } catch (hookError) {
        // Log but continue if the failure hook fails
        context.logger.warn(
          'Failure hook failed for job %s: %s',
          job.config.name,
          hookError instanceof Error ? hookError.message : hookError
        );
      }
    }

    // Return failed result
    return {
      success: false,
      jobName: job.config.name,
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 0,
      metrics: {},
      logs: [
        `Job failed after ${totalAttempts} attempts: ${lastError?.message}`
      ],
      error: lastError
    };
  }

  /**
   * Execute a job with a timeout.
   */
  private async executeWithTimeout(
    job: Job,
    context: JobContext,
    timeoutMs: number
  ): Promise<JobResult> {
    return new Promise((resolve, reject) => {
      let settled = false;

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new JobTimeoutError(job.config.name, timeoutMs));
        }
      }, timeoutMs);

      // Listen for abort
      const abortHandler = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          reject(new JobCancelledError(job.config.name));
        }
      };

      context.abortSignal.addEventListener('abort', abortHandler, {
        once: true
      });

      // Execute the job
      job
        .execute(context)
        .then((result) => {
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            context.abortSignal.removeEventListener('abort', abortHandler);
            resolve(result);
          }
        })
        .catch((error) => {
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            context.abortSignal.removeEventListener('abort', abortHandler);
            reject(error);
          }
        });
    });
  }

  /**
   * Delay for a specified duration, respecting abort signal.
   */
  private delay(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new JobCancelledError('delay'));
        return;
      }

      const timeoutId = setTimeout(resolve, ms);

      const abortHandler = () => {
        clearTimeout(timeoutId);
        reject(new JobCancelledError('delay'));
      };

      signal.addEventListener('abort', abortHandler, { once: true });
    });
  }
}
