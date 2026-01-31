import { Scheduler } from './scheduler';
import { allJobs, getJobByName, getAllJobConfigs } from './jobs';
import { CronParser } from './scheduler/CronParser';
import { createLogger } from './utils/logger';
import { jobConfigs } from './config/jobs.config';

const logger = createLogger('cron:cli');

type Command = 'run' | 'list' | 'status' | 'history' | 'help';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] as Command | undefined;

  switch (command) {
    case 'run':
      await runJob(args[1], args.includes('--dry-run'));
      break;
    case 'list':
      listJobs();
      break;
    case 'status':
      await showStatus(args[1]);
      break;
    case 'history':
      showHistory(args[1]);
      break;
    case 'help':
    default:
      printUsage();
      if (command && command !== 'help') {
        process.exit(1);
      }
  }
}

async function runJob(jobName?: string, dryRun: boolean = false) {
  if (!jobName) {
    console.error('Error: Job name required');
    console.log('Usage: bun run job:run <job-name> [--dry-run]');
    console.log('\nAvailable jobs:');
    for (const config of jobConfigs) {
      console.log(`  - ${config.name}`);
    }
    process.exit(1);
  }

  const job = getJobByName(jobName);

  if (!job) {
    // Check if the job exists in config but isn't implemented yet
    const configExists = jobConfigs.find((c) => c.name === jobName);
    if (configExists) {
      console.error(
        `Error: Job "${jobName}" is defined but not yet implemented`
      );
    } else {
      console.error(`Error: Job "${jobName}" not found`);
      console.log('\nAvailable jobs:');
      for (const config of jobConfigs) {
        console.log(`  - ${config.name}`);
      }
    }
    process.exit(1);
  }

  if (dryRun) {
    console.log('\n=== Dry Run ===\n');
    console.log(`Job: ${job.config.name}`);
    console.log(`Description: ${job.config.description}`);
    console.log(`Schedule: ${job.config.schedule}`);
    console.log(`Timeout: ${job.config.timeout}ms`);
    console.log(`Retries: ${job.config.retryAttempts}`);
    if (job.config.dependsOn?.length) {
      console.log(`Dependencies: ${job.config.dependsOn.join(', ')}`);
    }
    console.log('\nNo changes made (dry run mode)');
    return;
  }

  console.log(`\nRunning job: ${jobName}\n`);

  const scheduler = new Scheduler();
  scheduler.register(job);

  try {
    const startTime = Date.now();
    const result = await scheduler.runNow(jobName);
    const duration = Date.now() - startTime;

    console.log('\n' + '='.repeat(50));
    console.log('JOB RESULT');
    console.log('='.repeat(50));
    console.log(`Job:      ${result.jobName}`);
    console.log(`Success:  ${result.success ? 'YES' : 'NO'}`);
    console.log(`Duration: ${result.durationMs}ms`);
    console.log(`Started:  ${result.startedAt.toISOString()}`);
    console.log(`Finished: ${result.completedAt.toISOString()}`);

    if (Object.keys(result.metrics).length > 0) {
      console.log('\nMetrics:');
      for (const [key, value] of Object.entries(result.metrics)) {
        console.log(`  ${key}: ${value}`);
      }
    }

    if (result.error) {
      console.log('\nError:');
      console.log(`  ${result.error.message}`);
    }

    if (result.logs.length > 0) {
      console.log('\nLogs:');
      for (const log of result.logs.slice(-20)) {
        console.log(`  ${log}`);
      }
      if (result.logs.length > 20) {
        console.log(`  ... and ${result.logs.length - 20} more`);
      }
    }

    console.log('='.repeat(50));

    await scheduler.stop();
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\nJob execution failed:', error);
    await scheduler.stop();
    process.exit(1);
  }
}

