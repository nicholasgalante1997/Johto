# Configuration

The cron service is configured through environment variables. All configuration is loaded at startup and validated.

## Environment Variables

### Core Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `CRON_TIMEZONE` | `America/New_York` | IANA timezone for schedule evaluation |
| `CRON_LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, `error` |
| `CRON_METRICS_ENABLED` | `true` | Enable metrics collection |

### Database Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PATH` | `./database/pokemon-data.sqlite3.db` | Path to SQLite database |
| `POSTGRES_HOST` | - | PostgreSQL host (optional) |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USER` | - | PostgreSQL username |
| `POSTGRES_PASSWORD` | - | PostgreSQL password |
| `POSTGRES_DB` | - | PostgreSQL database name |

### Backup Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_DIR` | `./database/backups` | Directory for backup files |
| `BACKUP_DAILY_RETENTION` | `7` | Days to keep daily backups |
| `BACKUP_WEEKLY_RETENTION` | `4` | Weeks to keep Sunday backups |
| `BACKUP_MONTHLY_RETENTION` | `3` | Months to keep first-of-month backups |
| `BACKUP_MINIMUM` | `3` | Minimum backups to always keep |

### Notification Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `NOTIFICATION_WEBHOOK_URL` | - | Slack webhook URL (optional) |
| `NOTIFICATION_EMAIL` | - | Alert email address (future) |
| `NOTIFICATION_MIN_SEVERITY` | `error` | Minimum severity for alerts |

### Sync Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `SYNC_BATCH_SIZE` | `100` | Cards per insert batch |
| `SYNC_MAX_SETS_PER_RUN` | `10` | Maximum sets to process per sync run |
| `SYNC_PRIORITIZE_RECENT` | `true` | Process newest sets first |
| `POKEMON_TCG_API_KEY` | - | API key for external data (optional) |

## Example .env File

```bash
# ===========================================
# Pokemon TCG Cron Service Configuration
# ===========================================

# Core Settings
CRON_TIMEZONE=America/New_York
CRON_LOG_LEVEL=info
CRON_METRICS_ENABLED=true

# Database - SQLite (local)
DATABASE_PATH=./database/pokemon-data.sqlite3.db

# Database - PostgreSQL (primary)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=pokemon
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=pokemon_tcg

# Backup Configuration
BACKUP_DIR=./database/backups
BACKUP_DAILY_RETENTION=7
BACKUP_WEEKLY_RETENTION=4
BACKUP_MONTHLY_RETENTION=3
BACKUP_MINIMUM=5

# Notifications
NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/services/T00/B00/XXX
NOTIFICATION_MIN_SEVERITY=error

# Sync Settings
SYNC_BATCH_SIZE=100
SYNC_MAX_SETS_PER_RUN=10
SYNC_PRIORITIZE_RECENT=true
```

## Configuration Loading

Configuration is loaded in `src/config/index.ts`:

```typescript
export function loadConfig(): AppConfig {
  return {
    timezone: process.env.CRON_TIMEZONE || 'America/New_York',
    logLevel: parseLogLevel(process.env.CRON_LOG_LEVEL),
    metricsEnabled: parseBool(process.env.CRON_METRICS_ENABLED, true),

    database: {
      sqlitePath: process.env.DATABASE_PATH ||
        './database/pokemon-data.sqlite3.db',
      postgres: loadPostgresConfig()
    },

    backup: {
      dir: process.env.BACKUP_DIR || './database/backups',
      retention: {
        daily: parseInt(process.env.BACKUP_DAILY_RETENTION || '7'),
        weekly: parseInt(process.env.BACKUP_WEEKLY_RETENTION || '4'),
        monthly: parseInt(process.env.BACKUP_MONTHLY_RETENTION || '3'),
        minimum: parseInt(process.env.BACKUP_MINIMUM || '3')
      }
    },

    notification: {
      webhookUrl: process.env.NOTIFICATION_WEBHOOK_URL,
      email: process.env.NOTIFICATION_EMAIL,
      minSeverity: parseSeverity(process.env.NOTIFICATION_MIN_SEVERITY)
    },

    sync: {
      batchSize: parseInt(process.env.SYNC_BATCH_SIZE || '100'),
      maxSetsPerRun: parseInt(process.env.SYNC_MAX_SETS_PER_RUN || '10'),
      prioritizeRecent: parseBool(process.env.SYNC_PRIORITIZE_RECENT, true)
    }
  };
}
```

