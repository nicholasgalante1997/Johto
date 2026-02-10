# System Architecture

The Cron Service is designed as a modular, fault-tolerant job scheduling system. This document covers the high-level architecture, component interactions, and design decisions.

## Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           Cron Service                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │                        Entry Point                            │      │
│   │                        (index.ts)                             │      │
│   │   • Initializes scheduler                                     │      │
│   │   • Registers all jobs                                        │      │
│   │   • Handles graceful shutdown (SIGTERM/SIGINT)                │      │
│   └──────────────────────────────────────────────────────────────┘      │
│                                   │                                      │
│                                   ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │                       Scheduler Engine                        │      │
│   │                       (Scheduler.ts)                          │      │
│   │   • Tick-based evaluation (every minute)                      │      │
│   │   • Dependency resolution                                     │      │
│   │   • Concurrent job limiting                                   │      │
│   │   • Database connection management                            │      │
│   └──────────────────────────────────────────────────────────────┘      │
│                          │              │                                │
│              ┌───────────┘              └───────────┐                    │
│              ▼                                      ▼                    │
│   ┌─────────────────────┐              ┌─────────────────────┐          │
│   │     CronParser      │              │     JobRunner       │          │
│   │   (CronParser.ts)   │              │   (JobRunner.ts)    │          │
│   │                     │              │                     │          │
│   │ • Parse expressions │              │ • Timeout handling  │          │
│   │ • Match schedules   │              │ • Retry logic       │          │
│   │ • Next run calc     │              │ • Abort signals     │          │
│   └─────────────────────┘              └─────────────────────┘          │
│                                                    │                     │
│                                                    ▼                     │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │                          Jobs                                 │      │
│   ├────────────────┬────────────────┬────────────────────────────┤      │
│   │     Sync       │    Backup      │         Health             │      │
│   ├────────────────┼────────────────┼────────────────────────────┤      │
│   │ MissingSets    │ BackupDatabase │ DatabaseHealthCheck        │      │
│   │ MissingCards   │ RotateBackups  │ CleanupStaleData           │      │
│   │ DataIntegrity  │ ReplicateToPg  │                            │      │
│   └────────────────┴────────────────┴────────────────────────────┘      │
│                                   │                                      │
│                                   ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │                        Services                               │      │
│   ├────────────────────────────┬─────────────────────────────────┤      │
│   │       BackupService        │      NotificationService        │      │
│   │ • Create backups           │ • Slack webhooks                │      │
│   │ • Compression (gzip)       │ • Severity filtering            │      │
│   │ • Retention policies       │ • Alert formatting              │      │
│   │ • Verification (SHA256)    │                                 │      │
│   └────────────────────────────┴─────────────────────────────────┘      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                            Data Layer                                     │
├───────────────────────────────────┬──────────────────────────────────────┤
│            SQLite                 │            PostgreSQL                 │
│   (pokemon-data.sqlite3.db)       │        (pokemon_tcg DB)              │
│                                   │                                       │
│   • Local data store              │   • Primary production database       │
│   • Fast reads/writes             │   • Replicated from SQLite            │
│   • Embedded, no server           │   • Shared with API service           │
│   • Used by sync jobs             │   • Full relational features          │
└───────────────────────────────────┴──────────────────────────────────────┘
```

## Component Details

### Entry Point (`index.ts`)

The main entry point orchestrates the entire service:

```typescript
// Simplified flow
const scheduler = new Scheduler(config);

// Register all jobs
scheduler.register(new SyncMissingSetsJob());
scheduler.register(new SyncMissingCardsJob());
// ... more jobs

// Start the scheduler
await scheduler.start();