function listJobs() {
  console.log('\n' + '='.repeat(60));
  console.log('REGISTERED JOBS');
  console.log('='.repeat(60));

  // Show implemented jobs
  const implementedJobs = getAllJobConfigs();

  if (implementedJobs.length > 0) {
    console.log('\nImplemented Jobs:');
    for (const config of implementedJobs) {
      const status = config.enabled ? '[ON] ' : '[OFF]';
      console.log(`\n${status} ${config.name}`);
      console.log(`       ${config.description}`);
      console.log(
        `       Schedule: ${config.schedule} (${CronParser.describe(config.schedule)})`
      );
      if (config.dependsOn?.length) {
        console.log(`       Depends on: ${config.dependsOn.join(', ')}`);
      }
    }
  }

  // Show jobs that are configured but not yet implemented
  const implementedNames = new Set(implementedJobs.map((j) => j.name));
  const notImplemented = jobConfigs.filter(
    (c) => !implementedNames.has(c.name)
  );

  if (notImplemented.length > 0) {
    console.log('\nPending Implementation:');
    for (const config of notImplemented) {
      console.log(`\n[---] ${config.name}`);
      console.log(`       ${config.description}`);
      console.log(`       Schedule: ${config.schedule}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(
    `Total: ${jobConfigs.length} jobs (${implementedJobs.length} implemented)`
  );
  console.log('='.repeat(60) + '\n');
}

async function showStatus(jobName?: string) {
  if (jobName) {
    const job = getJobByName(jobName);
    const config = job?.config ?? jobConfigs.find((c) => c.name === jobName);

    if (!config) {
      console.error(`Error: Job "${jobName}" not found`);
      process.exit(1);
    }

    console.log('\n' + '='.repeat(50));
    console.log(`JOB STATUS: ${config.name}`);
    console.log('='.repeat(50));
    console.log(`Description: ${config.description}`);
    console.log(`Schedule:    ${config.schedule}`);
    console.log(`             ${CronParser.describe(config.schedule)}`);
    console.log(`Enabled:     ${config.enabled}`);
    console.log(`Timeout:     ${config.timeout}ms`);
    console.log(`Retries:     ${config.retryAttempts}`);
    console.log(`Retry Delay: ${config.retryDelayMs}ms`);
    console.log(`Exclusive:   ${config.exclusive ?? false}`);
    console.log(`Run on Start: ${config.runOnStartup ?? false}`);

    if (config.dependsOn?.length) {
      console.log(`Dependencies: ${config.dependsOn.join(', ')}`);
    }

    // Calculate next run time
    try {
      const schedule = CronParser.parse(config.schedule);
      const nextRun = CronParser.getNextRunTime(schedule);
      console.log(`Next Run:    ${nextRun.toISOString()}`);
    } catch (error) {
      console.log(`Next Run:    Error parsing schedule`);
    }

    console.log(`Implemented: ${job ? 'YES' : 'NO'}`);
    console.log('='.repeat(50) + '\n');
  } else {
    console.log('\n' + '='.repeat(50));
    console.log('SCHEDULER STATUS');
    console.log('='.repeat(50));
    console.log('The scheduler is not running in CLI mode.');
    console.log('Run `bun run start` to start the scheduler daemon.');
    console.log('\nUse `bun run job:status <name>` to view a specific job.');
    console.log('='.repeat(50) + '\n');
  }
}

function showHistory(jobName?: string) {
  console.log('\n' + '='.repeat(50));
  console.log('JOB HISTORY');
  console.log('='.repeat(50));
  console.log('History persistence is not yet implemented.');
  console.log('This feature will be available in Phase 5.');
  console.log('='.repeat(50) + '\n');
}

function printUsage() {
  console.log(`
Pokemon TCG Cron Service CLI

Usage:
  bun run job:run <name> [--dry-run]   Run a job immediately
  bun run job:list                      List all registered jobs
  bun run job:status [name]             Show scheduler/job status
  bun run job:history [name]            Show job execution history

Options:
  --dry-run    Preview job execution without making changes

Examples:
  bun run job:run sync-missing-sets
  bun run job:run sync-missing-sets --dry-run
  bun run job:list
  bun run job:status sync-missing-sets

Service Commands:
  bun run start          Start the scheduler daemon
  bun run start:dev      Start with hot reload (development)
`);
}

main().catch((error) => {
  console.error('CLI error:', error);
  process.exit(1);
});
