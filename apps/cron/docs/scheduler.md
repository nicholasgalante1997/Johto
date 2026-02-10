# Scheduler Engine

The Scheduler is the core engine that orchestrates job execution. It handles scheduling, dependencies, concurrency, and lifecycle management.

## Core Components

### Scheduler Class

The main orchestrator that manages job registration, scheduling, and execution.

```typescript
import { Scheduler } from './scheduler/Scheduler';

const scheduler = new Scheduler({
  timezone: 'America/New_York',
  maxConcurrentJobs: 3,
  defaultRetryAttempts: 3,
  defaultRetryDelay: 60000,
  metricsEnabled: true
});
```

### Configuration Options

| Option                 | Type    | Default            | Description                           |
| ---------------------- | ------- | ------------------ | ------------------------------------- |
| `timezone`             | string  | `America/New_York` | IANA timezone for schedule evaluation |
| `maxConcurrentJobs`    | number  | 3                  | Maximum jobs running simultaneously   |
| `defaultRetryAttempts` | number  | 3                  | Default retry count for failed jobs   |
| `defaultRetryDelay`    | number  | 60000              | Milliseconds between retry attempts   |
| `metricsEnabled`       | boolean | true               | Enable metrics collection             |

## Job Registration

Jobs are registered with the scheduler before starting:

```typescript
// Register individual jobs
scheduler.register(new SyncMissingSetsJob());
scheduler.register(new SyncMissingCardsJob());

// Or register multiple
scheduler.registerAll([
  new BackupDatabaseJob(),
  new RotateBackupsJob(),
  new DatabaseHealthCheckJob()
]);
```

### Registration Validation

The scheduler validates jobs during registration:

- **Unique names**: No duplicate job names allowed
- **Valid cron**: Cron expressions are parsed and validated
- **Dependency check**: Warns if dependencies reference unregistered jobs

## Schedule Evaluation

The scheduler evaluates schedules using a tick-based approach:

```
┌─────────────────────────────────────────────────────────────┐
│                    Every 60 Seconds                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Get current time in configured timezone                 │
│                                                             │
│  2. For each registered job:                                │
│     ├─ Parse cron expression                                │
│     ├─ Check if current time matches                        │
│     └─ If match, queue for execution                        │
│                                                             │
│  3. Check queued jobs against concurrency limit             │
│                                                             │
│  4. For jobs ready to run:                                  │
│     ├─ Verify dependencies are satisfied                    │
│     ├─ Check exclusive flag (no other job with same flag)   │
│     └─ Execute via JobRunner                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Dependency Resolution

Jobs can declare dependencies on other jobs:

```typescript
class SyncMissingCardsJob extends Job {
  config = {
    name: 'sync-missing-cards',
    schedule: '0 3 * * *',
    dependsOn: ['sync-missing-sets'] // Must complete first
  };
}
```

### Dependency Rules

1. **Same-day execution**: Dependencies must have succeeded on the same calendar day
2. **Transitive**: If A depends on B, and B depends on C, then A waits for both B and C
3. **Failure handling**: If a dependency fails, dependent jobs are skipped

### Dependency Example

```
sync-missing-sets (2:00 AM)
         │
         ▼
sync-missing-cards (3:00 AM, depends on sync-missing-sets)
         │
         ▼
replicate-to-primary (4:00 AM, depends on sync-missing-cards)
```

## Concurrency Control

### Max Concurrent Jobs

The scheduler limits how many jobs run simultaneously:

```typescript
// Only 3 jobs can run at once
const scheduler = new Scheduler({
  maxConcurrentJobs: 3
});
```

### Exclusive Jobs

Some jobs are marked as exclusive and cannot run with other exclusive jobs:

```typescript
class BackupDatabaseJob extends Job {
  config = {
    name: 'backup-database',
    exclusive: true // No other exclusive jobs while this runs
  };
}
```

Non-exclusive jobs (like health checks) can run alongside exclusive jobs:

```typescript
class DatabaseHealthCheckJob extends Job {
  config = {
    name: 'database-health-check',
    exclusive: false // Can run concurrently with anything
  };
}
```

## JobRunner

The JobRunner handles individual job execution with timeout and retry logic.

### Execution Flow

```
┌─────────────┐
│  Start Job  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Create AbortSignal │
│  Set timeout timer  │
└──────────┬──────────┘
       │
       ▼
