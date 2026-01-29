# @pokemon/cron

Background service for database maintenance, data synchronization, and health monitoring.

## Overview

A Bun/TypeScript cron scheduler that manages Pokemon TCG database operations including data sync from local sources, automated backups, PostgreSQL replication, and health monitoring.

## Installation

```bash
cd apps/cron
bun install
```

## Usage

### Start the Scheduler

```bash
# Production
bun run start

# Development (with hot reload)
bun run start:dev
```

### CLI Commands

```bash
bun run job:list              # List all registered jobs
bun run job:run <name>        # Run a job immediately
bun run job:run <name> --dry-run  # Preview without executing
bun run job:status <name>     # View job configuration
```

## Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `sync-missing-sets` | `0 2 * * *` | Sync sets from @pokemon/data to SQLite |
| `sync-missing-cards` | `0 3 * * *` | Sync cards for incomplete sets |
| `validate-data-integrity` | `0 6 * * 0` | Check orphans, duplicates, integrity |
| `backup-database` | `0 0 * * *` | Create compressed timestamped backup |
| `rotate-backups` | `0 1 * * *` | Manage backup retention policy |
| `replicate-to-primary` | `0 4 * * *` | Sync SQLite to PostgreSQL |
| `database-health-check` | `*/15 * * * *` | Monitor connectivity and health |
| `cleanup-stale-data` | `0 5 * * 0` | VACUUM, ANALYZE, optimize |

### Job Dependencies

```
sync-missing-sets
    └── sync-missing-cards
            └── replicate-to-primary

backup-database
    └── rotate-backups
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PATH` | `./database/pokemon-data.sqlite3.db` | SQLite database path |
| `BACKUP_DIR` | `./database/backups` | Backup storage directory |
| `CRON_TIMEZONE` | `America/New_York` | Timezone for schedules |
| `CRON_MAX_CONCURRENT` | `3` | Max concurrent jobs |
| `CRON_LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |
| `POSTGRES_HOST` | - | PostgreSQL host (optional) |
| `POSTGRES_USER` | - | PostgreSQL user |
| `POSTGRES_PASSWORD` | - | PostgreSQL password |
| `POSTGRES_DB` | - | PostgreSQL database |
| `NOTIFICATIONS_ENABLED` | `false` | Enable Slack notifications |
| `SLACK_WEBHOOK_URL` | - | Slack webhook URL |

## Architecture

```
src/
├── index.ts              # Service entry point
├── cli.ts                # CLI interface
├── scheduler/
│   ├── Scheduler.ts      # Core scheduler engine
│   ├── Job.ts            # Job base class
│   ├── JobRunner.ts      # Execution with timeout/retry
│   └── CronParser.ts     # Cron expression parser
├── jobs/
│   ├── sync/             # Data synchronization jobs
│   ├── backup/           # Backup and replication jobs
│   └── health/           # Health monitoring jobs
├── services/
│   ├── BackupService.ts  # Backup operations
│   └── NotificationService.ts  # Alert notifications
└── utils/
    ├── logger.ts         # Logging wrapper
    ├── metrics.ts        # Metrics collection
    └── errors.ts         # Custom error types
```

## Creating a Job

```typescript
import { Job } from '../scheduler/Job';
import type { JobConfig, JobContext, JobResult } from '../scheduler/types';

export class MyJob extends Job {
  readonly config: JobConfig = {
    name: 'my-job',
    description: 'Description of what the job does',
    schedule: '0 * * * *',  // Every hour
    enabled: true,
    timeout: 60_000,
    retryAttempts: 3,
    retryDelayMs: 10_000,
    dependsOn: [],          // Optional: job names that must complete first
    exclusive: true,        // Optional: prevent concurrent runs
  };

  async execute(context: JobContext): Promise<JobResult> {
    const startedAt = new Date();
    const logs: string[] = [];
    const metrics: Record<string, number> = {};
    const logger = this.createScopedLogger(context.logger, logs);

    // Job logic here
    logger.info('Processing...');

    return this.createResult(startedAt, metrics, logs);
  }
}
```

Register in `src/jobs/index.ts`:

```typescript
import { MyJob } from './path/to/MyJob';
export const allJobs: Job[] = [
  // ...existing jobs
  new MyJob(),
];
```

## Docker

```bash
# Build image
docker build -f apps/cron/Dockerfile -t pokemon-cron .

# Run with docker-compose
docker compose up cron
```

## Backup Retention Policy

- **Daily**: Last 7 backups retained
- **Weekly**: Last 4 Sunday backups retained
- **Monthly**: Last 3 first-of-month backups retained
- **Minimum**: 5 backups always kept

## Development

```bash
bun run check-types    # TypeScript validation
bun run start:dev      # Start with hot reload
```

## License

MIT
