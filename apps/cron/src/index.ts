import { Scheduler } from './scheduler';
import { allJobs } from './jobs';
import { loadConfig, validateConfig } from './config';
import { createLogger } from './utils/logger';

const logger = createLogger('cron:main');

async function main() {
  logger.info('Pokemon TCG Cron Service starting...');

  // Load and validate configuration
  const config = loadConfig();
  const warnings = validateConfig(config);

  for (const warning of warnings) {
    logger.warn(warning);
  }

  // Create scheduler with config
  const scheduler = new Scheduler({
    timezone: config.timezone,
    maxConcurrentJobs: 3,
    enableMetrics: config.metricsEnabled,
  });

  // Register all jobs
  for (const job of allJobs) {
    try {
      scheduler.register(job);
    } catch (error) {
      logger.error(
        'Failed to register job %s: %s',
        job.config.name,
        error instanceof Error ? error.message : error
      );
    }
  }

  // Setup graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info('Received %s, shutting down gracefully...', signal);
    await scheduler.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception: %s', error.message);
    console.error(error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection: %s', reason);
    console.error(reason);
    process.exit(1);
  });

  // Start the scheduler
  try {
    await scheduler.start();
    logger.info('Cron service is running. Press Ctrl+C to stop.');

    // Log status periodically
    setInterval(() => {
      const status = scheduler.getStatus();
      if (status.runningJobs.length > 0) {
        logger.info('Running jobs: %s', status.runningJobs.join(', '));
      }
    }, 60_000);
  } catch (error) {
    logger.error(
      'Failed to start scheduler: %s',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
