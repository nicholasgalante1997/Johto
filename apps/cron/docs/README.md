# Pokemon TCG Cron Service

> A production-ready background job scheduler for the Pokemon TCG platform, built with Bun and TypeScript.

## What is this?

The Cron Service is a standalone background worker that handles automated database maintenance, data synchronization, backups, and health monitoring for the Pokemon TCG platform. It runs independently of the main API and web services, ensuring data integrity and system reliability.

## Key Features

<div class="feature-grid">
  <div class="feature-card">
    <h4>Data Synchronization</h4>
    <p>Automatically sync Pokemon TCG sets and cards from local data sources to SQLite and PostgreSQL databases.</p>
  </div>
  <div class="feature-card">
    <h4>Automated Backups</h4>
    <p>Daily compressed backups with SHA256 verification and intelligent retention policies.</p>
  </div>
  <div class="feature-card">
    <h4>Health Monitoring</h4>
    <p>Continuous database health checks with Slack alerts for critical issues.</p>
  </div>
  <div class="feature-card">
    <h4>PostgreSQL Replication</h4>
    <p>Sync local SQLite data to the primary PostgreSQL database for production use.</p>
  </div>
</div>

## Jobs at a Glance

| Job | Schedule | Purpose |
|-----|----------|---------|
| `sync-missing-sets` | Daily 2:00 AM | Sync new Pokemon TCG sets |
| `sync-missing-cards` | Daily 3:00 AM | Sync missing cards for incomplete sets |
| `validate-data-integrity` | Weekly Sunday 6:00 AM | Validate database integrity |
| `backup-database` | Daily midnight | Create compressed database backups |
| `rotate-backups` | Daily 1:00 AM | Clean old backups per retention policy |
| `replicate-to-primary` | Daily 4:00 AM | Sync data to PostgreSQL |
| `database-health-check` | Every 15 minutes | Monitor database health |
| `cleanup-stale-data` | Weekly Sunday 5:00 AM | Optimize database (VACUUM/ANALYZE) |

## Quick Example

```bash
# Start the scheduler
bun run start

# Run a specific job manually
bun run job:run sync-missing-sets

# Check job status
bun run job:status

# List all jobs
bun run job:list
```

## Technology Stack

- **Runtime**: Bun 1.3.5
- **Language**: TypeScript (strict mode)
- **Databases**: SQLite (local), PostgreSQL (primary)
- **Notifications**: Slack webhooks
- **Containerization**: Docker with multi-stage builds

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Cron Service                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Scheduler  │───▶│  JobRunner  │───▶│    Jobs     │     │
│  │   Engine    │    │  (timeout,  │    │  (8 types)  │     │
│  │             │    │   retry)    │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                                     │             │
│         ▼                                     ▼             │
│  ┌─────────────┐                      ┌─────────────┐      │
│  │   Config    │                      │  Services   │      │
│  │  (env vars) │                      │  (backup,   │      │
│  │             │                      │   notify)   │      │
│  └─────────────┘                      └─────────────┘      │
│                                              │              │
├──────────────────────────────────────────────┼──────────────┤
│                    Databases                 │              │
│  ┌─────────────┐              ┌─────────────┐│              │
│  │   SQLite    │              │ PostgreSQL  ││              │
│  │   (local)   │─────────────▶│  (primary)  ││              │
│  └─────────────┘              └─────────────┘│              │
└─────────────────────────────────────────────────────────────┘
```

## Getting Started

Ready to dive in? Check out the [Quick Start Guide](quickstart.md) to get the cron service running in minutes.

---

<p style="text-align: center; color: var(--text-muted); font-size: 0.9rem;">
  Part of <strong>Project Johto</strong> - Pokemon TCG Platform
</p>