┌─────────────────────┐     ┌─────────────┐
│   Execute job.run() │────▶│   Success   │
└──────────┬──────────┘     └─────────────┘
       │
       │ (error)
       ▼
┌─────────────────────┐     ┌─────────────┐
│  Retry available?   │─No─▶│   Failed    │
└──────────┬──────────┘     └─────────────┘
       │ Yes
       ▼
┌─────────────────────┐
│  Wait retry delay   │
└──────────┬──────────┘
       │
       └──────────▶ (back to Execute)
```

### Timeout Handling

Jobs have configurable timeouts:

```typescript
class SyncMissingCardsJob extends Job {
  config = {
    name: 'sync-missing-cards',
    timeout: 30 * 60 * 1000 // 30 minutes
  };

  async run(context: JobContext): Promise<void> {
    // Check for abort signal periodically
    if (context.signal.aborted) {
      throw new JobCancelledError('sync-missing-cards');
    }

    // ... job logic
  }
}
```

### Retry Logic

Failed jobs are automatically retried:

```typescript
class SyncMissingSetsJob extends Job {
  config = {
    name: 'sync-missing-sets',
    retryAttempts: 3, // Try 3 times total
    retryDelay: 60000 // Wait 1 minute between retries
  };
}
```

## CronParser

The CronParser handles cron expression parsing and matching.

### Supported Syntax

```typescript
const parser = new CronParser();

// Every minute
parser.parse('* * * * *');

// Every day at midnight
parser.parse('0 0 * * *');

// Every 15 minutes
parser.parse('*/15 * * * *');

// Weekdays at 9am
parser.parse('0 9 * * 1-5');

// First day of month at 6am
parser.parse('0 6 1 * *');
```

### Methods

```typescript
// Parse and validate
const schedule = parser.parse('0 2 * * *');

// Check if time matches
const matches = parser.matches(schedule, new Date());

// Get next run time
const nextRun = parser.getNextRun(schedule);

// Human-readable description
const desc = parser.describe(schedule);
// => "At 2:00 AM every day"
```

### Expression Fields

| Field        | Values      | Special Characters |
| ------------ | ----------- | ------------------ |
| Minute       | 0-59        | `*` `,` `-` `/`    |
| Hour         | 0-23        | `*` `,` `-` `/`    |
| Day of Month | 1-31        | `*` `,` `-` `/`    |
| Month        | 1-12        | `*` `,` `-` `/`    |
| Day of Week  | 0-6 (Sun=0) | `*` `,` `-` `/`    |

## Graceful Shutdown

The scheduler handles shutdown gracefully:

```typescript
// Signal handlers in index.ts
process.on('SIGTERM', async () => {
  await scheduler.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await scheduler.stop();
  process.exit(0);
});
```

### Shutdown Sequence

1. **Stop accepting new jobs**: `running = false`
2. **Signal running jobs**: Abort controller is triggered
3. **Wait for completion**: Up to 30 seconds for jobs to finish
4. **Force terminate**: Any jobs still running are abandoned
5. **Close connections**: Database connections are closed

```typescript
async stop(): Promise<void> {
  this.logger.info('Stopping scheduler...');
  this.running = false;

  // Signal all running jobs to abort
  this.abortController.abort();

  // Wait for running jobs
  const timeout = 30000;
  await this.waitForRunningJobs(timeout);

  // Close database connections
  await this.sqlite?.close();
  await this.postgres?.close();

  this.logger.info('Scheduler stopped');
}
```

## Startup Jobs

Jobs can be configured to run immediately on scheduler start:

```typescript
class SyncMissingSetsJob extends Job {
  config = {
    name: 'sync-missing-sets',
    runOnStartup: true // Execute immediately when scheduler starts
  };
}
```

This is useful for:

- Catching up after downtime
- Ensuring data is synced before other jobs run
- Initial data population

## Metrics & Monitoring

The scheduler collects metrics for each job:

```typescript
interface JobResult {
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  metrics: Record<string, number>;
  logs: string[];
  error?: Error;
}
```

Access scheduler status:

```typescript
const status = scheduler.getStatus();
// {
//   running: true,
//   uptime: 3600000,
//   jobsRegistered: 8,
//   jobsRunning: 1,
//   lastResults: Map<jobName, JobResult>
// }
```
