# Backup Jobs

Backup jobs ensure data safety through automated backups, retention management, and PostgreSQL replication.

## backup-database

Creates timestamped, compressed backups of the SQLite database.

### Configuration

| Property | Value |
|----------|-------|
| **Schedule** | `0 0 * * *` (Daily at midnight) |
| **Timeout** | 5 minutes |
| **Retries** | 2 attempts, 30s delay |
| **Exclusive** | Yes |
| **Dependencies** | None |

### What It Does

1. **Copy database file** using Bun file APIs
2. **Compress with gzip** for storage efficiency
3. **Calculate SHA256 checksum** for integrity verification
4. **Store in backup directory** with timestamp

### Backup Process

```
┌─────────────────────────┐
│   SQLite Database       │
│ pokemon-data.sqlite3.db │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Copy to temp file     │
│   (atomic operation)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Compress with gzip    │
│   (Bun.gzipSync)        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Calculate SHA256      │
│   (Bun.CryptoHasher)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Save to backup dir    │
│   pokemon-data-{ts}.gz  │
└─────────────────────────┘
```

### Backup Naming Convention

```
pokemon-data-2025-01-15T00-00-00.000Z.sqlite3.db.gz
            └──────────────────────┘
                  ISO timestamp
```

### Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `backup_created` | counter | Successful backup count |
| `backup_size_bytes` | gauge | Size of compressed backup |
| `backup_verified` | counter | Verified backups |

### Example Output

```
[backup-database] Starting database backup
[backup-database] Source: ./database/pokemon-data.sqlite3.db (45.2 MB)
[backup-database] Compressing with gzip...
[backup-database] Calculating SHA256 checksum...
[backup-database] Saved: pokemon-data-2025-01-15T00-00-00.000Z.sqlite3.db.gz
[backup-database] Compressed size: 12.8 MB (72% reduction)
[backup-database] Checksum: a1b2c3d4e5f6...
[backup-database] Backup completed successfully
```

---

## rotate-backups

Manages backup retention by removing old backups according to policy.

### Configuration

| Property | Value |
|----------|-------|
| **Schedule** | `0 1 * * *` (Daily at 1:00 AM) |
| **Timeout** | 1 minute |
| **Retries** | 1 attempt, 30s delay |
| **Exclusive** | Yes |
| **Dependencies** | `backup-database` |

### Retention Policy

The default retention policy keeps:

| Retention Type | Count | Description |
|----------------|-------|-------------|
| **Daily** | 7 | Last 7 daily backups |
| **Weekly** | 4 | Last 4 Sunday backups |
| **Monthly** | 3 | Last 3 first-of-month backups |
| **Minimum** | 5 | Always keep at least 5 backups |

### Retention Logic

```
┌─────────────────────────────────────────────────────────────┐
│                    Backup Retention                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Daily (keep 7):                                            │
│  ├── 2025-01-15 ✓                                           │
│  ├── 2025-01-14 ✓                                           │
│  ├── 2025-01-13 ✓                                           │
│  ├── 2025-01-12 ✓ (Sunday - also weekly)                    │
│  ├── 2025-01-11 ✓                                           │
│  ├── 2025-01-10 ✓                                           │
│  └── 2025-01-09 ✓                                           │
│                                                             │
│  Weekly (keep 4 Sundays):                                   │
│  ├── 2025-01-12 ✓                                           │
│  ├── 2025-01-05 ✓                                           │
│  ├── 2024-12-29 ✓                                           │
│  └── 2024-12-22 ✓                                           │
│                                                             │
│  Monthly (keep 3 first-of-month):                           │
│  ├── 2025-01-01 ✓                                           │
│  ├── 2024-12-01 ✓                                           │
│  └── 2024-11-01 ✓                                           │
│                                                             │
│  Everything else: DELETE                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Configuration Options

```bash
BACKUP_DAILY_RETENTION=7      # Days to keep daily backups
BACKUP_WEEKLY_RETENTION=4     # Weeks to keep Sunday backups
BACKUP_MONTHLY_RETENTION=3    # Months to keep first-of-month
BACKUP_MINIMUM=5              # Always keep at least this many
```

### Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `total_backups` | gauge | Total backups before rotation |
| `backups_deleted` | counter | Backups removed |
| `space_freed_bytes` | gauge | Disk space reclaimed |
| `backups_retained` | gauge | Backups kept |

### Example Output

```
[rotate-backups] Starting backup rotation
[rotate-backups] Found 25 backups totaling 320 MB
[rotate-backups] Retention policy:
[rotate-backups]   Daily: 7, Weekly: 4, Monthly: 3, Min: 5
[rotate-backups] Analyzing backups for retention...
[rotate-backups] Keeping 14 backups (7 daily + 4 weekly + 3 monthly)
[rotate-backups] Deleting 11 old backups
[rotate-backups]   Deleted: pokemon-data-2024-10-15T00-00-00.000Z.sqlite3.db.gz
[rotate-backups]   Deleted: pokemon-data-2024-10-14T00-00-00.000Z.sqlite3.db.gz
[rotate-backups]   ... (9 more)
[rotate-backups] Freed 141 MB of disk space
[rotate-backups] Rotation completed
```

---

## replicate-to-primary

Syncs data from SQLite to the primary PostgreSQL database.

### Configuration

| Property | Value |
|----------|-------|
| **Schedule** | `0 4 * * *` (Daily at 4:00 AM) |
| **Timeout** | 30 minutes |
| **Retries** | 2 attempts, 120s delay |
| **Exclusive** | Yes |
| **Dependencies** | `sync-missing-cards` |

### What It Does

1. **Verify PostgreSQL connectivity**
2. **Replicate all sets** using upsert (ON CONFLICT)
3. **Replicate all cards** in batches of 100
4. **Handle duplicates** gracefully with conflict resolution

### Replication Flow

```
┌─────────────────────────┐         ┌─────────────────────────┐
│        SQLite           │         │      PostgreSQL         │
│   (local data store)    │         │   (primary database)    │
├─────────────────────────┤         ├─────────────────────────┤
│                         │         │                         │
│  ┌─────────┐            │         │            ┌─────────┐  │
│  │  Sets   │────────────┼────────▶│───────────▶│  Sets   │  │
│  └─────────┘            │         │            └─────────┘  │
│                         │         │                         │
│  ┌─────────┐            │  Batch  │            ┌─────────┐  │
│  │  Cards  │────────────┼────────▶│───────────▶│  Cards  │  │
│  └─────────┘  (100/batch)│        │            └─────────┘  │
│                         │         │                         │
└─────────────────────────┘         └─────────────────────────┘
```

### Conflict Handling

Uses PostgreSQL's `ON CONFLICT` clause for upserts:

```sql
-- Sets
INSERT INTO sets (id, name, series, total, ...)
VALUES ($1, $2, $3, $4, ...)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  total = EXCLUDED.total,
  updated_at = NOW();

