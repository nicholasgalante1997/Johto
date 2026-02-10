import { createLogger } from '@pokemon/logger';
import path from 'path';

const logger = createLogger('pokemon:scripts:fork-sync');

const PATHS = {
  forkSets: path.resolve(
    import.meta.dir,
    '../../../../forks/pokemon-tcg-data/sets/en.json'
  ),
  forkCards: path.resolve(
    import.meta.dir,
    '../../../../forks/pokemon-tcg-data/cards/en'
  ),
  targetSets: path.resolve(
    import.meta.dir,
    '../../../../packages/@pokemon-data/data/sets.json'
  ),
  targetCards: path.resolve(
    import.meta.dir,
    '../../../../packages/@pokemon-data/data/cards'
  )
};

/**
 * Load existing target cards for a set (for pricing preservation)
 * @param {string} setId
 * @returns {Promise<Map<string, object>|null>}
 */
async function loadExistingCards(setId) {
  const cardPath = path.join(PATHS.targetCards, `${setId}.d`, 'cards.json');
  const file = Bun.file(cardPath);
  if (await file.exists()) {
    try {
      const data = await file.json();
      return new Map(data.data.map((card) => [card.id, card]));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Ensure directory exists by creating a placeholder file
 * @param {string} dirPath
 * @returns {Promise<boolean>} true if directory was created
 */
async function ensureDir(dirPath) {
  const keepFile = path.join(dirPath, '.keep');
  const file = Bun.file(keepFile);
  if (await file.exists()) {
    return false;
  }
  try {
    await Bun.write(keepFile, '', { createPath: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Synchronizes Pokemon TCG data from fork submodule to @pokemon-data package
 * @param {object} options
 * @param {boolean} [options.dryRun=false] - Preview without writing files
 * @returns {Promise<{setsProcessed: number, cardsProcessed: number, dirsCreated: number}>}
 */
export async function syncForkToData(options = {}) {
  const { dryRun = false } = options;
  const errors = [];
  const stats = { setsProcessed: 0, cardsProcessed: 0, dirsCreated: 0 };

  logger.info('Starting fork-to-data sync...');
  logger.info('Options: dryRun=%s', dryRun);

  // Phase 1: Load sets from fork
  logger.info('Phase 1: Loading sets from fork...');
  let forkSets;
  try {
    forkSets = await Bun.file(PATHS.forkSets).json();
  } catch (error) {
    throw new Error(`Failed to load fork sets: ${error.message}`);
  }
  const setsMap = new Map(forkSets.map((set) => [set.id, set]));
  logger.info('Loaded %d sets from fork', forkSets.length);

  // Phase 2: Sync sets
  logger.info('Phase 2: Syncing sets to @pokemon-data...');
  if (!dryRun) {
    try {
      await Bun.write(
        PATHS.targetSets,
        JSON.stringify({ data: forkSets }, null, 2)
      );
    } catch (error) {
      throw new Error(`Failed to write sets file: ${error.message}`);
    }
  }
  stats.setsProcessed = forkSets.length;
  logger.info('Sets sync complete');

  // Phase 3: Sync cards
  logger.info('Phase 3: Syncing cards...');
  const glob = new Bun.Glob('*.json');
  const setFiles = [...glob.scanSync(PATHS.forkCards)];
  const totalSets = setFiles.length;

  for (let i = 0; i < setFiles.length; i++) {
    const filename = setFiles[i];
    const setId = filename.replace('.json', '');

    try {
      logger.info('Processing set %s (%d/%d)', setId, i + 1, totalSets);

      // Read fork cards
      const forkCardsPath = path.join(PATHS.forkCards, filename);
      const forkCards = await Bun.file(forkCardsPath).json();

      // Get set object for embedding
      const setObject = setsMap.get(setId);
      if (!setObject) {
        throw new Error(`Set ${setId} not found in sets data`);
      }

      // Load existing cards for pricing preservation
      const existingCardsMap = await loadExistingCards(setId);

      // Transform cards: add set object and preserve/default pricing
      const transformedCards = forkCards.map((card) => {
        const existingCard = existingCardsMap?.get(card.id);
        return {
          ...card,
          set: setObject,
          tcgplayer: existingCard?.tcgplayer ?? null,
          cardmarket: existingCard?.cardmarket ?? null
        };
      });

      // Ensure directory exists
      const targetDir = path.join(PATHS.targetCards, `${setId}.d`);
      if (!dryRun) {
        const created = await ensureDir(targetDir);
        if (created) {
          stats.dirsCreated++;
          logger.info('Created directory: %s.d', setId);
        }
      }

      // Write cards
      const targetPath = path.join(targetDir, 'cards.json');
      if (!dryRun) {
        await Bun.write(
          targetPath,
          JSON.stringify({ data: transformedCards }, null, 2)
        );
      }

      stats.cardsProcessed += transformedCards.length;
    } catch (error) {
      const _error = new Error(`Error syncing set ${setId}: ${error.message}`);
      logger.error(_error.message);
      errors.push(_error);
      continue;
    }
  }

  // Summary
  logger.info('=== Sync Complete ===');
  logger.info('Sets synced: %d', stats.setsProcessed);
  logger.info('Cards synced: %d', stats.cardsProcessed);
  logger.info('Directories created: %d', stats.dirsCreated);
  logger.info('Errors: %d', errors.length);

  if (errors.length > 0) {
    throw new Error(
      `Encountered ${errors.length} errors during sync. See logs for details.`
    );
  }

  return stats;
}
