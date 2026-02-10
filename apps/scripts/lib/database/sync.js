import { Pokedex } from '@pokemon/clients';
import { postgres, neo4j } from '@pokemon/database';

import { createLogger } from '@pokemon/logger';

const logger = createLogger('pokemon:scripts:db:sync');

export async function syncSets() {
  const pokedex = new Pokedex();
  const pool = postgres.getPool();
  for await (const set of pokedex.getAllSets()) {
    logger.info('Inserting set %s into datastores...', set.name);
    try {
      logger.info('Inserting set %s into postgres...', set.name);
      await postgres.insertSet(pool, set);
      logger.info('Inserted set %s into postgres.', set.name);

      logger.info('Inserting set %s into neo4j...', set.name);
      await neo4j.insertSet(set);
      logger.info('Inserted set %s into neo4j.', set.name);
    } catch (e) {
      console.error(e);
      return;
    }
  }
}

export async function syncCards() {
  const pokedex = new Pokedex();
  const pool = postgres.getPool();
  for await (const set of pokedex.getAllSets()) {
    for await (const card of pokedex.getAllCardsInSet(set.id)) {
      logger.info(
        'Inserting card %s w local name %s from set %s into datastores ...',
        card.id,
        card.name,
        card.set.name
      );
      try {
        logger.info(
          'Inserting card %s w local name %s from set %s into postgres',
          card.id,
          card.name,
          card.set.name
        );
        const pgResult = await postgres.insertCard(pool, card);
        if (!pgResult) {
          throw new Error(
            'Failed to insert card(postgres):\n' + JSON.stringify(card, null, 2)
          );
        }
        logger.info(
          'Inserted card %s w local name %s from set %s into postgres',
          card.id,
          card.name,
          card.set.name
        );

        logger.info(
          'Inserting card %s w local name %s from set %s into neo4j',
          card.id,
          card.name,
          card.set.name
        );
        const neo4jResult = await neo4j.insertCard(card);
        if (!neo4jResult) {
          throw new Error(
            'Failed to insert card(neo4j):\n' + JSON.stringify(card, null, 2)
          );
        }
        logger.info(
          'Inserted card %s w local name %s from set %s into neo4j',
          card.id,
          card.name,
          card.set.name
        );
      } catch (e) {
        console.error(e);
        return;
      }
    }
  }
}
