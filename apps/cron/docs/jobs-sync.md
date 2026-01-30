# Data Sync Jobs

Data synchronization jobs keep the local SQLite database in sync with the Pokemon TCG data source.

## sync-missing-sets

Synchronizes Pokemon TCG sets from the local data package to SQLite.

### Configuration

| Property | Value |
|----------|-------|
| **Schedule** | `0 2 * * *` (Daily at 2:00 AM) |
| **Timeout** | 5 minutes |
| **Retries** | 3 attempts, 60s delay |
| **Exclusive** | Yes |
| **Dependencies** | None |

### What It Does

1. **Load existing sets** from SQLite database
2. **Load source sets** from `@pokemon/data` package
3. **Calculate difference** to find missing sets
4. **Insert missing sets** into SQLite

### Execution Flow

```
┌─────────────────────┐
│ Load existing sets  │
│ from SQLite         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Load source sets    │
│ from @pokemon/data  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Calculate diff      │
│ (missing sets)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Insert missing sets │
│ into SQLite         │
└─────────────────────┘
```

### Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `sets_checked` | gauge | Total sets in source |
| `sets_existing` | gauge | Sets already in database |
| `sets_missing` | gauge | Sets needing sync |
| `sets_synced` | counter | Sets successfully inserted |
| `sets_failed` | counter | Sets that failed to insert |

### Example Output

```
[sync-missing-sets] Starting set synchronization
[sync-missing-sets] Loaded 150 sets from source
[sync-missing-sets] Found 148 existing sets in database
[sync-missing-sets] Identified 2 missing sets
[sync-missing-sets] Syncing: Scarlet & Violet—Surging Sparks
[sync-missing-sets] Syncing: Scarlet & Violet—Prismatic Evolutions
[sync-missing-sets] Completed: 2 sets synced, 0 failed
```

---

## sync-missing-cards

Synchronizes missing cards for sets that have fewer cards than expected.

### Configuration

| Property | Value |
|----------|-------|
| **Schedule** | `0 3 * * *` (Daily at 3:00 AM) |
| **Timeout** | 30 minutes |
| **Retries** | 2 attempts, 120s delay |
| **Exclusive** | Yes |
| **Dependencies** | `sync-missing-sets` |

### What It Does

1. **Find incomplete sets** (card count < expected total)
2. **Query existing cards** for each incomplete set
3. **Load source cards** from `@pokemon/data`
4. **Batch insert** missing cards (100 per batch)
5. **Limit processing** to 10 sets per run

### Execution Flow

```
┌─────────────────────────┐
│ Find incomplete sets    │
│ (count < total)         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ For each incomplete set │◀──────┐
│ (max 10 per run)        │       │
└───────────┬─────────────┘       │
            │                     │
            ▼                     │
┌─────────────────────────┐       │
│ Get existing card IDs   │       │
└───────────┬─────────────┘       │
            │                     │
            ▼                     │
┌─────────────────────────┐       │
│ Load cards from source  │       │
└───────────┬─────────────┘       │
            │                     │
            ▼                     │
┌─────────────────────────┐       │
│ Find missing cards      │       │
└───────────┬─────────────┘       │
            │                     │
            ▼                     │
┌─────────────────────────┐       │
│ Batch insert (100/batch)│───────┘
└─────────────────────────┘
```

### Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `sets_checked` | gauge | Total sets evaluated |
| `sets_incomplete` | gauge | Sets with missing cards |
| `sets_processed` | counter | Sets actually processed |
| `cards_missing` | gauge | Total missing cards found |
| `cards_synced` | counter | Cards successfully inserted |
| `cards_failed` | counter | Cards that failed to insert |

### Configuration Options

These can be set via environment variables:

```bash
SYNC_BATCH_SIZE=100           # Cards per insert batch
SYNC_MAX_SETS_PER_RUN=10      # Max sets to process per run
SYNC_PRIORITIZE_RECENT=true   # Process newest sets first
```

### Example Output

```
[sync-missing-cards] Starting card synchronization
[sync-missing-cards] Found 3 incomplete sets
[sync-missing-cards] Processing: Surging Sparks (150/200 cards)
[sync-missing-cards]   Batch 1/1: Inserted 50 cards
[sync-missing-cards] Processing: Prismatic Evolutions (0/100 cards)
[sync-missing-cards]   Batch 1/1: Inserted 100 cards
[sync-missing-cards] Completed: 150 cards synced across 2 sets
```