// Graceful shutdown handlers
process.on('SIGTERM', () => scheduler.stop());
process.on('SIGINT', () => scheduler.stop());
```

Key responsibilities:

- Initialize the scheduler with configuration
- Register all job implementations
- Set up signal handlers for graceful shutdown
- Handle uncaught exceptions

### Scheduler Engine

The scheduler is the heart of the system. It:

1. **Ticks every minute** to evaluate which jobs should run
2. **Checks job dependencies** before execution
3. **Limits concurrent jobs** (default: 3)
4. **Manages database connections** (initializes on start, closes on stop)
5. **Tracks execution results** for dependency resolution

### Job Lifecycle

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ PENDING │───▶│ RUNNING │───▶│ SUCCESS │    │  FAILED │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                    │                              ▲
                    │         ┌─────────┐          │
                    └────────▶│ RETRYING│──────────┘
                              └─────────┘
```

1. **Pending**: Job is registered and waiting for its schedule
2. **Running**: Job is actively executing
3. **Success**: Job completed without errors
4. **Failed**: Job failed after all retry attempts
5. **Retrying**: Job failed but has retry attempts remaining

## Design Decisions

### Why SQLite + PostgreSQL?

The dual-database approach serves different purposes:

| Aspect         | SQLite                      | PostgreSQL                     |
| -------------- | --------------------------- | ------------------------------ |
| **Use Case**   | Local data ingestion        | Production queries             |
| **Speed**      | Very fast for single writes | Optimized for concurrent reads |
| **Complexity** | Zero configuration          | Requires server                |
| **Sync Jobs**  | Primary target              | Replication target             |
| **API Usage**  | Not used                    | Primary data source            |

### Why Bun?

Bun was chosen for:

- **Native TypeScript** - No transpilation step
- **Fast startup** - Critical for job execution
- **Built-in APIs** - File operations, compression, hashing
- **Package manager** - Faster than npm/yarn

### Cron Expression Format

We use standard 5-field cron expressions:

```
 ┌───────────── minute (0-59)
 │ ┌───────────── hour (0-23)
 │ │ ┌───────────── day of month (1-31)
 │ │ │ ┌───────────── month (1-12)
 │ │ │ │ ┌───────────── day of week (0-6, Sunday=0)
 │ │ │ │ │
 * * * * *
```

**Supported Syntax:**

- `*` - Any value
- `1,3,5` - List of values
- `1-5` - Range of values
- `*/15` - Step values
- `1-10/2` - Range with step

### Graceful Shutdown

The service handles shutdown gracefully:

```typescript
async stop(): Promise<void> {
  // 1. Stop accepting new jobs
  this.running = false;

  // 2. Signal running jobs to abort
  this.abortController.abort();

  // 3. Wait for running jobs (max 30 seconds)
  await this.waitForRunningJobs(30000);

  // 4. Close database connections
  await this.closeConnections();
}
```

## Data Flow

### Sync Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  @pokemon/data  │────▶│   Sync Jobs     │────▶│     SQLite      │
│  (JSON files)   │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │   PostgreSQL    │
                                                │ (via replicate) │
                                                └─────────────────┘
```

### Backup Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     SQLite      │────▶│  BackupService  │────▶│   .gz backup    │
│    database     │     │   (compress)    │     │     files       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │ RotateBackups   │
                        │ (retention)     │
                        └─────────────────┘
```

### Alert Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Health Check  │────▶│ Notification    │────▶│     Slack       │
│   (issues)      │     │ Service         │     │   Webhook       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │   Local Logs    │
                        │ (always logged) │
                        └─────────────────┘
```

## Security Considerations

- **Non-root Docker user**: The container runs as `cron` user
- **Environment secrets**: Sensitive config via environment variables
- **Backup verification**: SHA256 checksums for integrity
- **Connection pooling**: Database connections are properly managed

## Performance Characteristics

| Metric                    | Value            |
| ------------------------- | ---------------- |
| Tick interval             | 60 seconds       |
| Max concurrent jobs       | 3 (configurable) |
| Default job timeout       | 5 minutes        |
| Graceful shutdown timeout | 30 seconds       |
| Backup compression        | gzip             |
| Health check interval     | 15 minutes       |
