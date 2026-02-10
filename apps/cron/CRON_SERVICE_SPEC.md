# Pokemon TCG Cron Service Specification

## Overview

A Bun/TypeScript background service that runs scheduled tasks for database maintenance, data synchronization, and system health monitoring. The service uses a declarative job configuration system with support for cron expressions, job dependencies, and failure recovery.

**Service Name:** `@pokemon/cron`
**Location:** `apps/cron/`
**Runtime:** Bun 1.3.5
**Language:** TypeScript (strict mode)

---

## Architecture

### High-Level Design

```
apps/cron/
├── src/
│   ├── index.ts                    # Service entry point
│   ├── scheduler/
│   │   ├── index.ts                # Scheduler exports
│   │   ├── Scheduler.ts            # Core scheduler engine
│   │   ├── Job.ts                  # Job base class
│   │   ├── JobRunner.ts            # Job execution engine
│   │   ├── CronParser.ts           # Cron expression parser
│   │   └── types.ts                # Scheduler types
│   ├── jobs/
│   │   ├── index.ts                # Job registry
│   │   ├── sync/
│   │   │   ├── SyncMissingSetsJob.ts
│   │   │   ├── SyncMissingCardsJob.ts
│   │   │   └── ValidateDataIntegrityJob.ts
│   │   ├── backup/
│   │   │   ├── BackupDatabaseJob.ts
│   │   │   ├── RotateBackupsJob.ts
│   │   │   └── ReplicateToPrimaryJob.ts
│   │   └── health/
│   │       ├── DatabaseHealthCheckJob.ts
│   │       └── CleanupStaleDataJob.ts
│   ├── services/
│   │   ├── BackupService.ts        # Backup operations
│   │   └── NotificationService.ts  # Alert notifications
│   ├── config/
│   │   ├── index.ts                # Config loader
│   │   ├── jobs.config.ts          # Job schedule definitions
│   │   └── types.ts                # Config types
│   └── utils/
│       ├── logger.ts               # Cron-specific logging
│       ├── metrics.ts              # Job metrics collection
│       └── errors.ts               # Custom error types
├── package.json
├── tsconfig.json
└── Dockerfile
```

### Core Components

#### 1. Scheduler Engine

The scheduler manages job lifecycle, scheduling, and execution:

```typescript
interface SchedulerConfig {
  timezone: string;
  maxConcurrentJobs: number;
  defaultRetryAttempts: number;
  defaultRetryDelayMs: number;
  enableMetrics: boolean;
}

interface Scheduler {
  register(job: Job): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  runNow(jobName: string): Promise<JobResult>;
  getStatus(): SchedulerStatus;
}
```

#### 2. Job Definition

Jobs are declarative units of work:

```typescript
interface JobConfig {
  name: string;
  description: string;
  schedule: string; // Cron expression
  enabled: boolean;
  timeout: number; // Max execution time (ms)
  retryAttempts: number;
  retryDelayMs: number;
  dependsOn?: string[]; // Jobs that must complete first
  runOnStartup?: boolean;
  exclusive?: boolean; // Prevent concurrent runs
}

abstract class Job {
  abstract config: JobConfig;
  abstract execute(context: JobContext): Promise<JobResult>;

  onSuccess?(result: JobResult): Promise<void>;
  onFailure?(error: Error): Promise<void>;
}
```

#### 3. Job Result

```typescript
interface JobResult {
  success: boolean;
  jobName: string;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  metrics: Record<string, number>;
  logs: string[];
  error?: Error;
}
```

---

## Job Definitions

### Data Synchronization Jobs

#### SyncMissingSetsJob

**Purpose:** Fetch sets missing from the database by comparing against the Pokemon TCG API.

**Schedule:** `0 2 * * *` (Daily at 2:00 AM)

**Behavior:**

