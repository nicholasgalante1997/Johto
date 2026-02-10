import { Job } from '../../scheduler/Job';
import type { JobConfig, JobContext, JobResult } from '../../scheduler/types';
import { sqlite, postgres } from '@pokemon/database';
import type { Pokemon } from '@pokemon/clients';

interface SetRow {
  id: string;
  name: string;
  series: string;
  printed_total: number | null;
  total: number | null;
  legalities: string | null;
  ptcgo_code: string | null;
  release_date: string | null;
  updated_at: string | null;
  images: string | null;
}

interface CardRow {
  id: string;
  name: string;
  supertype: string;
  subtypes: string | null;
  hp: number | null;
  types: string | null;
  evolves_from: string | null;
  evolves_to: string | null;
  rules: string | null;
  abilities: string | null;
  attacks: string | null;
  weaknesses: string | null;
  retreat_cost: string | null;
  converted_retreat_cost: number | null;
  set_id: string;
  number: string;
  artist: string | null;
  rarity: string | null;
  flavor_text: string | null;
  national_pokedex_numbers: string | null;
  legalities: string | null;
  images: string | null;
  tcgplayer_url: string | null;
  cardmarket_url: string | null;
}

/**
 * Syncs SQLite data to PostgreSQL primary database.
 */
export class ReplicateToPrimaryJob extends Job {
  readonly config: JobConfig = {
    name: 'replicate-to-primary',
    description: 'Sync SQLite data to PostgreSQL primary database',
    schedule: '0 4 * * *', // Daily at 4:00 AM
    enabled: true,
    timeout: 1_800_000, // 30 minutes
    retryAttempts: 2,
    retryDelayMs: 120_000,
    dependsOn: ['sync-missing-cards'],
    exclusive: true
  };

  private readonly batchSize = 100;

