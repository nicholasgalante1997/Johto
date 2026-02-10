import { Pokedex } from '@pokemon/clients';
import { createLogger } from '@pokemon/logger';

import fs from 'fs/promises';
import path from 'path';

const logger = createLogger('pokemon:scripts:json');

const dirs = {
  sets: path.resolve(process.cwd(), '..', '..', 'data/pokemon-json/sets'),
  cards: path.resolve(process.cwd(), '..', '..', 'data/pokemon-json/cards')
};

export async function syncPokemonJson() {
  const pokedex = new Pokedex();
  const errors = [];

  for await (const set of pokedex.getAllSets()) {
    logger.info(`Syncing set ${set.name} (${set.id})`);
    try {
      await sync(set);
    } catch (error) {
      const _error = new Error(
        `Error syncing set ${set.name} (${set.id}): ${error.message}`
      );
      logger.error(_error);
      errors.push(_error);
      continue;
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Encountered ${errors.length} errors during sync. See logs for details.`
    );
  }
}

/**
 * @param {import('@pokemon/clients').Pokemon.Set} set
 */
async function sync(set) {
  const { id } = set;
  const setpath = path.join(dirs.sets, `${id}.json`);
  const exists = await fs
    .stat(setpath)
    .then((stats) => stats.isFile())
    .catch(() => null);

  if (exists == null) {
    await writeSetFile(set, setpath);
  }

  /**
   * This is a safe operation since we only add new cards and never modify existing ones
   */
  await writeCardsInSet(set);
}

async function writeSetFile(set, outpath) {
  logger.info(`Creating set file for ${set.name} (${set.id})`);
  try {
    await Bun.write(outpath, JSON.stringify(set, null, 2), {
      createPath: true
    });
  } catch (error) {
    logger.error(
      `Error creating set file for ${set.name} (${set.id}): ${error.message}`
    );
    throw error;
  }
}

async function writeCardsInSet(set) {
  const pokedex = new Pokedex();
  for await (const card of pokedex.getAllCardsInSet(set.id)) {
    const cardpath = path.join(dirs.cards, `${card.id}.json`);
    if (await Bun.file(cardpath).exists()) {
      continue;
    }

    logger.info(`Creating card file for ${card.name} (${card.id})`);

    try {
      await Bun.write(cardpath, JSON.stringify(card, null, 2), {
        createPath: true
      });
    } catch (error) {
      logger.error(
        `Error creating card file for ${card.name} (${card.id}): ${error.message}`
      );
      throw error;
    }
  }
}
