# Monitoring

The cron service provides multiple monitoring mechanisms to track job health, performance, and system status.

## Monitoring Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Monitoring Stack                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │   Metrics   │    │   Logging   │    │   Alerts    │        │
│   │ Collection  │    │   Output    │    │   (Slack)   │        │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│          │                  │                  │                │
│          ▼                  ▼                  ▼                │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │  Per-Job    │    │   Stdout/   │    │   Webhook   │        │
│   │  Counters   │    │   Stderr    │    │   Delivery  │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Metrics Collection

### Job-Level Metrics

Each job collects metrics during execution:

```typescript
interface MetricsCollector {
  increment(name: string, value?: number): void;
  gauge(name: string, value: number): void;
  timing(name: string, ms: number): void;
  getMetrics(): Record<string, number>;
}
```

### Common Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `*_processed` | counter | Items successfully processed |
| `*_failed` | counter | Items that failed |
| `*_skipped` | counter | Items skipped |
| `duration_ms` | timing | Job execution duration |
| `health_score` | gauge | Current health score (0-100) |

### Job-Specific Metrics

**Sync Jobs:**
```
sets_checked, sets_existing, sets_missing, sets_synced, sets_failed
cards_missing, cards_synced, cards_failed
```

**Backup Jobs:**
```
backup_created, backup_size_bytes, backup_verified
backups_deleted, space_freed_bytes, backups_retained
```

**Health Jobs:**
```
health_score, issues_found, db_size_mb, wal_size_mb
set_count, card_count
```

## Logging

### Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `debug` | Detailed debugging | Query results, iterations |
| `info` | Normal operations | Job started, completed |
| `warn` | Warning conditions | Approaching limits |
| `error` | Error conditions | Job failures |

### Log Format

```
[2025-01-15T14:30:00.000Z] [INFO] [sync-missing-sets] Starting set synchronization
[2025-01-15T14:30:01.234Z] [INFO] [sync-missing-sets] Loaded 150 sets from source
[2025-01-15T14:30:02.456Z] [INFO] [sync-missing-sets] Found 2 missing sets
[2025-01-15T14:30:03.789Z] [INFO] [sync-missing-sets] Completed: 2 sets synced
```

### Configuring Log Level

```bash
# Development - verbose
CRON_LOG_LEVEL=debug bun run start

# Production - errors and warnings only
CRON_LOG_LEVEL=warn bun run start
```

## Health Checks

### Built-in Health Check

The `database-health-check` job runs every 15 minutes:

```bash
# Manual health check
bun run job:run database-health-check
```

### Health Score Interpretation

| Score | Status | Action |
|-------|--------|--------|
| 90-100 | Healthy | No action needed |
| 70-89 | Warning | Monitor closely |
| 50-69 | Degraded | Investigate issues |
| 0-49 | Critical | Immediate attention |

### Docker Health Check

```bash
# Check container health status
docker inspect --format='{{.State.Health.Status}}' pokemon-cron

# Expected output: healthy, unhealthy, or starting
```

## Alerting

### Slack Notifications

Configure Slack alerts for job failures:

```bash
NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/services/...
NOTIFICATION_MIN_SEVERITY=error
```

### Alert Types

| Alert | Severity | Trigger |
|-------|----------|---------|
| Job Failure | error | Job fails after all retries |
| Health Warning | warning | Health score < 70 |
| Critical Alert | critical | Database corruption, connection failure |

### Alert Format

```
🚨 Job Failed: sync-missing-cards

Error: Database connection timeout

Metrics:
• cards_processed: 500
• cards_failed: 50
• duration_ms: 180000

Time: 2025-01-15 03:45:00 UTC
```

## CLI Monitoring

### View Scheduler Status

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

Next Scheduled Jobs:
  database-health-check     in 7 minutes
  backup-database           in 9 hours 30 minutes
```

### View Job History

```bash
bun run job:status sync-missing-cards
```

### List All Jobs

```bash
bun run job:list
```

## Integration Points

### External Monitoring Systems

The service can integrate with external monitoring via:

1. **Log aggregation** - Parse stdout/stderr logs
2. **Health endpoint** - Use Docker health check
3. **Slack webhooks** - Forward alerts
4. **Custom webhooks** - Extend NotificationService

### Prometheus Metrics (Future)

Planned metrics endpoint:

```
# HELP cron_job_duration_seconds Job execution duration
# TYPE cron_job_duration_seconds histogram
cron_job_duration_seconds{job="sync-missing-sets"} 1.234

# HELP cron_job_success_total Total successful job runs
# TYPE cron_job_success_total counter
cron_job_success_total{job="sync-missing-sets"} 42
```

## Dashboard Queries

### Example Queries for Log Analysis

**Job execution frequency:**
```bash
grep "Starting" /var/log/cron.log | wc -l
```

**Failed jobs:**
```bash
grep "ERROR" /var/log/cron.log | tail -20
```

**Health check history:**
```bash
grep "health_score" /var/log/cron.log | tail -10
```

## Monitoring Checklist

### Daily
- [ ] Check health score is > 70
- [ ] Verify backup was created
- [ ] Review any alerts

### Weekly
- [ ] Review job success rates
- [ ] Check disk space for backups
- [ ] Verify PostgreSQL replication

### Monthly
- [ ] Analyze job duration trends
- [ ] Review and tune timeouts
- [ ] Test backup restoration
- [ ] Update retention policies if needed

## Setting Up Monitoring

### Basic Setup

```bash
# 1. Enable health checks
CRON_METRICS_ENABLED=true

# 2. Configure alerts
NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/...
NOTIFICATION_MIN_SEVERITY=error

# 3. Set appropriate log level
CRON_LOG_LEVEL=info
```

### Production Setup

```yaml
# docker-compose.yml
services:
  cron:
    environment:
      - CRON_LOG_LEVEL=info
      - CRON_METRICS_ENABLED=true
      - NOTIFICATION_WEBHOOK_URL=${SLACK_WEBHOOK}
      - NOTIFICATION_MIN_SEVERITY=warning
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "5"
    healthcheck:
      test: ["CMD", "bun", "run", "src/cli.ts", "status"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Troubleshooting Monitoring

### Missing Metrics

1. Verify `CRON_METRICS_ENABLED=true`
2. Check job is actually running
3. Look for errors in job logs

### No Alerts

1. Verify `NOTIFICATION_WEBHOOK_URL` is set
2. Check `NOTIFICATION_MIN_SEVERITY` threshold
3. Test webhook manually:
   ```bash
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"Test alert"}' \
     $NOTIFICATION_WEBHOOK_URL
   ```

### Health Check Failing

1. Run manual health check: `bun run job:run database-health-check`
2. Check database connectivity
3. Verify file permissions on database directory