1. Load all set IDs from `@pokemon/data` package
2. Query database for existing set IDs
3. Identify missing sets
4. Fetch missing set metadata from Pokemon TCG API
5. Insert new sets into `pokemon_card_sets` table
6. Log sync results

**Metrics:**

- `sets_checked`: Total sets compared
- `sets_missing`: Sets identified as missing
- `sets_synced`: Sets successfully added
- `sets_failed`: Sets that failed to sync

---

#### SyncMissingCardsJob

**Purpose:** Sync missing cards for each set by comparing actual count vs expected `total`.

**Schedule:** `0 3 * * *` (Daily at 3:00 AM)

**Dependencies:** `SyncMissingSetsJob`

**Behavior:**

1. Query all sets with `actual_count < expected_total`
2. For each incomplete set:
   a. Load cards from `@pokemon/data` package
   b. Query existing card IDs in database
   c. Identify missing card IDs
   d. Insert missing cards in batches of 100
3. Update set sync status
4. Generate completeness report

**Metrics:**

- `sets_processed`: Sets checked for missing cards
- `cards_missing`: Total cards identified as missing
- `cards_synced`: Cards successfully added
- `cards_failed`: Cards that failed to sync

**Configuration:**

```typescript
{
  batchSize: 100,
  maxSetsPerRun: 10,          // Limit sets processed per run
  prioritizeRecent: true,      // Sync newest sets first
  skipEmptySets: false
}
```

---

#### ValidateDataIntegrityJob

**Purpose:** Validate database integrity and flag data quality issues.

**Schedule:** `0 6 * * 0` (Weekly on Sunday at 6:00 AM)

**Behavior:**

1. Check for orphaned cards (cards without valid set_id)
2. Validate required fields are non-null
3. Check for duplicate card entries
4. Validate image URLs are accessible (sample check)
5. Generate integrity report
6. Alert on critical issues

**Metrics:**

- `orphaned_cards`: Cards without valid set
- `duplicate_cards`: Duplicate card entries
- `missing_fields`: Records with null required fields
- `broken_images`: Inaccessible image URLs

---

### Database Lifecycle Jobs

#### BackupDatabaseJob

**Purpose:** Create timestamped backup of the SQLite database.

**Schedule:** `0 0 * * *` (Daily at midnight)

**Behavior:**

1. Acquire database lock (prevent writes)
2. Copy database file to backup location
3. Compress backup with gzip
4. Calculate and store checksum
5. Release lock
6. Verify backup integrity

**Backup Location:** `database/backups/pokemon-data-{timestamp}.sqlite3.db.gz`

**Metrics:**

- `backup_size_bytes`: Compressed backup size
- `backup_duration_ms`: Time to complete backup
- `backup_verified`: Boolean verification result

---

#### RotateBackupsJob

**Purpose:** Manage backup retention by removing old backups.

**Schedule:** `0 1 * * *` (Daily at 1:00 AM)

**Dependencies:** `BackupDatabaseJob`

**Behavior:**

1. List all backups in backup directory
2. Apply retention policy:
   - Keep last 7 daily backups
   - Keep last 4 weekly backups (Sunday)
   - Keep last 3 monthly backups (1st of month)
3. Delete expired backups
4. Log deleted backup list

**Configuration:**

```typescript
{
  dailyRetention: 7,
  weeklyRetention: 4,
  monthlyRetention: 3,
  minimumBackups: 3            // Never delete below this count
}
```

---

#### ReplicateToPrimaryJob

**Purpose:** Sync SQLite data to PostgreSQL primary database.

**Schedule:** `0 4 * * *` (Daily at 4:00 AM)

**Dependencies:** `SyncMissingCardsJob`

**Behavior:**

1. Connect to PostgreSQL via `@pokemon/database`
2. Compare record counts between SQLite and PostgreSQL
3. Identify delta records (new/updated in SQLite)
4. Batch upsert to PostgreSQL
5. Verify row counts match
6. Update sync checkpoint

