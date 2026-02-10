import { sqlite } from '@pokemon/database';

export function printDB(db) {
  const limit = 20_000;
  const sets = sqlite.findAllSets(db)();
  const cards = sqlite.findAllCards(db)(limit);
  console.log('Printing contents of pokemon-data.sqlite3.db ...');
  console.log('\t\tSets: ' + sets.length);
  console.log('\t\tCards: ' + cards.length);
}
