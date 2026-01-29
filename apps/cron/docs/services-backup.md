# Backup Service

The BackupService handles all backup-related operations including creation, compression, verification, and retention management.

## Overview

```typescript
import { BackupService } from './services/BackupService';

const backupService = new BackupService({
  backupDir: './database/backups',
  retention: {
    daily: 7,
    weekly: 4,
    monthly: 3,
    minimum: 5
  }
});
```

## Features

- **Compressed backups** using gzip
- **SHA256 checksums** for integrity verification
- **Intelligent retention** with daily/weekly/monthly policies
- **Atomic operations** for data safety
- **Verification** of backup integrity

## API Reference

### createBackup

Creates a compressed backup of the database.

```typescript
interface BackupOptions {
  verify?: boolean;        // Verify after creation (default: true)
  compress?: boolean;      // Use gzip compression (default: true)
  description?: string;    // Optional backup description
}

interface BackupResult {
  path: string;            // Path to backup file
  size: number;            // Compressed size in bytes
  originalSize: number;    // Original size in bytes
  checksum: string;        // SHA256 checksum
  timestamp: Date;         // Creation timestamp
  verified: boolean;       // Whether verification passed
}

const result = await backupService.createBackup(
  './database/pokemon-data.sqlite3.db',
  { verify: true, compress: true }
);
```

**Process:**
1. Read source file using `Bun.file()`
2. Compress data with `Bun.gzipSync()`
3. Calculate SHA256 checksum
4. Write to backup directory
5. Verify if requested

### listBackups

Lists all available backups sorted by date (newest first).

```typescript
interface BackupInfo {
  path: string;
  filename: string;
  size: number;
  timestamp: Date;
  isDaily: boolean;
  isWeekly: boolean;      // Sunday backup
  isMonthly: boolean;     // First of month
}

const backups = await backupService.listBackups();
// Returns BackupInfo[] sorted by timestamp descending
```

### deleteBackup

Deletes a specific backup file.

```typescript
await backupService.deleteBackup('/path/to/backup.gz');
```

### verifyBackup

Verifies backup integrity by checking the gzip structure.

```typescript
const isValid = await backupService.verifyBackup('/path/to/backup.gz');
```

### getBackupsToDelete

Determines which backups should be deleted based on retention policy.

```typescript
interface RetentionPolicy {
  daily: number;       // Keep N most recent daily backups
  weekly: number;      // Keep N most recent Sunday backups
  monthly: number;     // Keep N most recent first-of-month backups
  minimum: number;     // Always keep at least N backups
}

const toDelete = backupService.getBackupsToDelete(backups, retentionPolicy);
// Returns BackupInfo[] of backups to remove
```

## Retention Algorithm

The retention algorithm preserves backups according to these rules:

```
┌─────────────────────────────────────────────────────────────┐
│                 Retention Decision Tree                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  For each backup (sorted by date):                          │
│                                                             │
│  1. Is it one of the N most recent daily backups?           │
│     └── YES: Keep (daily retention)                         │
│                                                             │
│  2. Is it a Sunday AND one of the N most recent Sundays?    │
│     └── YES: Keep (weekly retention)                        │
│                                                             │
│  3. Is it 1st of month AND one of N most recent 1st days?   │
│     └── YES: Keep (monthly retention)                       │
│                                                             │
│  4. Would deleting it leave fewer than minimum backups?     │
│     └── YES: Keep (minimum threshold)                       │
│                                                             │
│  5. None of the above?                                      │
│     └── DELETE                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Example Scenario

With retention policy `{ daily: 7, weekly: 4, monthly: 3, minimum: 5 }`:

```
Date          Day        Keep?   Reason
─────────────────────────────────────────────────
2025-01-15    Wed        ✓       Daily (1 of 7)
2025-01-14    Tue        ✓       Daily (2 of 7)
2025-01-13    Mon        ✓       Daily (3 of 7)
2025-01-12    Sun        ✓       Daily (4 of 7) + Weekly (1 of 4)
2025-01-11    Sat        ✓       Daily (5 of 7)
2025-01-10    Fri        ✓       Daily (6 of 7)
2025-01-09    Thu        ✓       Daily (7 of 7)
2025-01-08    Wed        ✗       Beyond daily retention
2025-01-05    Sun        ✓       Weekly (2 of 4)
2025-01-01    Wed        ✓       Monthly (1 of 3)
2024-12-29    Sun        ✓       Weekly (3 of 4)
2024-12-22    Sun        ✓       Weekly (4 of 4)
2024-12-15    Sun        ✗       Beyond weekly retention
2024-12-01    Sun        ✓       Monthly (2 of 3)
2024-11-01    Fri        ✓       Monthly (3 of 3)
2024-10-01    Tue        ✗       Beyond monthly retention
```

## Compression Details

Backups use gzip compression via Bun's native `gzipSync`:

```typescript
const original = await Bun.file(sourcePath).arrayBuffer();
const compressed = Bun.gzipSync(new Uint8Array(original));

// Typical compression ratios for SQLite:
// - Raw database: 45 MB
// - Compressed:   12 MB
// - Ratio:        ~73% reduction
```

## Checksum Verification

SHA256 checksums ensure backup integrity:

```typescript
const hasher = new Bun.CryptoHasher('sha256');
hasher.update(compressedData);
const checksum = hasher.digest('hex');
// Example: "a1b2c3d4e5f6789..."
```

## File Naming Convention

Backups follow a consistent naming pattern:

```
pokemon-data-{ISO_TIMESTAMP}.sqlite3.db.gz
             └─────────────────┘
                 YYYY-MM-DDTHH-mm-ss.sssZ
```

Example: `pokemon-data-2025-01-15T00-00-00.000Z.sqlite3.db.gz`

## Error Handling

The service handles common errors gracefully:

| Error | Handling |
|-------|----------|
| Source file not found | Throws with clear message |
| Disk full | Throws after cleanup attempt |
| Corruption detected | Logs warning, skips verification |
| Permission denied | Throws with path info |

## Usage in Jobs

### BackupDatabaseJob

```typescript
async run(context: JobContext): Promise<void> {
  const result = await this.backupService.createBackup(
    context.config.databasePath,
    { verify: true }
  );

  context.metrics.gauge('backup_size_bytes', result.size);
  context.metrics.increment('backup_created');

  context.logger.info('Backup created: %s (%d MB)',
    result.path,
    result.size / 1024 / 1024
  );
}
```

### RotateBackupsJob

```typescript
async run(context: JobContext): Promise<void> {
  const backups = await this.backupService.listBackups();
  const toDelete = this.backupService.getBackupsToDelete(
    backups,
    context.config.backup.retention
  );

  let freedBytes = 0;
  for (const backup of toDelete) {
    await this.backupService.deleteBackup(backup.path);
    freedBytes += backup.size;
  }

  context.metrics.gauge('space_freed_bytes', freedBytes);
  context.metrics.increment('backups_deleted', toDelete.length);
}
```

## Best Practices

1. **Always verify** backups after creation
2. **Test restores** periodically (quarterly recommended)
3. **Monitor disk space** to ensure room for backups
4. **Keep minimum backups** high enough for recovery scenarios
5. **Store offsite copies** for disaster recovery