  async execute(context: JobContext): Promise<JobResult> {
    const startedAt = new Date();
    const logs: string[] = [];
    const metrics: Record<string, number> = {
      sets_replicated: 0,
      sets_failed: 0,
      cards_replicated: 0,
      cards_failed: 0
    };

    const logger = this.createScopedLogger(context.logger, logs);

    try {
      logger.info('Starting replication to PostgreSQL...');

      // Check PostgreSQL connectivity
      if (!context.pgPool) {
        throw new Error('PostgreSQL pool not available');
      }

      try {
        await context.pgPool.query('SELECT 1');
        logger.info('PostgreSQL connection verified');
      } catch (error) {
        throw new Error(
          `PostgreSQL connection failed: ${error instanceof Error ? error.message : error}`
        );
      }

      // Replicate sets first
      logger.info('Replicating sets...');
      const setsResult = await this.replicateSets(context, logger, metrics);

      if (context.abortSignal.aborted) {
        logger.warn('Job aborted after sets replication');
        return this.createResult(startedAt, metrics, logs);
      }

      // Replicate cards
      logger.info('Replicating cards...');
      await this.replicateCards(context, logger, metrics);

      logger.info(
        'Replication complete: %d sets, %d cards',
        metrics.sets_replicated,
        metrics.cards_replicated
      );

      if (metrics.sets_failed > 0 || metrics.cards_failed > 0) {
        logger.warn(
          'Failures: %d sets, %d cards',
          metrics.sets_failed,
          metrics.cards_failed
        );
      }

      context.metrics.increment('sets_replicated', metrics.sets_replicated);
      context.metrics.increment('cards_replicated', metrics.cards_replicated);

      return this.createResult(startedAt, metrics, logs);
    } catch (error) {
      logger.error(
        'Replication failed: %s',
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

  private async replicateSets(
    context: JobContext,
    logger: ReturnType<typeof this.createScopedLogger>,
    metrics: Record<string, number>
  ): Promise<void> {
    const sets = sqlite.findAllSets(context.sqliteDb)() as SetRow[];
    logger.info('Found %d sets to replicate', sets.length);

    for (const row of sets) {
      if (context.abortSignal.aborted) break;

      try {
        const set = this.rowToSet(row);
        await postgres.insertSet(context.pgPool, set);
        metrics.sets_replicated++;
      } catch (error) {
        // ON CONFLICT DO NOTHING means this is not an error for duplicates
        if (!(error instanceof Error && error.message.includes('duplicate'))) {
          metrics.sets_failed++;
          logger.warn(
            'Failed to replicate set %s: %s',
            row.id,
            error instanceof Error ? error.message : error
          );
        } else {
          metrics.sets_replicated++;
        }
      }
    }
  }

  private async replicateCards(
    context: JobContext,
    logger: ReturnType<typeof this.createScopedLogger>,
    metrics: Record<string, number>
  ): Promise<void> {
    // Get total count
    const countResult = context.sqliteDb
      .query('SELECT COUNT(*) as cnt FROM pokemon_cards')
      .get() as { cnt: number };
    const totalCards = countResult.cnt;
    logger.info('Found %d cards to replicate', totalCards);

    // Process in batches
    let offset = 0;
    while (offset < totalCards) {
      if (context.abortSignal.aborted) break;

      const cards = sqlite.findAllCards(context.sqliteDb)(
        this.batchSize,
        offset
      ) as CardRow[];

      if (cards.length === 0) break;

      for (const row of cards) {
        try {
          const card = this.rowToCard(row);
          await postgres.insertCard(context.pgPool, card);
          metrics.cards_replicated++;
        } catch (error) {
          // ON CONFLICT DO NOTHING means this is not an error for duplicates
          if (
            !(error instanceof Error && error.message.includes('duplicate'))
          ) {
            metrics.cards_failed++;
            if (metrics.cards_failed <= 10) {
              logger.warn(
                'Failed to replicate card %s: %s',
                row.id,
                error instanceof Error ? error.message : error
              );
            }
          } else {
            metrics.cards_replicated++;
          }
        }
      }

      offset += this.batchSize;

      if (offset % 1000 === 0) {
        logger.info('Progress: %d/%d cards', offset, totalCards);
      }
    }
  }

  private rowToSet(row: SetRow): Pokemon.Set {
    return {
      id: row.id,
      name: row.name,
      series: row.series,
      printedTotal: row.printed_total ?? 0,
      total: row.total ?? 0,
      legalities: row.legalities ? JSON.parse(row.legalities) : {},
      ptcgoCode: row.ptcgo_code ?? undefined,
      releaseDate: row.release_date ?? '',
      updatedAt: row.updated_at ?? '',
      images: row.images ? JSON.parse(row.images) : {}
    };
  }

  private rowToCard(row: CardRow): Pokemon.Card {
    // Pokemon.Card has required fields, but database can have nulls
    // Use type assertion since we're converting from database format
    return {
      id: row.id,
      name: row.name,
      supertype: row.supertype,
      subtypes: row.subtypes ? JSON.parse(row.subtypes) : [],
      hp: row.hp ? String(row.hp) : '',
      types: row.types ? JSON.parse(row.types) : [],
      evolvesFrom: row.evolves_from ?? '',
      evolvesTo: row.evolves_to ? JSON.parse(row.evolves_to) : [],
      rules: row.rules ? JSON.parse(row.rules) : [],
      abilities: row.abilities ? JSON.parse(row.abilities) : [],
      attacks: row.attacks ? JSON.parse(row.attacks) : [],
      weaknesses: row.weaknesses ? JSON.parse(row.weaknesses) : [],
      resistances: [],
      retreatCost: row.retreat_cost ? JSON.parse(row.retreat_cost) : [],
      convertedRetreatCost: row.converted_retreat_cost ?? 0,
      set: { id: row.set_id } as Pokemon.Set,
      number: parseInt(row.number, 10) || 0,
      artist: row.artist ?? '',
      rarity: row.rarity ?? '',
      flavorText: row.flavor_text ?? '',
      nationalPokedexNumbers: row.national_pokedex_numbers
        ? JSON.parse(row.national_pokedex_numbers)
        : [],
      legalities: row.legalities
        ? JSON.parse(row.legalities)
        : { unlimited: '', expanded: '' },
      images: row.images ? JSON.parse(row.images) : { small: '', large: '' },
      tcgplayer: row.tcgplayer_url ? { url: row.tcgplayer_url } : undefined,
      cardmarket: row.cardmarket_url ? { url: row.cardmarket_url } : undefined
    } as Pokemon.Card;
  }

  async onSuccess(result: JobResult): Promise<void> {
    console.log(
      `[ReplicateToPrimaryJob] Completed - ${result.metrics.sets_replicated} sets, ${result.metrics.cards_replicated} cards`
    );
  }

  async onFailure(error: Error): Promise<void> {
    console.error(`[ReplicateToPrimaryJob] Failed: ${error.message}`);
  }
}