-- Cards
INSERT INTO pokemon_cards (id, name, supertype, set_id, ...)
VALUES ($1, $2, $3, $4, ...)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();
```

### Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `sets_replicated` | counter | Sets successfully synced |
| `sets_failed` | counter | Sets that failed to sync |
| `cards_replicated` | counter | Cards successfully synced |
| `cards_failed` | counter | Cards that failed to sync |

### Prerequisites

PostgreSQL must be configured:

```bash
POSTGRES_HOST=localhost
POSTGRES_USER=pokemon
POSTGRES_PASSWORD=your_password
POSTGRES_DB=pokemon_tcg
```

### Example Output

```
[replicate-to-primary] Starting replication to PostgreSQL
[replicate-to-primary] Verifying PostgreSQL connectivity... OK
[replicate-to-primary] Replicating 150 sets...
[replicate-to-primary]   Sets: 150 synced, 0 failed
[replicate-to-primary] Replicating 15000 cards in batches of 100...
[replicate-to-primary]   Batch 1/150: 100 cards synced
[replicate-to-primary]   Batch 2/150: 100 cards synced
[replicate-to-primary]   ... (148 more batches)
[replicate-to-primary] Replication complete:
[replicate-to-primary]   Sets: 150 synced
[replicate-to-primary]   Cards: 15000 synced
```

---

## Backup Job Dependencies

```
00:00 ─────────────────────────────────────────────────────────
                              │
                              ▼
                    ┌─────────────────────┐
                    │   backup-database   │
                    └──────────┬──────────┘
                               │
01:00 ─────────────────────────┼───────────────────────────────
                               │
                               ▼
                    ┌─────────────────────┐
                    │   rotate-backups    │
                    │  (depends on backup)│
                    └─────────────────────┘
```

The `replicate-to-primary` job depends on `sync-missing-cards`, which runs at 3:00 AM, ensuring replication happens after all sync operations are complete.

---

## Manual Backup Commands

You can trigger backup operations manually:

```bash
# Create a backup now
bun run job:run backup-database

# Rotate backups
bun run job:run rotate-backups

# Replicate to PostgreSQL
bun run job:run replicate-to-primary
```

## Restoring from Backup

To restore from a backup:

```bash
# 1. Stop the cron service
docker compose stop cron

# 2. Decompress the backup
gunzip -k ./database/backups/pokemon-data-2025-01-15T00-00-00.000Z.sqlite3.db.gz

# 3. Replace the database
mv ./database/pokemon-data.sqlite3.db ./database/pokemon-data.sqlite3.db.old
mv ./database/backups/pokemon-data-2025-01-15T00-00-00.000Z.sqlite3.db ./database/pokemon-data.sqlite3.db

# 4. Restart the service
docker compose start cron
```