**Metrics:**

- `records_compared`: Total records checked
- `records_inserted`: New records added
- `records_updated`: Existing records updated
- `replication_lag_seconds`: Time since last sync

---

### Health Monitoring Jobs

#### DatabaseHealthCheckJob

**Purpose:** Monitor database health and alert on issues.

**Schedule:** `*/15 * * * *` (Every 15 minutes)

**Behavior:**

1. Test database connectivity
2. Check disk space usage
3. Verify table integrity (PRAGMA integrity_check)
4. Monitor query performance (sample queries)
5. Check connection pool health
6. Send alert if issues detected

**Alert Conditions:**

- Database unreachable
- Disk usage > 90%
- Integrity check failures
- Query latency > 5s

---

#### CleanupStaleDataJob

**Purpose:** Remove stale or temporary data.

**Schedule:** `0 5 * * 0` (Weekly on Sunday at 5:00 AM)

**Behavior:**

1. Clear expired cache entries
2. Remove orphaned temporary files
3. Vacuum database (reclaim space)
4. Update table statistics
5. Log cleanup results

---

## Configuration

### Environment Variables

```bash
# Service Configuration
CRON_TIMEZONE=America/New_York
CRON_LOG_LEVEL=info
CRON_METRICS_ENABLED=true

# Database (used by @pokemon/database sqlite module)
DATABASE_PATH=./database/pokemon-data.sqlite3.db

# PostgreSQL (used by @pokemon/database postgres module)
# Connection configured in postgres.ts via environment
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=user
POSTGRES_PASSWORD=pass
POSTGRES_DB=pokemon_tcg

# Backup
BACKUP_DIR=./database/backups
BACKUP_RETENTION_DAYS=30

# Pokemon TCG API (required by @pokemon/clients Pokedex class)
POKEMON_TCG_API_KEY=your-api-key

# Notifications
NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/...
NOTIFICATION_EMAIL=admin@example.com
```

### Job Configuration File

```typescript
// src/config/jobs.config.ts
export const jobConfigs: JobConfig[] = [
  {
    name: 'sync-missing-sets',
    description: 'Sync missing Pokemon TCG sets from API',
    schedule: '0 2 * * *',
    enabled: true,
    timeout: 300_000,
    retryAttempts: 3,
    retryDelayMs: 60_000,
    runOnStartup: false,
    exclusive: true
  },
  {
    name: 'sync-missing-cards',
    description: 'Sync missing cards for incomplete sets',
    schedule: '0 3 * * *',
    enabled: true,
    timeout: 1_800_000,
    retryAttempts: 2,
    retryDelayMs: 120_000,
    dependsOn: ['sync-missing-sets'],
    exclusive: true
  }
  // ... additional job configs
];
```

---

## Implementation Phases

### Phase 1: Core Scheduler Infrastructure

**Goal:** Establish the foundational scheduler engine and job execution framework.

**Tasks:**

1. **Initialize Project Structure**
   - Create `apps/cron/` directory structure
   - Configure `package.json` with dependencies
   - Set up `tsconfig.json` extending `@pokemon/configs`
   - Create Dockerfile for containerization

2. **Implement Scheduler Core**
   - `Scheduler.ts`: Main scheduler class with start/stop lifecycle
   - `CronParser.ts`: Parse and validate cron expressions
   - `JobRunner.ts`: Execute jobs with timeout and retry logic
   - `types.ts`: TypeScript interfaces and types

3. **Create Job Base Class**
   - Abstract `Job` class with config and execute method
   - Job context with logger and metrics
   - Success/failure hooks for notifications

4. **Add Configuration System**
   - Environment variable loading with validation
   - Job config file parsing
   - Runtime config overrides

5. **Implement Logging**
   - Integrate with `@pokemon/logger`
   - Job-specific log prefixes
   - Log rotation for cron logs

**Deliverables:**

