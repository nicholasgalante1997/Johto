/**
 * Base error class for job-related errors.
 */
export class JobError extends Error {
  constructor(
    public readonly jobName: string,
    message: string
  ) {
    super(message);
    this.name = 'JobError';
  }
}

/**
 * Thrown when a job exceeds its configured timeout.
 */
export class JobTimeoutError extends JobError {
  constructor(jobName: string, timeoutMs: number) {
    super(jobName, `Job "${jobName}" exceeded timeout of ${timeoutMs}ms`);
    this.name = 'JobTimeoutError';
  }
}

/**
 * Thrown when a job is cancelled via the abort signal.
 */
export class JobCancelledError extends JobError {
  constructor(jobName: string) {
    super(jobName, `Job "${jobName}" was cancelled`);
    this.name = 'JobCancelledError';
  }
}

/**
 * Thrown when a job cannot run due to unmet dependencies.
 */
export class DependencyError extends JobError {
  constructor(jobName: string, missingDeps: string[]) {
    super(
      jobName,
      `Job "${jobName}" has unmet dependencies: ${missingDeps.join(', ')}`
    );
    this.name = 'DependencyError';
  }
}

/**
 * Thrown when an invalid cron expression is provided.
 */
export class CronParseError extends Error {
  constructor(
    public readonly expression: string,
    message: string
  ) {
    super(`Invalid cron expression "${expression}": ${message}`);
    this.name = 'CronParseError';
  }
}

/**
 * Thrown when a job is not found in the registry.
 */
export class JobNotFoundError extends Error {
  constructor(jobName: string) {
    super(`Job "${jobName}" not found`);
    this.name = 'JobNotFoundError';
  }
}

/**
 * Thrown when a job is already registered with the same name.
 */
export class JobAlreadyRegisteredError extends Error {
  constructor(jobName: string) {
    super(`Job "${jobName}" is already registered`);
    this.name = 'JobAlreadyRegisteredError';
  }
}
