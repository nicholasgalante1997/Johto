# Pokemon TCG Cron Service Implementation Plan

## Overview

Implement the `@pokemon/cron` service as specified in `apps/cron/CRON_SERVICE_SPEC.md`. A Bun/TypeScript background service for database maintenance, data synchronization, and health monitoring.

## Directory Structure

```
apps/cron/
├── src/
│   ├── index.ts                    # Service entry point
│   ├── cli.ts                      # CLI for manual job execution
│   ├── scheduler/
│   │   ├── index.ts                # Barrel exports
│   │   ├── Scheduler.ts            # Core scheduler engine
│   │   ├── Job.ts                  # Job base class
│   │   ├── JobRunner.ts            # Job execution with timeout/retry
│   │   ├── CronParser.ts           # Cron expression parser
│   │   └── types.ts                # TypeScript interfaces
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
│   │   ├── BackupService.ts
│   │   └── NotificationService.ts
│   ├── config/
│   │   ├── index.ts
│   │   ├── jobs.config.ts
│   │   └── types.ts
│   └── utils/
│       ├── logger.ts
│       ├── metrics.ts
│       └── errors.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Implementation Phases

### Phase 1: Core Scheduler Infrastructure

**Files to create:**

1. `apps/cron/package.json` - Package configuration with workspace dependencies
2. `apps/cron/tsconfig.json` - Extends `@pokemon/configs/typescript/bun.tsconfig.json`
3. `apps/cron/src/scheduler/types.ts` - Core type definitions:
   - `SchedulerConfig`, `JobConfig`, `JobContext`, `JobResult`
   - `CronSchedule`, `JobState`, `SchedulerStatus`
4. `apps/cron/src/scheduler/CronParser.ts` - Parse 5-field cron expressions
5. `apps/cron/src/scheduler/Job.ts` - Abstract base class with `config` and `execute()`
6. `apps/cron/src/scheduler/JobRunner.ts` - Execute jobs with timeout/retry logic
7. `apps/cron/src/scheduler/Scheduler.ts` - Main engine: register, start, stop, tick loop
8. `apps/cron/src/utils/logger.ts` - Wrap `@pokemon/logger`
9. `apps/cron/src/utils/metrics.ts` - `MetricsCollector` implementation
10. `apps/cron/src/utils/errors.ts` - `JobTimeoutError`, `JobCancelledError`
11. `apps/cron/src/index.ts` - Service entry point with graceful shutdown
12. `apps/cron/src/cli.ts` - CLI for `job:run`, `job:list`, `job:status`

### Phase 2: Data Synchronization Jobs

**Files to create:**

1. `apps/cron/src/jobs/sync/SyncMissingSetsJob.ts`
   - Schedule: `0 2 * * *` (daily 2 AM)
   - Uses `@pokemon/data.getSets()` as source of truth
   - Compares with `sqlite.findAllSets(db)()`
   - Inserts missing via `sqlite.insertSet(db)(...)`

2. `apps/cron/src/jobs/sync/SyncMissingCardsJob.ts`
   - Schedule: `0 3 * * *` (daily 3 AM)
   - Depends on: `sync-missing-sets`
   - Finds incomplete sets (card count < total)
   - Uses `@pokemon/data.getCardsInSet(setId)`
   - Batch inserts via `sqlite.insertCard(db)(...)`

3. `apps/cron/src/jobs/sync/ValidateDataIntegrityJob.ts`
   - Schedule: `0 6 * * 0` (weekly Sunday 6 AM)
   - Checks orphaned cards, duplicates, null required fields

4. `apps/cron/src/jobs/index.ts` - Job registry

### Phase 3: Database Backup & Replication

**Files to create:**

1. `apps/cron/src/services/BackupService.ts`
   - `Bun.file().copyTo()` for database copy
   - `Bun.gzipSync()` for compression
   - `Bun.CryptoHasher` for checksum

2. `apps/cron/src/jobs/backup/BackupDatabaseJob.ts`
   - Schedule: `0 0 * * *` (daily midnight)
   - Creates timestamped backup with verification

3. `apps/cron/src/jobs/backup/RotateBackupsJob.ts`
   - Schedule: `0 1 * * *` (daily 1 AM)
   - Retention: 7 daily, 4 weekly, 3 monthly

4. `apps/cron/src/jobs/backup/ReplicateToPrimaryJob.ts`
   - Schedule: `0 4 * * *` (daily 4 AM)
   - Depends on: `sync-missing-cards`
   - Uses `postgres.insertSet(pool, set)` and `postgres.insertCard(pool, card)`

### Phase 4: Health Monitoring

**Files to create:**

1. `apps/cron/src/services/NotificationService.ts`
   - Slack webhook integration
   - Alert severity levels

2. `apps/cron/src/jobs/health/DatabaseHealthCheckJob.ts`
   - Schedule: `*/15 * * * *` (every 15 min)
   - Connectivity, disk space, `PRAGMA integrity_check`

3. `apps/cron/src/jobs/health/CleanupStaleDataJob.ts`
   - Schedule: `0 5 * * 0` (weekly Sunday 5 AM)
   - `VACUUM` and `ANALYZE` commands

### Phase 5: Docker Integration

**Files to create:**

1. `apps/cron/Dockerfile` - Multi-stage Bun build
2. Update root `docker-compose.yml` - Add cron service

## Key Integration Points

### Database Usage (from @pokemon/database)

```typescript
import { sqlite, postgres } from '@pokemon/database';