- Working scheduler that can register and run jobs on schedule
- Test job that logs "Hello World" on a schedule
- CLI commands: `bun run start`, `bun run start:dev`

**Acceptance Criteria:**

- Scheduler starts and runs test job on configured schedule
- Jobs can be enabled/disabled via config
- Graceful shutdown on SIGTERM/SIGINT
- All TypeScript compiles with strict mode

---

### Phase 2: Data Synchronization Jobs

**Goal:** Implement jobs to sync missing sets and cards from source data.

**Dependencies:** Phase 1 complete

**External Dependencies:**

- `@pokemon/clients` - Pokemon TCG API client (`Pokedex` class)
- `@pokemon/database` - SQLite database module with curried query functions

**Tasks:**

1. **Integrate Existing Pokemon TCG API Client**
   - Import `Pokedex` from `@pokemon/clients`
   - Use `getAllSets()` async generator for set fetching
   - Use `getAllCardsInSet(setId)` async generator for card fetching
   - Add rate limiting wrapper to respect API limits
   - Handle `POKEMON_TCG_API_KEY` environment variable

2. **Implement SyncMissingSetsJob**
   - Load sets from `@pokemon/data` (local source of truth)
   - Query existing sets via `sqlite.findAllSets(db)()`
   - Calculate diff and sync missing
   - Optionally fetch fresh data via `Pokedex.getAllSets()` if local data stale
   - Insert new sets via `sqlite.insertSet(db)(...)`

3. **Implement SyncMissingCardsJob**
   - Query incomplete sets (count < total) via `sqlite.findAllSets(db)()`
   - Count cards per set via `sqlite.findCardsBySetId(db)(setId)`
   - Load cards from `@pokemon/data` per set (local source)
   - Optionally fetch via `Pokedex.getAllCardsInSet(setId)` for missing cards
   - Batch insert missing cards via `sqlite.insertCard(db)(...)`
   - Update set completion status

4. **Implement ValidateDataIntegrityJob**
   - Orphan detection queries
   - Duplicate detection
   - Required field validation
   - Integrity report generation

5. **Add Job Metrics**
   - Track records processed/synced/failed
   - Execution duration tracking
   - Success/failure rate calculation

**Pokedex Client Usage:**

```typescript
import { Pokedex, type Pokemon } from '@pokemon/clients';

const client = new Pokedex();

// Fetch all sets (async generator with pagination)
for await (const set of client.getAllSets()) {
  console.log(set.id, set.name, set.total);
}

// Fetch all cards in a set (async generator with pagination)
for await (const card of client.getAllCardsInSet('sv8')) {
  console.log(card.id, card.name);
}

// Search with query builder
const query = Pokedex.getQueryBuilder('card');
query.where('name', 'Charizard');
const result = await client.search(query);
```

**SQLite Database Usage:**