---

## validate-data-integrity

Validates database integrity and flags data quality issues.

### Configuration

| Property | Value |
|----------|-------|
| **Schedule** | `0 6 * * 0` (Weekly Sunday at 6:00 AM) |
| **Timeout** | 10 minutes |
| **Retries** | 1 attempt, 60s delay |
| **Exclusive** | Yes |
| **Dependencies** | None |

### What It Does

Performs comprehensive validation checks:

1. **Orphaned cards**: Cards without a valid `set_id`
2. **Duplicate cards**: Multiple entries with same ID
3. **Missing required fields**: Cards missing `name`, `supertype`, or `set_id`
4. **Incomplete sets**: Sets with fewer cards than expected
5. **SQLite integrity**: Database structural integrity check

### Validation Checks

```
┌─────────────────────────────────────────────────────────────┐
│                   Integrity Checks                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Orphaned Cards                                          │
│     SELECT * FROM cards WHERE set_id NOT IN                 │
│       (SELECT id FROM sets)                                 │
│                                                             │
│  2. Duplicate Cards                                         │
│     SELECT id, COUNT(*) FROM cards                          │
│       GROUP BY id HAVING COUNT(*) > 1                       │
│                                                             │
│  3. Missing Required Fields                                 │
│     SELECT * FROM cards WHERE                               │
│       name IS NULL OR supertype IS NULL OR set_id IS NULL   │
│                                                             │
│  4. Incomplete Sets                                         │
│     SELECT * FROM sets WHERE                                │
│       (SELECT COUNT(*) FROM cards WHERE set_id = sets.id)   │
│       < sets.total_cards                                    │
│                                                             │
│  5. SQLite Integrity                                        │
│     PRAGMA integrity_check                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `total_sets` | gauge | Total sets in database |
| `total_cards` | gauge | Total cards in database |
| `orphaned_cards` | gauge | Cards without valid set |
| `duplicate_cards` | gauge | Duplicate card entries |
| `missing_required_fields` | gauge | Cards missing required data |
| `incomplete_sets` | gauge | Sets with missing cards |
| `issues_found` | gauge | Total issues detected |

### Example Output

```
[validate-data-integrity] Starting integrity validation
[validate-data-integrity] Database contains 150 sets, 15000 cards
[validate-data-integrity] Checking for orphaned cards... 0 found
[validate-data-integrity] Checking for duplicates... 2 found
[validate-data-integrity]   Duplicate: sv1-001 (2 entries)
[validate-data-integrity]   Duplicate: sv2-045 (2 entries)
[validate-data-integrity] Checking required fields... 0 missing
[validate-data-integrity] Checking incomplete sets... 3 found
[validate-data-integrity]   Incomplete: Surging Sparks (150/200)
[validate-data-integrity]   Incomplete: Obsidian Flames (180/197)
[validate-data-integrity]   Incomplete: 151 (160/165)
[validate-data-integrity] SQLite integrity check: OK
[validate-data-integrity] Validation complete: 5 issues found
```

### Issue Severity

| Issue Type | Severity | Action Required |
|------------|----------|-----------------|
| SQLite corruption | Critical | Restore from backup |
| Orphaned cards | High | Investigate and clean |
| Duplicate cards | Medium | De-duplicate entries |
| Missing fields | Medium | Re-sync affected cards |
| Incomplete sets | Low | Will be fixed by sync jobs |

---

## Sync Job Dependencies

The sync jobs form a dependency chain:

```
02:00 AM ─────────────────────────────────────────────────────
                              │
                              ▼
                    ┌─────────────────────┐
                    │  sync-missing-sets  │
                    └──────────┬──────────┘
                               │
03:00 AM ──────────────────────┼──────────────────────────────
                               │
                               ▼
                    ┌─────────────────────┐
                    │ sync-missing-cards  │
                    │ (depends on sets)   │
                    └──────────┬──────────┘
                               │
04:00 AM ──────────────────────┼──────────────────────────────
                               │
                               ▼
                    ┌─────────────────────┐
                    │ replicate-to-primary│
                    │ (depends on cards)  │
                    └─────────────────────┘
```

If `sync-missing-sets` fails, both `sync-missing-cards` and `replicate-to-primary` will be skipped for that day.
