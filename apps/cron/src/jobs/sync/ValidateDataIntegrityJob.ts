import { Job } from '../../scheduler/Job';
import type { JobConfig, JobContext, JobResult } from '../../scheduler/types';
import type { Database } from 'bun:sqlite';

interface IntegrityIssue {
  type: string;
  count: number;
  details?: string[];
}

/**
 * Validates database integrity and flags data quality issues.
 */
export class ValidateDataIntegrityJob extends Job {
  readonly config: JobConfig = {
    name: 'validate-data-integrity',
    description: 'Validate database integrity and flag data quality issues',
    schedule: '0 6 * * 0', // Weekly on Sunday at 6:00 AM
    enabled: true,
    timeout: 600_000, // 10 minutes
    retryAttempts: 1,
    retryDelayMs: 60_000,
    exclusive: true
  };

  async execute(context: JobContext): Promise<JobResult> {
    const startedAt = new Date();
    const logs: string[] = [];
    const metrics: Record<string, number> = {
      total_sets: 0,
      total_cards: 0,
      orphaned_cards: 0,
      duplicate_cards: 0,
      missing_required_fields: 0,
      incomplete_sets: 0,
      issues_found: 0
    };

    const logger = this.createScopedLogger(context.logger, logs);
    const issues: IntegrityIssue[] = [];

    try {
      logger.info('Starting data integrity validation...');
      const db = context.sqliteDb;

      // Get totals
      const setCount = db
        .query('SELECT COUNT(*) as cnt FROM pokemon_card_sets')
        .get() as { cnt: number };
      const cardCount = db
        .query('SELECT COUNT(*) as cnt FROM pokemon_cards')
        .get() as { cnt: number };
      metrics.total_sets = setCount.cnt;
      metrics.total_cards = cardCount.cnt;
      logger.info(
        'Database contains %d sets and %d cards',
        metrics.total_sets,
        metrics.total_cards
      );

      // Check 1: Orphaned cards (cards without valid set_id)
      logger.info('Checking for orphaned cards...');
      const orphanedCards = this.checkOrphanedCards(db);
      metrics.orphaned_cards = orphanedCards.count;
      if (orphanedCards.count > 0) {
        issues.push(orphanedCards);
        logger.warn('Found %d orphaned cards', orphanedCards.count);
      }

      // Check 2: Duplicate card entries
      logger.info('Checking for duplicate cards...');
      const duplicateCards = this.checkDuplicateCards(db);
      metrics.duplicate_cards = duplicateCards.count;
      if (duplicateCards.count > 0) {
        issues.push(duplicateCards);
        logger.warn('Found %d duplicate card IDs', duplicateCards.count);
      }

      // Check 3: Missing required fields
      logger.info('Checking for missing required fields...');
      const missingFields = this.checkMissingRequiredFields(db);
      metrics.missing_required_fields = missingFields.count;
      if (missingFields.count > 0) {
        issues.push(missingFields);
        logger.warn(
          'Found %d cards with missing required fields',
          missingFields.count
        );
      }

      // Check 4: Incomplete sets (card count < expected)
      logger.info('Checking for incomplete sets...');
      const incompleteSets = this.checkIncompleteSets(db);
      metrics.incomplete_sets = incompleteSets.count;
      if (incompleteSets.count > 0) {
        issues.push(incompleteSets);
        logger.info('Found %d incomplete sets', incompleteSets.count);
      }

      // Check 5: SQLite integrity check
      logger.info('Running SQLite integrity check...');
      const integrityResult = db.query('PRAGMA integrity_check').get() as {
        integrity_check: string;
      };
      if (integrityResult.integrity_check !== 'ok') {
        issues.push({
          type: 'database_corruption',
          count: 1,
          details: [integrityResult.integrity_check]
        });
        logger.error(
          'SQLite integrity check failed: %s',
          integrityResult.integrity_check
        );
      } else {
        logger.info('SQLite integrity check passed');
      }

      // Summary
      metrics.issues_found = issues.length;

      if (issues.length === 0) {
        logger.info('Data integrity validation complete - no issues found');
      } else {
        logger.warn(
          'Data integrity validation complete - %d issue types found',
          issues.length
        );
        for (const issue of issues) {
          logger.warn('  - %s: %d occurrences', issue.type, issue.count);
        }
      }

      context.metrics.gauge('integrity_issues', metrics.issues_found);
      context.metrics.timing(
        'validation_duration',
        Date.now() - startedAt.getTime()
      );

      return this.createResult(startedAt, metrics, logs);
    } catch (error) {
      logger.error(
        'Job failed: %s',
        error instanceof Error ? error.message : error
      );
      return this.createResult(
        startedAt,
        metrics,
        logs,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private checkOrphanedCards(db: Database): IntegrityIssue {
    const query = `
      SELECT c.id, c.name
      FROM pokemon_cards c
      LEFT JOIN pokemon_card_sets s ON c.set_id = s.id
      WHERE s.id IS NULL
      LIMIT 10
    `;
    const orphans = db.query(query).all() as { id: string; name: string }[];
    const countResult = db
      .query(
        `
      SELECT COUNT(*) as cnt
      FROM pokemon_cards c
      LEFT JOIN pokemon_card_sets s ON c.set_id = s.id
      WHERE s.id IS NULL
    `
      )
      .get() as { cnt: number };

    return {
      type: 'orphaned_cards',
      count: countResult.cnt,
      details: orphans.map((o) => `${o.id}: ${o.name}`)
    };
  }

  private checkDuplicateCards(db: Database): IntegrityIssue {
    const query = `
      SELECT id, COUNT(*) as cnt
      FROM pokemon_cards
      GROUP BY id
      HAVING COUNT(*) > 1
      LIMIT 10
    `;
    const duplicates = db.query(query).all() as { id: string; cnt: number }[];

    return {
      type: 'duplicate_cards',
      count: duplicates.length,
      details: duplicates.map((d) => `${d.id}: ${d.cnt} copies`)
    };
  }

  private checkMissingRequiredFields(db: Database): IntegrityIssue {
    const query = `
      SELECT id, name
      FROM pokemon_cards
      WHERE name IS NULL OR name = ''
         OR supertype IS NULL OR supertype = ''
         OR set_id IS NULL OR set_id = ''
      LIMIT 10
    `;
    const missing = db.query(query).all() as { id: string; name: string }[];
    const countResult = db
      .query(
        `
      SELECT COUNT(*) as cnt
      FROM pokemon_cards
      WHERE name IS NULL OR name = ''
         OR supertype IS NULL OR supertype = ''
         OR set_id IS NULL OR set_id = ''
    `
      )
      .get() as { cnt: number };

    return {
      type: 'missing_required_fields',
      count: countResult.cnt,
      details: missing.map((m) => `${m.id}: ${m.name || '(no name)'}`)
    };
  }

  private checkIncompleteSets(db: Database): IntegrityIssue {
    const query = `
      SELECT
        s.id,
        s.name,
        COALESCE(s.total, s.printed_total) as expected,
        COALESCE(c.cnt, 0) as actual
      FROM pokemon_card_sets s
      LEFT JOIN (
        SELECT set_id, COUNT(*) as cnt
        FROM pokemon_cards
        GROUP BY set_id
      ) c ON s.id = c.set_id
      WHERE COALESCE(c.cnt, 0) < COALESCE(s.total, s.printed_total, 0)
      ORDER BY s.release_date DESC
      LIMIT 20
    `;
    const incomplete = db.query(query).all() as {
      id: string;
      name: string;
      expected: number;
      actual: number;
    }[];

    return {
      type: 'incomplete_sets',
      count: incomplete.length,
      details: incomplete.map(
        (s) => `${s.id} (${s.name}): ${s.actual}/${s.expected} cards`
      )
    };
  }

  async onSuccess(result: JobResult): Promise<void> {
    const issues = result.metrics.issues_found ?? 0;
    if (issues > 0) {
      console.warn(
        `[ValidateDataIntegrityJob] Completed with ${issues} issue types found`
      );
    } else {
      console.log('[ValidateDataIntegrityJob] Completed - no issues found');
    }
  }

  async onFailure(error: Error): Promise<void> {
    console.error(`[ValidateDataIntegrityJob] Failed: ${error.message}`);
  }
}
