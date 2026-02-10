# Notification Service

The NotificationService handles alert delivery via Slack webhooks and local logging.

## Overview

```typescript
import { NotificationService } from './services/NotificationService';

const notificationService = new NotificationService({
  webhookUrl: process.env.NOTIFICATION_WEBHOOK_URL,
  minSeverity: 'error',
  enabled: true
});
```

## Features

- **Slack webhook integration** for team alerts
- **Severity-based filtering** (info, warning, error, critical)
- **Formatted messages** with color coding and emoji
- **Local logging** as fallback
- **Graceful degradation** when Slack unavailable

## Alert Severity Levels

| Level      | Value | Color    | Emoji | Use Case               |
| ---------- | ----- | -------- | ----- | ---------------------- |
| `info`     | 0     | Blue     | ℹ️    | Informational messages |
| `warning`  | 1     | Yellow   | ⚠️    | Warning conditions     |
| `error`    | 2     | Red      | ❌    | Error conditions       |
| `critical` | 3     | Dark Red | 🚨    | Critical failures      |

## API Reference

### sendAlert

Send a custom alert with full control.

```typescript
interface Alert {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  jobName?: string;
  metrics?: Record<string, number>;
  timestamp?: Date;
}

await notificationService.sendAlert({
  title: 'Custom Alert',
  message: 'Something happened',
  severity: 'warning',
  jobName: 'my-job',
  metrics: { count: 10 }
});
```

### sendJobFailureAlert

Send an alert for a failed job.

```typescript
await notificationService.sendJobFailureAlert(
  'sync-missing-cards',
  new Error('Database connection failed'),
  { cards_processed: 50, cards_failed: 10 }
);
```

**Generated alert:**

```
🚨 Job Failed: sync-missing-cards

Error: Database connection failed

Metrics:
• cards_processed: 50
• cards_failed: 10
```

### sendHealthWarning

Send an alert for a health issue.

```typescript
await notificationService.sendHealthWarning(
  'Database size exceeds 1GB',
  'Current size: 1.2 GB. Consider cleanup.',
  { db_size_mb: 1200, health_score: 75 }
);
```

### sendCriticalAlert

Send a high-priority critical alert.

```typescript
await notificationService.sendCriticalAlert(
  'Database Corruption Detected',
  'SQLite integrity check failed. Immediate action required.',
  'database-health-check'
);
```

## Slack Message Format

Alerts are formatted as Slack attachments with rich formatting:

```json
{
  "attachments": [
    {
      "color": "#dc2626",
      "pretext": "🚨 *Cron Service Alert*",
      "title": "Job Failed: sync-missing-cards",
      "text": "Database connection failed",
      "fields": [
        { "title": "Job", "value": "sync-missing-cards", "short": true },
        { "title": "Severity", "value": "error", "short": true },
        { "title": "cards_processed", "value": "50", "short": true },
        { "title": "cards_failed", "value": "10", "short": true }
      ],
      "footer": "Pokemon TCG Cron Service",
      "ts": 1705312800
    }
  ]
}
```

### Color Mapping

| Severity | Hex Color | Appearance |
| -------- | --------- | ---------- |
| info     | `#3b82f6` | Blue       |
| warning  | `#eab308` | Yellow     |
| error    | `#dc2626` | Red        |
| critical | `#7f1d1d` | Dark Red   |

## Severity Filtering

Configure minimum severity to reduce noise:

```typescript
const service = new NotificationService({
  webhookUrl: '...',
  minSeverity: 'error'  // Only error and critical
});

// These are sent to Slack:
service.sendAlert({ severity: 'error', ... });    // ✓ Sent
service.sendAlert({ severity: 'critical', ... }); // ✓ Sent

// These are only logged locally:
service.sendAlert({ severity: 'info', ... });     // ✗ Filtered
service.sendAlert({ severity: 'warning', ... });  // ✗ Filtered
```

### Severity Comparison

```typescript
const severityValues = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3
};

// Alert is sent if: alert.severity >= minSeverity
```

## Configuration

### Environment Variables

```bash
# Slack webhook URL (required for Slack alerts)
NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/services/T00/B00/XXX

# Optional email for future email alerts
NOTIFICATION_EMAIL=alerts@example.com

# Minimum severity to trigger Slack notification
# Options: info, warning, error, critical
NOTIFICATION_MIN_SEVERITY=error
```

### Programmatic Configuration

```typescript
interface NotificationConfig {
  webhookUrl?: string; // Slack webhook URL
  email?: string; // Email address (future)
  minSeverity: Severity; // Minimum severity for notifications
  enabled: boolean; // Enable/disable notifications
}
```

## Error Handling

The service handles errors gracefully:

```typescript
async sendAlert(alert: Alert): Promise<void> {
  // Always log locally
  this.logAlert(alert);

  // Check if should send to Slack
  if (!this.shouldSend(alert)) {
    return;
  }

  // Attempt Slack delivery
  try {
    await this.sendToSlack(alert);
  } catch (error) {
    // Log error but don't throw
    // Ensures job continues even if notification fails
    console.error('Failed to send Slack alert:', error);
  }
}
```

## Usage in Jobs

### Health Check Job

```typescript
async run(context: JobContext): Promise<void> {
  const healthScore = await this.checkHealth(context);

  if (healthScore < 70) {
    await this.notificationService.sendHealthWarning(
      'Low Health Score',
      `Health score dropped to ${healthScore}/100`,
      { health_score: healthScore }
    );
  }
}
```

### Job Runner Integration

```typescript
// In JobRunner.ts
async execute(job: Job, context: JobContext): Promise<JobResult> {
  try {
    await job.run(context);
    return { success: true, ... };
  } catch (error) {
    // Notify on failure
    await this.notificationService.sendJobFailureAlert(
      job.config.name,
      error,
      context.metrics.getMetrics()
    );

    return { success: false, error, ... };
  }
}
```

## Testing Notifications

Test your Slack integration:

```bash
# Send a test alert via CLI
bun run src/cli.ts test-notification

# Or manually:
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test alert from Cron Service"}' \
  $NOTIFICATION_WEBHOOK_URL
```

## Best Practices

1. **Set appropriate minimum severity** - Start with `error` to avoid alert fatigue
2. **Include meaningful metrics** - Help diagnose issues from the alert
3. **Keep messages concise** - Slack has character limits
4. **Test webhook regularly** - Ensure alerts work when needed
5. **Monitor notification failures** - Log when Slack delivery fails
6. **Use critical sparingly** - Reserve for truly urgent issues

## Future Enhancements

Planned features:

- Email notifications
- PagerDuty integration
- Alert aggregation (rate limiting)
- Acknowledgment tracking
- Escalation policies
