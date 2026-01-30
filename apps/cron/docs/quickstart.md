# Quick Start

Get the Pokemon TCG Cron Service running in your development environment.

## Prerequisites

- **Bun** 1.3.5 or later
- **SQLite** database (auto-created if missing)
- **PostgreSQL** (optional, for replication)

## Installation

### 1. Install Dependencies

From the monorepo root:

```bash
bun install
```

Or from the cron app directory:

```bash
cd apps/cron
bun install
```

### 2. Configure Environment

Create a `.env` file in `apps/cron/`:

```bash
# Database
DATABASE_PATH=./database/pokemon-data.sqlite3.db
BACKUP_DIR=./database/backups

# Logging
CRON_LOG_LEVEL=info
CRON_TIMEZONE=America/New_York

# Optional: PostgreSQL for replication
POSTGRES_HOST=localhost
POSTGRES_USER=pokemon
POSTGRES_PASSWORD=your_password
POSTGRES_DB=pokemon_tcg

# Optional: Slack notifications
NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/services/XXX
NOTIFICATION_MIN_SEVERITY=error
```

### 3. Start the Service

```bash
# Development mode with auto-reload
bun run dev

# Production mode
bun run start
```

## Verify It's Working

### Check Scheduler Status

```bash
bun run job:status
```

Expected output:
```
Cron Service Status
═══════════════════

Scheduler: Running
Uptime: 00:01:23
Jobs Registered: 8
Jobs Running: 0

Next Scheduled Runs:
  database-health-check  in 12 minutes
  backup-database        in 23:58:37
```

### List All Jobs

```bash
bun run job:list
```

### Run a Job Manually

```bash
# Dry run (preview without changes)
bun run job:run database-health-check --dry-run

# Execute job
bun run job:run database-health-check
```

## Directory Structure

After running, your directory should look like:

```
apps/cron/
├── database/
│   ├── pokemon-data.sqlite3.db     # Main database
│   └── backups/
│       └── pokemon-data-*.gz       # Compressed backups
├── src/
│   ├── index.ts                    # Entry point
│   ├── cli.ts                      # CLI commands
│   ├── scheduler/                  # Core scheduler
│   ├── jobs/                       # Job implementations
│   ├── services/                   # Business logic
│   ├── config/                     # Configuration
│   └── utils/                      # Utilities
├── .env                            # Environment config
└── package.json
```

## Docker Quick Start

Prefer containers? Use Docker:

```bash
# Build the image
docker build -t pokemon-cron .

# Run with environment variables
docker run -d \
  --name pokemon-cron \
  -v $(pwd)/database:/app/database \
  -e CRON_LOG_LEVEL=info \
  pokemon-cron
```

Or with Docker Compose:

```bash
docker compose up cron
```

## Next Steps

- [Architecture Overview](architecture.md) - Understand how the system works
- [Jobs Reference](jobs.md) - Learn about each job
- [Configuration Guide](configuration.md) - Full configuration options
- [CLI Reference](cli.md) - All available commands