// SQLite (curried functions)
const db = sqlite.createDatabase('./database/pokemon-data.sqlite3.db');
const sets = sqlite.findAllSets(db)();
const cards = sqlite.findCardsBySetId(db)(setId);
sqlite.insertSet(db)(
  id,
  name,
  series,
  printedTotal,
  total,
  legalities,
  ptcgoCode,
  releaseDate,
  updatedAt,
  images
);
sqlite.insertCard(db)(
  id,
  name,
  supertype,
  subtypes,
  hp,
  types,
  evolvesFrom,
  evolvesTo,
  rules,
  abilities,
  attacks,
  weaknesses,
  retreatCost,
  convertedRetreatCost,
  setId,
  number,
  artist,
  rarity,
  flavorText,
  nationalPokedexNumbers,
  legalities,
  images,
  tcgplayerUrl,
  cardmarketUrl
);

// PostgreSQL (takes Pokemon types directly)
const pool = postgres.getPool();
await postgres.insertSet(pool, pokemonSet);
await postgres.insertCard(pool, pokemonCard);
```

### Data Source (from @pokemon/data)

```typescript
import { getSets, getCardsInSet, getAllSetIds } from '@pokemon/data';

const allSets = await getSets(); // All 170 sets
const cards = await getCardsInSet('sv8'); // Cards in set
const setIds = await getAllSetIds(); // Array of IDs
```

### API Client (from @pokemon/clients) - for fresh data

```typescript
import { Pokedex } from '@pokemon/clients';

const client = new Pokedex();
for await (const set of client.getAllSets()) {
  /* ... */
}
for await (const card of client.getAllCardsInSet('sv8')) {
  /* ... */
}
```

## Critical Files to Reference

- `/home/nicks-dgx/dev/.Project-Johto/Pokemon/packages/@database/lib/sqlite.ts` - SQLite CRUD functions
- `/home/nicks-dgx/dev/.Project-Johto/Pokemon/packages/@database/lib/postgres.ts` - PostgreSQL insert functions
- `/home/nicks-dgx/dev/.Project-Johto/Pokemon/packages/@pokemon-data/index.js` - Local data access
- `/home/nicks-dgx/dev/.Project-Johto/Pokemon/packages/@clients/lib/models/PokemonTCGClient.ts` - Pokedex class
- `/home/nicks-dgx/dev/.Project-Johto/Pokemon/scripts/db-missing-cards.ts` - Reference for finding incomplete sets

## Verification

1. **Phase 1 verification:**

   ```bash
   cd apps/cron
   bun run check-types           # TypeScript compiles
   bun run job:list              # Lists all jobs
   bun run start                 # Scheduler starts, runs test tick
   # Press Ctrl+C - verify graceful shutdown
   ```

2. **Phase 2 verification:**

   ```bash
   bun run job:run sync-missing-sets   # Runs set sync
   bun run job:run sync-missing-cards  # Runs card sync (after sets)
   # Check SQLite database has new records
   ```

3. **Phase 3 verification:**

   ```bash
   bun run job:run backup-database     # Creates backup
   ls database/backups/                # Verify backup file exists
   bun run job:run replicate-to-primary # Syncs to PostgreSQL
   ```

4. **Phase 4 verification:**

   ```bash
   bun run job:run database-health-check  # Returns health metrics
   ```

5. **Integration verification:**
   ```bash
   docker compose up cron              # Runs in container
   docker logs pokemon-cron            # Check logs
   ```
