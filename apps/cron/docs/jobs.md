# Job System

Jobs are the core work units in the cron service. Each job encapsulates a specific task with its own schedule, timeout, retry logic, and execution code.

## Job Base Class

All jobs extend the abstract `Job` class:

```typescript
import { Job, JobConfig, JobContext, JobResult } from '../scheduler';

export class MyCustomJob extends Job {
  config: JobConfig = {
    name: 'my-custom-job',
    schedule: '0 * * * *',      // Every hour
    timeout: 5 * 60 * 1000,     // 5 minutes
    retryAttempts: 2,
    retryDelay: 30000,
    exclusive: true,
    dependsOn: [],
    runOnStartup: false
  };

  async run(context: JobContext): Promise<void> {
    const { logger, metrics, sqlite, postgres, signal } = context;

    logger.info('Starting my custom job');
    metrics.increment('items_processed', 10);

    // Check for cancellation
    if (signal.aborted) {
      throw new JobCancelledError(this.config.name);
    }

    // Job logic here...
  }
}
```

## JobConfig Interface

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Unique identifier for the job |
| `schedule` | string | Yes | Cron expression (5 fields) |
| `timeout` | number | No | Max execution time in ms (default: 5 min) |
| `retryAttempts` | number | No | Number of retry attempts (default: 3) |
| `retryDelay` | number | No | Delay between retries in ms (default: 60s) |
| `exclusive` | boolean | No | Block other exclusive jobs (default: true) |
| `dependsOn` | string[] | No | Jobs that must complete first |
| `runOnStartup` | boolean | No | Run immediately on scheduler start |

## JobContext Interface

The context provides everything a job needs to execute:

```typescript
interface JobContext {
  // Logging
  logger: JobLogger;

  // Metrics collection
  metrics: MetricsCollector;

  // Database connections
  sqlite: SqliteConnection | null;
  postgres: PostgresConnection | null;

  // Cancellation signal
  signal: AbortSignal;

  // Configuration
  config: AppConfig;
}
```

### Logger

```typescript
context.logger.debug('Debug message');
context.logger.info('Info message');
context.logger.warn('Warning message');
context.logger.error('Error message');

// Printf-style formatting
context.logger.info('Processed %d items in %s', count, duration);
```

### Metrics

```typescript
// Counter - increment by value
context.metrics.increment('cards_synced', 50);

// Gauge - set to specific value
context.metrics.gauge('health_score', 95);

// Timing - record duration in ms
context.metrics.timing('sync_duration', 1234);

// Get all metrics
const allMetrics = context.metrics.getMetrics();
```

### Database Access

```typescript
// SQLite operations
const sets = await context.sqlite.getSets();
await context.sqlite.insertCard(card);

// PostgreSQL operations (if configured)
if (context.postgres) {
  await context.postgres.insertSet(set);
}
```

## Available Jobs

The cron service includes 8 built-in jobs organized into three categories:

### Data Synchronization