## Job Configuration

Job-specific settings are defined in `src/config/jobs.config.ts`:

```typescript
export const jobConfigs: Record<string, JobConfigOverrides> = {
  'sync-missing-sets': {
    schedule: '0 2 * * *',
    timeout: 5 * 60 * 1000,
    retryAttempts: 3,
    retryDelay: 60000
  },

  'sync-missing-cards': {
    schedule: '0 3 * * *',
    timeout: 30 * 60 * 1000,
    retryAttempts: 2,
    retryDelay: 120000,
    dependsOn: ['sync-missing-sets']
  },

  'backup-database': {
    schedule: '0 0 * * *',
    timeout: 5 * 60 * 1000,
    retryAttempts: 2,
    retryDelay: 30000
  },

  'database-health-check': {
    schedule: '*/15 * * * *',
    timeout: 60 * 1000,
    retryAttempts: 1,
    retryDelay: 10000,
    exclusive: false
  }

  // ... more jobs
};
```

## Type Definitions

Configuration types are defined in `src/config/types.ts`:

```typescript
export interface AppConfig {
  timezone: string;
  logLevel: LogLevel;
  metricsEnabled: boolean;
  database: DatabaseConfig;
  backup: BackupConfig;
  notification: NotificationConfig;
  sync: SyncConfig;
}

export interface DatabaseConfig {
  sqlitePath: string;
  postgres?: PostgresConfig;
}

export interface PostgresConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface BackupConfig {
  dir: string;
  retention: RetentionPolicy;
}

export interface RetentionPolicy {
  daily: number;
  weekly: number;
  monthly: number;
  minimum: number;
}

export interface NotificationConfig {
  webhookUrl?: string;
  email?: string;
  minSeverity: Severity;
}

export interface SyncConfig {
  batchSize: number;
  maxSetsPerRun: number;
  prioritizeRecent: boolean;
}
```

## Validation

Configuration is validated at startup:

```typescript
function validateConfig(config: AppConfig): void {
  // Validate paths exist
  if (!fs.existsSync(path.dirname(config.database.sqlitePath))) {
    throw new Error(`Database directory not found: ${config.database.sqlitePath}`);
  }

  // Validate backup directory
  if (!fs.existsSync(config.backup.dir)) {
    fs.mkdirSync(config.backup.dir, { recursive: true });
  }

  // Validate retention values
  if (config.backup.retention.minimum < 1) {
    throw new Error('Backup minimum must be at least 1');
  }

  // Validate timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: config.timezone });
  } catch {
    throw new Error(`Invalid timezone: ${config.timezone}`);
  }
}
```

## Environment-Specific Configuration

### Development

```bash
CRON_LOG_LEVEL=debug
CRON_TIMEZONE=America/New_York
DATABASE_PATH=./database/pokemon-data.sqlite3.db
NOTIFICATION_MIN_SEVERITY=info
```

### Production

```bash
CRON_LOG_LEVEL=info
CRON_TIMEZONE=UTC
DATABASE_PATH=/app/database/pokemon-data.sqlite3.db
NOTIFICATION_MIN_SEVERITY=error
NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/...
```

### Docker

```bash
# Set via docker-compose.yml or docker run -e
CRON_LOG_LEVEL=info
DATABASE_PATH=/app/database/pokemon-data.sqlite3.db
BACKUP_DIR=/app/database/backups
```

## Overriding at Runtime

Some settings can be overridden via CLI:

```bash
# Override log level
CRON_LOG_LEVEL=debug bun run start

# Run with different timezone
CRON_TIMEZONE=UTC bun run job:run sync-missing-sets
```

## Configuration Precedence

1. **Environment variables** (highest priority)
2. **.env file** in app directory
3. **Default values** in code (lowest priority)

```
Environment Variable
        ↓
    .env File
        ↓
  Default Value
```
