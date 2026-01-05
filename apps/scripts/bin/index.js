import 'dotenv/config.js';
import { Command } from 'commander';
import {
  scaffold,
  syncCards,
  syncPokemonJson,
  syncSets,
  sqlite,
  printDB
} from '../lib/index.js';

const program = new Command();

program
  .command('db:sync')
  .description(
    'Synchronizes our local TCG DataStore with the Pokemon TCG API V2'
  )
  .action(async () => {
    await syncSets();
    await syncCards();
  });

program
  .command('db:sqlite:init')
  .description(
    'Initializes an in memory sqlite db with the locally fetched Pokemon TCG API V2'
  )
  .action(async () => {
    await sqlite.initDatabase(sqlite.getSqlite3Database());
  });

program
  .command('db:sqlite:print')
  .description(
    'Prints the content of Pokemon TCG API V2 (./database/pokemon-data.sqlite3.db)'
  )
  .action(() => {
    const db = sqlite.getSqlite3Database();
    printDB(db);
  });

program
  .command('json:sync')
  .description('Synchronizes JSON data from the Pokemon TCG API V2')
  .action(async () => {
    await syncPokemonJson();
  });

program
  .command('scaffold')
  .argument(
    '<type>',
    'Type of thing to scaffold, either "lib", "rs-app", "ts-app", or "web-app"'
  )
  .argument('name', 'Name of the thing')
  .action(async (type, name) => {
    const knownScaffoldingTypes = ['lib', 'rs-app', 'ts-app', 'web-app'];

    if (!knownScaffoldingTypes.includes(type)) {
      throw new Error(`Unknown scaffolding type ${type}`);
    }

    await scaffold(type, name);
  });

program.parse();