| Job | Schedule | Timeout | Description |
|-----|----------|---------|-------------|
| [`sync-missing-sets`](jobs-sync.md#sync-missing-sets) | `0 2 * * *` | 5 min | Sync Pokemon TCG sets |
| [`sync-missing-cards`](jobs-sync.md#sync-missing-cards) | `0 3 * * *` | 30 min | Sync missing cards |
| [`validate-data-integrity`](jobs-sync.md#validate-data-integrity) | `0 6 * * 0` | 10 min | Validate database integrity |

### Backup & Replication

| Job | Schedule | Timeout | Description |
|-----|----------|---------|-------------|
| [`backup-database`](jobs-backup.md#backup-database) | `0 0 * * *` | 5 min | Create database backups |
| [`rotate-backups`](jobs-backup.md#rotate-backups) | `0 1 * * *` | 1 min | Clean old backups |
| [`replicate-to-primary`](jobs-backup.md#replicate-to-primary) | `0 4 * * *` | 30 min | Sync to PostgreSQL |

### Health Monitoring

| Job | Schedule | Timeout | Description |
|-----|----------|---------|-------------|
| [`database-health-check`](jobs-health.md#database-health-check) | `*/15 * * * *` | 1 min | Monitor database health |
| [`cleanup-stale-data`](jobs-health.md#cleanup-stale-data) | `0 5 * * 0` | 10 min | Optimize database |

## Job Dependencies

Jobs can depend on other jobs, forming an execution chain:

```
00:00  backup-database
          │
01:00     ▼
       rotate-backups (depends on: backup-database)

02:00  sync-missing-sets
          │
03:00     ▼
       sync-missing-cards (depends on: sync-missing-sets)
          │
04:00     ▼
       replicate-to-primary (depends on: sync-missing-cards)
```

### Dependency Rules

1. Dependencies must complete **successfully** on the **same calendar day**
2. If a dependency fails, dependent jobs are **skipped**
3. Dependencies are checked at execution time, not registration

## Creating Custom Jobs

### Step 1: Create the Job File

```typescript
// src/jobs/custom/MyJob.ts
import { Job, JobConfig, JobContext } from '../../scheduler';

export class MyJob extends Job {
  config: JobConfig = {
    name: 'my-job',
    schedule: '0 */6 * * *',  // Every 6 hours
    timeout: 10 * 60 * 1000,
    retryAttempts: 2,
    retryDelay: 30000
  };

  async run(context: JobContext): Promise<void> {
    const { logger, metrics } = context;

    logger.info('Starting my job');

    try {
      // Your job logic here
      const result = await this.doWork(context);

      metrics.increment('items_processed', result.count);
      logger.info('Completed: %d items', result.count);

    } catch (error) {
      logger.error('Job failed: %s', error.message);
      throw error;
    }
  }

  private async doWork(context: JobContext) {
    // Implementation
    return { count: 0 };
  }
}
```

### Step 2: Register the Job

```typescript
// src/index.ts
import { MyJob } from './jobs/custom/MyJob';

const scheduler = new Scheduler(config);

// Register your job
scheduler.register(new MyJob());

await scheduler.start();
```

### Step 3: Export from Index

```typescript
// src/jobs/index.ts
export { MyJob } from './custom/MyJob';
```

## Best Practices

### Handle Cancellation

Always check the abort signal for long-running operations:

```typescript
async run(context: JobContext): Promise<void> {
  for (const item of items) {
    // Check for cancellation
    if (context.signal.aborted) {
      context.logger.warn('Job cancelled, stopping early');
      throw new JobCancelledError(this.config.name);
    }

    await this.processItem(item);
  }
}
```

### Use Batching

Process items in batches to manage memory and allow cancellation points:

```typescript
const BATCH_SIZE = 100;

for (let i = 0; i < items.length; i += BATCH_SIZE) {
  if (context.signal.aborted) break;

  const batch = items.slice(i, i + BATCH_SIZE);
  await this.processBatch(batch);

  context.metrics.increment('batches_processed');
}
```

### Log Progress

Provide meaningful progress updates:

```typescript
context.logger.info('Processing set %d of %d: %s',
  index + 1,
  totalSets,
  set.name
);
```

### Collect Metrics

Track meaningful metrics for monitoring:

```typescript
// Good metrics
metrics.increment('cards_synced', count);
metrics.gauge('health_score', score);
metrics.timing('query_duration', duration);

// Include totals and rates
metrics.gauge('total_sets', totalSets);
metrics.gauge('incomplete_sets', incompleteCount);
```

### Graceful Degradation

Handle partial failures gracefully:

```typescript
let successCount = 0;
let failCount = 0;

for (const item of items) {
  try {
    await this.processItem(item);
    successCount++;
  } catch (error) {
    failCount++;
    context.logger.warn('Failed to process item %s: %s',
      item.id,
      error.message
    );
  }
}

// Report both success and failure counts
context.metrics.increment('items_succeeded', successCount);
context.metrics.increment('items_failed', failCount);

// Fail the job if too many failures
if (failCount > successCount) {
  throw new Error(`Too many failures: ${failCount}/${items.length}`);
}
```