```typescript
import { sqlite } from '@pokemon/database';

// Create/open database connection
const db = sqlite.createDatabase('./database/pokemon-data.sqlite3.db', {
  create: false,
  readwrite: true
});

// Initialize schema (if needed)
sqlite.initSchema(db);

// Query functions (curried pattern)
const allSets = sqlite.findAllSets(db)();
const cardsInSet = sqlite.findCardsBySetId(db)('sv8');
const setById = sqlite.findSetById(db)('sv8');

// Insert functions (curried with prepared statements)
const doInsertSet = sqlite.insertSet(db);
doInsertSet(
  'sv8',                    // id
  'Surging Sparks',         // name
  'Scarlet & Violet',       // series
  191,                      // printedTotal
  250,                      // total
  JSON.stringify({...}),    // legalities (JSON string)
  'SV8',                    // ptcgoCode
  '2024/11/08',             // releaseDate
  '2024/12/01',             // updatedAt
  JSON.stringify({...})     // images (JSON string)
);

const doInsertCard = sqlite.insertCard(db);
doInsertCard(
  'sv8-1',                  // id
  'Exeggcute',              // name
  'Pokémon',                // supertype
  JSON.stringify(['Basic']), // subtypes (JSON string)
  30,                       // hp
  JSON.stringify(['Grass']), // types (JSON string)
  null,                     // evolvesFrom
  JSON.stringify(['Exeggutor']), // evolvesTo (JSON string)
  null,                     // rules
  null,                     // abilities
  JSON.stringify([...]),    // attacks (JSON string)
  JSON.stringify([...]),    // weaknesses (JSON string)
  JSON.stringify(['Colorless']), // retreatCost (JSON string)
  1,                        // convertedRetreatCost
  'sv8',                    // setId
  '1',                      // number
  'Artist Name',            // artist
  'Common',                 // rarity
  null,                     // flavorText
  JSON.stringify([102]),    // nationalPokedexNumbers (JSON string)
  JSON.stringify({...}),    // legalities (JSON string)
  JSON.stringify({...}),    // images (JSON string)
  'https://tcgplayer...',   // tcgplayerUrl
  'https://cardmarket...'   // cardmarketUrl
);

// Parse JSON fields when reading
const card = sqlite.findCardById(db)('sv8-1');
const parsedCard = sqlite.withJSONParsing(card, ['subtypes', 'types', 'attacks']);

// Close database when done
db.close();
```

**Deliverables:**

- Three working sync jobs
- Metrics dashboard data
- Sync status reporting

**Acceptance Criteria:**

- `SyncMissingSetsJob` identifies and syncs missing sets
- `SyncMissingCardsJob` fills in missing cards for incomplete sets
- Jobs respect dependencies (cards wait for sets)
- Metrics accurately reflect sync operations

---

### Phase 3: Database Backup & Replication

**Goal:** Implement database lifecycle management jobs.

**Dependencies:** Phase 1 complete

**External Dependencies:**

- `@pokemon/database` - SQLite and PostgreSQL modules
- `bun:sqlite` - Native Bun SQLite bindings (WAL mode enabled by default)

**Tasks:**

1. **Implement BackupService**
   - Use Bun's native file APIs for copy operations
   - Leverage SQLite WAL mode for consistent reads during backup
   - Gzip compression via `Bun.gzipSync()`
   - Checksum calculation via `Bun.CryptoHasher`
   - Backup verification by opening copy with `sqlite.createDatabase()`

2. **Implement BackupDatabaseJob**
   - Create timestamped backup using `Bun.file().copyTo()`
   - Compress with `Bun.gzipSync()` and store
   - Verify backup integrity with `PRAGMA integrity_check`
   - Report backup metrics

3. **Implement RotateBackupsJob**
   - Retention policy enforcement
   - Daily/weekly/monthly rotation
   - Minimum backup preservation
   - Deletion logging via `Bun.unlink()`

4. **Implement ReplicateToPrimaryJob**
   - Connect to PostgreSQL via `postgres.getPool()`
   - Read from SQLite via `sqlite.findAllSets(db)()` and `sqlite.findCardsBySetId(db)()`
   - Batch upsert to PostgreSQL via `postgres.insertSet()` and `postgres.insertCard()`
   - Sync checkpoint tracking

5. **Add Backup Monitoring**
   - Track backup sizes over time
   - Alert on backup failures
   - Verify backup recoverability

**Backup Service Usage:**

