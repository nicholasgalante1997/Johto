# Health Jobs

Health monitoring jobs ensure database reliability and optimal performance through continuous monitoring and maintenance.

## database-health-check

Monitors database health and sends alerts for critical issues.

### Configuration

| Property         | Value                             |
| ---------------- | --------------------------------- |
| **Schedule**     | `*/15 * * * *` (Every 15 minutes) |
| **Timeout**      | 1 minute                          |
| **Retries**      | 1 attempt, 10s delay              |
| **Exclusive**    | No (can run with other jobs)      |
| **Dependencies** | None                              |

### Health Checks Performed

| Check                   | Description              | Penalty if Failed |
| ----------------------- | ------------------------ | ----------------- |
| SQLite connectivity     | `SELECT 1` query         | -50 points        |
| SQLite integrity        | `PRAGMA quick_check`     | -30 points        |
| Database file size      | Alert if > 1GB           | -5 points         |
| WAL file size           | Write-ahead log check    | -5 points         |
| PostgreSQL connectivity | Optional connection test | -10 points        |
| Disk space              | Free space availability  | -5 points         |
| Table counts            | Sets and cards totals    | Info only         |

### Health Score Calculation

```
┌─────────────────────────────────────────────────────────────┐
│                    Health Score (0-100)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Starting Score: 100                                        │
│                                                             │
│  Penalties:                                                 │
│  ├── SQLite connection failed:     -50                      │
│  ├── SQLite integrity failed:      -30                      │
│  ├── PostgreSQL unavailable:       -10                      │
│  ├── Database > 1GB:               -5                       │
│  ├── WAL > 100MB:                  -5                       │
│  ├── Disk space < 10%:             -5                       │
│  └── Each other issue:             -5                       │
│                                                             │
│  Alert Threshold: Score < 70                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Check Flow

```
┌─────────────────────────┐
│  Start Health Check     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  SQLite Connectivity    │──▶ SELECT 1
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  SQLite Integrity       │──▶ PRAGMA quick_check
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Database File Size     │──▶ Bun.file().size
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  WAL File Size          │──▶ Check -wal file
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Table Counts           │──▶ COUNT(*) queries
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  PostgreSQL (optional)  │──▶ Connection test
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Calculate Health Score │
└───────────┬─────────────┘
            │
            ▼
        ┌───┴───┐
        │Score  │
        │< 70?  │
        └───┬───┘
      Yes   │   No
    ┌───────┴───────┐
    ▼               ▼
┌────────┐    ┌────────┐
│ Alert! │    │  OK    │
└────────┘    └────────┘
```

### Metrics

| Metric         | Type  | Description                  |
| -------------- | ----- | ---------------------------- |
| `health_score` | gauge | Current health score (0-100) |
| `issues_found` | gauge | Number of issues detected    |
| `db_size_mb`   | gauge | Database size in MB          |
| `wal_size_mb`  | gauge | WAL file size in MB          |
| `set_count`    | gauge | Total sets in database       |
| `card_count`   | gauge | Total cards in database      |

### Alert Conditions

Alerts are sent via Slack when:

- Health score drops below 70
- SQLite connection fails
- SQLite integrity check fails
- PostgreSQL becomes unavailable (if configured)

### Example Output (Healthy)

```
[database-health-check] Starting health check
[database-health-check] SQLite connectivity: OK
[database-health-check] SQLite integrity: OK
[database-health-check] Database size: 45.2 MB
[database-health-check] WAL size: 2.1 MB
[database-health-check] Sets: 150, Cards: 15000
[database-health-check] PostgreSQL: Connected
[database-health-check] Health score: 100/100
[database-health-check] All systems healthy
```

### Example Output (Issues)

```
[database-health-check] Starting health check
[database-health-check] SQLite connectivity: OK
[database-health-check] SQLite integrity: OK
[database-health-check] Database size: 1.2 GB (WARNING: exceeds 1GB)
[database-health-check] WAL size: 150 MB (WARNING: large WAL file)
[database-health-check] Sets: 150, Cards: 15000
[database-health-check] PostgreSQL: Connection failed
[database-health-check] Health score: 75/100
[database-health-check] Issues found: 3
[database-health-check]   - Database exceeds 1GB
[database-health-check]   - WAL file is large (consider checkpoint)
[database-health-check]   - PostgreSQL unavailable
```

---

## cleanup-stale-data

Optimizes the database by reclaiming space, updating statistics, and maintaining performance.

### Configuration

| Property         | Value                                  |
| ---------------- | -------------------------------------- |
| **Schedule**     | `0 5 * * 0` (Weekly Sunday at 5:00 AM) |
| **Timeout**      | 10 minutes                             |
| **Retries**      | 1 attempt, 60s delay                   |
| **Exclusive**    | Yes                                    |
| **Dependencies** | None                                   |

### What It Does

1. **Record initial size** for comparison
2. **Run ANALYZE** to update query planner statistics
3. **Run VACUUM** to reclaim space and defragment
4. **Checkpoint WAL** to truncate write-ahead log
5. **Run final ANALYZE** after optimization

### Optimization Operations

```
┌─────────────────────────────────────────────────────────────┐
│                  Database Optimization                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ANALYZE                                                 │
│     ├── Updates sqlite_stat1 table                          │
│     ├── Improves query planner decisions                    │
│     └── Fast operation, no data movement                    │
│                                                             │
│  2. VACUUM                                                  │
│     ├── Reclaims space from deleted rows                    │
│     ├── Defragments database file                           │
│     ├── Rebuilds tables and indexes                         │
│     └── Can take time on large databases                    │
│                                                             │
│  3. WAL Checkpoint (TRUNCATE mode)                          │
│     ├── Writes WAL contents to main database                │
│     ├── Truncates WAL file to zero                          │
│     └── Frees disk space used by WAL                        │
│                                                             │
│  4. Final ANALYZE                                           │
│     └── Updates statistics after VACUUM                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Optimization Flow

