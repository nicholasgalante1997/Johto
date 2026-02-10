# CLI Reference

The cron service includes a command-line interface for managing and running jobs manually.

## Commands Overview

```bash
bun run src/cli.ts <command> [options]

# Or via package.json scripts:
bun run job:run <name>
bun run job:list
bun run job:status [name]
```

## Available Commands

### job:run

Run a specific job immediately.

```bash
bun run job:run <job-name> [--dry-run]
```

**Arguments:**

- `<job-name>` - Name of the job to run (required)
- `--dry-run` - Preview execution without making changes

**Examples:**

```bash
# Run a sync job
bun run job:run sync-missing-sets

# Run with dry-run to preview
bun run job:run sync-missing-cards --dry-run

# Run health check
bun run job:run database-health-check

# Run backup manually
bun run job:run backup-database
```

**Output:**

```
Running job: sync-missing-sets
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[sync-missing-sets] Starting set synchronization
[sync-missing-sets] Loaded 150 sets from source
[sync-missing-sets] Found 148 existing sets in database
[sync-missing-sets] Identified 2 missing sets
[sync-missing-sets] Syncing: Scarlet & Violet—Surging Sparks
[sync-missing-sets] Syncing: Scarlet & Violet—Prismatic Evolutions
[sync-missing-sets] Completed: 2 sets synced, 0 failed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Job completed successfully

Duration: 1.23s
Metrics:
  sets_checked: 150
  sets_existing: 148
  sets_missing: 2
  sets_synced: 2
  sets_failed: 0
```

**Exit Codes:**

- `0` - Job completed successfully
- `1` - Job failed

---

### job:list

List all registered jobs with their status.

```bash
bun run job:list
```

**Output:**

```
Registered Jobs
═══════════════════════════════════════════════════════════════════

  Name                      Schedule           Status      Next Run
  ────────────────────────────────────────────────────────────────
  sync-missing-sets         0 2 * * *          Ready       02:00 AM
  sync-missing-cards        0 3 * * *          Ready       03:00 AM
  validate-data-integrity   0 6 * * 0          Ready       Sun 06:00 AM
  backup-database           0 0 * * *          Ready       00:00 AM
  rotate-backups            0 1 * * *          Ready       01:00 AM
  replicate-to-primary      0 4 * * *          Ready       04:00 AM
  database-health-check     */15 * * * *       Ready       In 7 min
  cleanup-stale-data        0 5 * * 0          Ready       Sun 05:00 AM

Total: 8 jobs
```

**Status Colors:**

- Green: Ready to run
- Yellow: Running
- Red: Failed last run
- Gray: Disabled

---

### job:status

Show detailed status of a specific job or overall scheduler status.

```bash
bun run job:status [job-name]
```

**Scheduler Status (no job name):**

```bash
bun run job:status
```

```
Cron Service Status
═══════════════════════════════════════════════════

  Status:           Running
  Uptime:           02:34:56
  Jobs Registered:  8
  Jobs Running:     0
  Last Check:       2025-01-15 14:30:00

Next Scheduled Jobs:
  database-health-check     in 7 minutes
  backup-database           in 9 hours 30 minutes
  rotate-backups            in 10 hours 30 minutes

Recent Executions:
  database-health-check     14:15  ✓ Success (1.2s)
  database-health-check     14:00  ✓ Success (1.1s)
  sync-missing-cards        03:00  ✓ Success (45.3s)
```

**Specific Job Status:**

```bash
bun run job:status sync-missing-cards
```

```
Job: sync-missing-cards
═══════════════════════════════════════════════════

Configuration:
  Schedule:       0 3 * * *
  Description:    At 03:00 AM every day
  Timeout:        30 minutes
  Retries:        2 attempts, 120s delay
  Exclusive:      Yes
  Dependencies:   sync-missing-sets

Status:
  State:          Ready
  Last Run:       2025-01-15 03:00:00
  Last Result:    Success
  Next Run:       2025-01-16 03:00:00 (in 12 hours)

Last Execution Metrics:
  sets_checked:        150
  sets_incomplete:     3
  sets_processed:      3
  cards_missing:       150
  cards_synced:        150
  cards_failed:        0
  duration_ms:         45320
```

---

## Job Names Reference

| Job Name                  | Description                 |
| ------------------------- | --------------------------- |
| `sync-missing-sets`       | Sync Pokemon TCG sets       |
| `sync-missing-cards`      | Sync missing cards          |
| `validate-data-integrity` | Validate database integrity |
| `backup-database`         | Create database backup      |
| `rotate-backups`          | Clean old backups           |
| `replicate-to-primary`    | Sync to PostgreSQL          |
| `database-health-check`   | Check database health       |
| `cleanup-stale-data`      | Optimize database           |

---

## Usage Examples

### Run Daily Maintenance Manually

```bash
# After deploying new data, run full sync
bun run job:run sync-missing-sets
bun run job:run sync-missing-cards
bun run job:run replicate-to-primary
```

### Check System Health

```bash
# Quick health check
bun run job:run database-health-check

# View detailed status
bun run job:status database-health-check
```

### Backup Before Major Changes

```bash
# Create backup
bun run job:run backup-database

# Verify backup was created
ls -la ./database/backups/
```

### Debug a Failing Job

```bash
# Run with debug logging
CRON_LOG_LEVEL=debug bun run job:run sync-missing-cards

# Dry run to see what would happen
bun run job:run sync-missing-cards --dry-run
```

---

## Environment Variables

The CLI respects these environment variables:

```bash
# Override log level for verbose output
CRON_LOG_LEVEL=debug bun run job:run <name>

# Use different database
DATABASE_PATH=./test.db bun run job:run <name>

# Override timezone
CRON_TIMEZONE=UTC bun run job:status
```

---

## Scripting and Automation

### Run from Crontab

If you want to run jobs from system cron instead of the built-in scheduler:

```bash
# /etc/crontab
0 2 * * * cd /app && bun run job:run sync-missing-sets >> /var/log/cron.log 2>&1
```

### Health Check Script

```bash
#!/bin/bash
# healthcheck.sh

result=$(bun run job:run database-health-check 2>&1)
exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo "Health check failed:"
  echo "$result"
  exit 1
fi

echo "Health check passed"
exit 0
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run data sync
  run: |
    bun run job:run sync-missing-sets
    bun run job:run sync-missing-cards

- name: Verify data integrity
  run: bun run job:run validate-data-integrity
```

---

## Error Messages

### Job Not Found

```
Error: Job not found: invalid-job-name

Available jobs:
  - sync-missing-sets
  - sync-missing-cards
  - backup-database
  ...
```

### Dependency Not Met

```
Error: Cannot run sync-missing-cards

Unmet dependencies:
  - sync-missing-sets (not run today)

Run the dependency first or use --force to skip dependency check.
```

### Timeout

```
Error: Job timed out after 30 minutes

Job: sync-missing-cards
Started: 2025-01-15 03:00:00
Timeout: 1800000ms

The job was cancelled. Check logs for partial progress.
```