```typescript
import { sqlite, postgres } from '@pokemon/database';

// Backup SQLite database
const sourcePath = './database/pokemon-data.sqlite3.db';
const backupPath = `./database/backups/pokemon-data-${Date.now()}.sqlite3.db`;

// Copy database file (WAL mode ensures consistency)
const sourceFile = Bun.file(sourcePath);
await sourceFile.copyTo(backupPath);

// Compress backup
const backupData = await Bun.file(backupPath).arrayBuffer();
const compressed = Bun.gzipSync(new Uint8Array(backupData));
await Bun.write(`${backupPath}.gz`, compressed);

// Calculate checksum
const hasher = new Bun.CryptoHasher('sha256');
hasher.update(new Uint8Array(backupData));
const checksum = hasher.digest('hex');

// Verify backup integrity
const backupDb = sqlite.createDatabase(backupPath, { readonly: true });
const integrityCheck = backupDb.query('PRAGMA integrity_check').get();
backupDb.close();

// Replicate to PostgreSQL
const pgPool = postgres.getPool();
const db = sqlite.createDatabase(sourcePath, { readonly: true });
const sets = sqlite.findAllSets(db)();

for (const set of sets) {
  await postgres.insertSet(pgPool, set);
}
```

**Deliverables:**

- Automated daily backups
- Backup rotation with retention policy
- SQLite to PostgreSQL replication

**Acceptance Criteria:**

- Backups created and verified daily
- Old backups rotated per policy
- PostgreSQL contains synced data from SQLite
- Backup restore tested and documented

---

### Phase 4: Health Monitoring & Alerts

**Goal:** Implement health checks and notification system.

**Dependencies:** Phase 1 complete

**External Dependencies:**

- `@pokemon/database` - SQLite module for health checks

**Tasks:**

1. **Implement NotificationService**
   - Slack webhook integration
   - Email notification support
   - Alert severity levels
   - Rate limiting (prevent spam)

2. **Implement DatabaseHealthCheckJob**
   - Connectivity testing via `sqlite.createDatabase()`
   - Disk space monitoring via `Bun.file().size`
   - Integrity checks via `PRAGMA integrity_check`
   - Performance monitoring via sample queries

3. **Implement CleanupStaleDataJob**
   - Cache expiration
   - Temp file cleanup
   - Database vacuum via `VACUUM` command
   - Statistics update via `ANALYZE` command

**Health Check Usage:**

```typescript
import { sqlite } from '@pokemon/database';

// Test connectivity
const db = sqlite.createDatabase('./database/pokemon-data.sqlite3.db', {
  readonly: true
});

// Run integrity check
const integrity = db.query('PRAGMA integrity_check').get();
const isHealthy = integrity.integrity_check === 'ok';

// Check database size
const dbFile = Bun.file('./database/pokemon-data.sqlite3.db');
const sizeBytes = dbFile.size;
const sizeMB = sizeBytes / (1024 * 1024);

// Run sample query for latency check
const start = performance.now();
sqlite.findAllSets(db)();
const latencyMs = performance.now() - start;

// Vacuum database (cleanup job)
db.run('VACUUM');
db.run('ANALYZE');

db.close();
```

4. **Add Alert Configuration**
   - Alert thresholds configuration
   - Notification channel routing
   - Alert suppression rules
   - On-call schedule integration

5. **Create Health Dashboard Data**
   - Job execution history
   - Success/failure trends
   - System resource usage
   - Alert history

**Deliverables:**

- Health check job running every 15 minutes
- Slack/email alerts on failures
- Weekly cleanup job
- Health metrics API endpoint

**Acceptance Criteria:**

- Health checks detect simulated failures
- Alerts sent within 5 minutes of issue
- Cleanup job reclaims disk space
- No false positive alerts in production

---

### Phase 5: CLI & Operations

**Goal:** Add operational tooling for manual job management.

**Dependencies:** Phases 1-4 complete

**Tasks:**

1. **Create CLI Interface**
   - `bun run job:run <name>` - Run job manually
   - `bun run job:list` - List all jobs with status
   - `bun run job:status <name>` - Show job details
   - `bun run job:history <name>` - Show execution history

2. **Add Job Control**
   - Enable/disable jobs at runtime
   - Pause/resume scheduler
   - Force retry failed jobs
   - Cancel running jobs

3. **Implement Job History**
   - Persist execution history to database
   - Query history by job/date/status
   - Retention policy for history

