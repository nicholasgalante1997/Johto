import { createLogger } from '../utils/logger';

const logger = createLogger('cron:notifications');

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface Alert {
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: Date;
  jobName?: string;
  metrics?: Record<string, number>;
}

export interface NotificationConfig {
  slackWebhookUrl?: string;
  enabled: boolean;
  minSeverity: AlertSeverity;
}

const SEVERITY_LEVELS: Record<AlertSeverity, number> = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3,
};

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  info: 'information_source',
  warning: 'warning',
  error: 'x',
  critical: 'rotating_light',
};

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  info: '#36a64f',
  warning: '#ff9800',
  error: '#f44336',
  critical: '#d32f2f',
};

/**
 * Service for sending notifications and alerts.
 */
export class NotificationService {
  private readonly config: NotificationConfig;

  constructor(config?: Partial<NotificationConfig>) {
    this.config = {
      slackWebhookUrl: config?.slackWebhookUrl ?? process.env.SLACK_WEBHOOK_URL,
      enabled: config?.enabled ?? process.env.NOTIFICATIONS_ENABLED === 'true',
      minSeverity: config?.minSeverity ?? 'warning',
    };
  }

  /**
   * Send an alert notification.
   */
  async sendAlert(alert: Alert): Promise<boolean> {
    // Check if notifications are enabled
    if (!this.config.enabled) {
      logger.debug('Notifications disabled, skipping alert: %s', alert.title);
      return false;
    }

    // Check severity threshold
    if (
      SEVERITY_LEVELS[alert.severity] <
      SEVERITY_LEVELS[this.config.minSeverity]
    ) {
      logger.debug(
        'Alert below minimum severity (%s < %s): %s',
        alert.severity,
        this.config.minSeverity,
        alert.title
      );
      return false;
    }

    // Always log the alert
    this.logAlert(alert);

    // Send to Slack if configured
    if (this.config.slackWebhookUrl) {
      return this.sendSlackAlert(alert);
    }

    return true;
  }

  /**
   * Send a job failure alert.
   */
  async sendJobFailureAlert(
    jobName: string,
    error: Error,
    metrics?: Record<string, number>
  ): Promise<boolean> {
    return this.sendAlert({
      title: `Job Failed: ${jobName}`,
      message: error.message,
      severity: 'error',
      timestamp: new Date(),
      jobName,
      metrics,
    });
  }

  /**
   * Send a health check warning.
   */
  async sendHealthWarning(
    issue: string,
    details: string,
    metrics?: Record<string, number>
  ): Promise<boolean> {
    return this.sendAlert({
      title: `Health Warning: ${issue}`,
      message: details,
      severity: 'warning',
      timestamp: new Date(),
      metrics,
    });
  }

  /**
   * Send a critical alert.
   */
  async sendCriticalAlert(
    title: string,
    message: string,
    jobName?: string
  ): Promise<boolean> {
    return this.sendAlert({
      title,
      message,
      severity: 'critical',
      timestamp: new Date(),
      jobName,
    });
  }

  /**
   * Log an alert to the console.
   */
  private logAlert(alert: Alert): void {
    const prefix = `[ALERT:${alert.severity.toUpperCase()}]`;
    const message = `${prefix} ${alert.title}: ${alert.message}`;

    switch (alert.severity) {
      case 'critical':
      case 'error':
        logger.error(message);
        break;
      case 'warning':
        logger.warn(message);
        break;
      default:
        logger.info(message);
    }
  }

  /**
   * Send an alert to Slack.
   */
  private async sendSlackAlert(alert: Alert): Promise<boolean> {
    if (!this.config.slackWebhookUrl) {
      return false;
    }

    try {
      const payload = this.formatSlackPayload(alert);

      const response = await fetch(this.config.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        logger.error(
          'Slack notification failed: %d %s',
          response.status,
          response.statusText
        );
        return false;
      }

      logger.debug('Slack notification sent: %s', alert.title);
      return true;
    } catch (error) {
      logger.error(
        'Failed to send Slack notification: %s',
        error instanceof Error ? error.message : error
      );
      return false;
    }
  }

  /**
   * Format an alert as a Slack payload.
   */
  private formatSlackPayload(alert: Alert) {
    const fields: Array<{ title: string; value: string; short: boolean }> = [];

    if (alert.jobName) {
      fields.push({
        title: 'Job',
        value: alert.jobName,
        short: true,
      });
    }

    fields.push({
      title: 'Time',
      value: alert.timestamp.toISOString(),
      short: true,
    });

    if (alert.metrics) {
      for (const [key, value] of Object.entries(alert.metrics)) {
        fields.push({
          title: key.replace(/_/g, ' '),
          value: String(value),
          short: true,
        });
      }
    }

    return {
      attachments: [
        {
          color: SEVERITY_COLOR[alert.severity],
          title: `:${SEVERITY_EMOJI[alert.severity]}: ${alert.title}`,
          text: alert.message,
          fields,
          footer: 'Pokemon TCG Cron Service',
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        },
      ],
    };
  }
}