```
┌─────────────────────────┐
│  Record initial size    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  ANALYZE                │
│  (update statistics)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  VACUUM                 │
│  (reclaim space)        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  WAL Checkpoint         │
│  (truncate WAL)         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  ANALYZE (final)        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Report space saved     │
└─────────────────────────┘
```

### Metrics

| Metric           | Type  | Description              |
| ---------------- | ----- | ------------------------ |
| `pages_freed`    | gauge | Database pages reclaimed |
| `size_before_mb` | gauge | Size before optimization |
| `size_after_mb`  | gauge | Size after optimization  |
| `space_saved_mb` | gauge | Space reclaimed          |
| `set_count`      | gauge | Sets after cleanup       |
| `card_count`     | gauge | Cards after cleanup      |

### Example Output

```
[cleanup-stale-data] Starting database optimization
[cleanup-stale-data] Initial database size: 48.5 MB
[cleanup-stale-data] Running ANALYZE...
[cleanup-stale-data] Running VACUUM...
[cleanup-stale-data] Checkpointing WAL...
[cleanup-stale-data]   WAL checkpoint: 150 pages written
[cleanup-stale-data] Running final ANALYZE...
[cleanup-stale-data] Final database size: 45.2 MB
[cleanup-stale-data] Space saved: 3.3 MB (6.8%)
[cleanup-stale-data] Optimization complete
```

---

## Health Job Schedule Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Weekly Schedule                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Every 15 minutes:                                           │
│  └── database-health-check (non-exclusive)                   │
│                                                              │
│  Sunday 5:00 AM:                                             │
│  └── cleanup-stale-data                                      │
│                                                              │
│  Sunday 6:00 AM:                                             │
│  └── validate-data-integrity                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Manual Health Operations

Run health jobs manually when needed:

```bash
# Check database health now
bun run job:run database-health-check

# Optimize database
bun run job:run cleanup-stale-data

# Validate data integrity
bun run job:run validate-data-integrity
```

## Recommended Maintenance Schedule

| Task                     | Frequency    | Job                       |
| ------------------------ | ------------ | ------------------------- |
| Health monitoring        | Every 15 min | `database-health-check`   |
| Database optimization    | Weekly       | `cleanup-stale-data`      |
| Data validation          | Weekly       | `validate-data-integrity` |
| Manual integrity check   | Monthly      | `PRAGMA integrity_check`  |
| Full backup verification | Quarterly    | Manual restore test       |

## Troubleshooting Health Issues

### Low Health Score

If the health score drops:

1. Check the job logs for specific issues
2. Review Slack alerts for details
3. Run a manual health check: `bun run job:run database-health-check`

### Large Database Size

If the database grows too large:

1. Run `cleanup-stale-data` to reclaim space
2. Check for duplicate data with `validate-data-integrity`
3. Review backup retention settings

### Large WAL File

If the WAL file is large:

1. Run `PRAGMA wal_checkpoint(TRUNCATE)` manually
2. Or wait for `cleanup-stale-data` to run
3. Check if writes are happening faster than checkpoints

### PostgreSQL Unavailable

If PostgreSQL connection fails:

1. Verify PostgreSQL is running
2. Check connection credentials in environment
3. Verify network connectivity
4. Check PostgreSQL logs for errors