4. **Add Dry Run Mode**
   - `--dry-run` flag for all jobs
   - Preview changes without executing
   - Validation-only mode

5. **Create Operational Runbooks**
   - Manual recovery procedures
   - Troubleshooting guide
   - Alert response playbook

**Deliverables:**

- Full CLI for job management
- Job execution history
- Dry run support
- Operations documentation

**Acceptance Criteria:**

- All CLI commands functional
- History persisted across restarts
- Dry run shows accurate preview
- Runbooks cover all failure scenarios

---

### Phase 6: Docker Integration & Deployment

**Goal:** Containerize service and integrate with existing infrastructure.

**Dependencies:** Phases 1-5 complete

**Tasks:**

1. **Create Dockerfile**
   - Multi-stage build for small image
   - Bun runtime base image
   - Non-root user execution
   - Health check endpoint

2. **Update docker-compose.yml**
   - Add cron service definition
   - Volume mounts for database/backups
   - Network configuration
   - Dependency ordering

3. **Add Container Health Checks**
   - HTTP health endpoint
   - Liveness probe
   - Readiness probe
   - Startup probe

4. **Configure Logging**
   - Structured JSON logging
   - Log aggregation ready
   - Log level configuration
   - Correlation IDs

5. **Production Configuration**
   - Environment-specific configs
   - Secrets management
   - Resource limits
   - Restart policies

**Deliverables:**

- Production-ready Docker image
- Updated docker-compose.yml
- Deployment documentation
- Monitoring integration

**Acceptance Criteria:**

- Container builds and runs successfully
- Health checks pass in container
- Logs aggregated properly
- Service restarts on failure

---

## Package Dependencies

```json
{
  "name": "@pokemon/cron",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "start": "bun run src/index.ts",
    "start:dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --outdir=dist --target=bun",
    "check-types": "tsc -p ./tsconfig.json --noEmit",
    "test": "bun test",
    "job:run": "bun run src/cli.ts run",
    "job:list": "bun run src/cli.ts list",
    "job:status": "bun run src/cli.ts status",
    "job:history": "bun run src/cli.ts history"
  },
  "dependencies": {
    "@pokemon/clients": "workspace:*",
    "@pokemon/database": "workspace:*",
    "@pokemon/data": "workspace:*",
    "@pokemon/logger": "workspace:*",
    "@pokemon/utils": "workspace:*"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "5.5.4"
  }
}
```

**Note:** The `@pokemon/clients` package provides the `Pokedex` class for Pokemon TCG API access:

- `Pokedex.getAllSets()` - Async generator for paginated set fetching
- `Pokedex.getAllCardsInSet(setId)` - Async generator for paginated card fetching
- `Pokedex.getQueryBuilder('card' | 'set')` - Query builder for search
- `Pokedex.search(query)` - Execute search queries

Requires `POKEMON_TCG_API_KEY` environment variable for authentication.

---

## Testing Strategy

### Unit Tests

- Cron expression parsing
- Job configuration validation
- Retry logic
- Backup rotation policy

### Integration Tests

- Database connection and queries
- Job execution with real database
- Backup/restore cycle
- Notification delivery

### End-to-End Tests

- Full sync workflow
- Backup and rotation cycle
- Alert triggering and delivery
- CLI command execution

---

## Success Metrics

| Metric                | Target                  |
| --------------------- | ----------------------- |
| Database completeness | > 99% of expected cards |
| Backup success rate   | 100%                    |
| Job success rate      | > 95%                   |
| Alert response time   | < 5 minutes             |
| Mean time to recovery | < 30 minutes            |

---

## Appendix: Cron Expression Reference

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday = 0)
│ │ │ │ │
* * * * *
```

**Examples:**

- `0 2 * * *` - Daily at 2:00 AM
- `*/15 * * * *` - Every 15 minutes
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 0 1 * *` - Monthly on the 1st at midnight
