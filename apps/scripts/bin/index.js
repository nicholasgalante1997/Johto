import { Command } from 'commander';
import { scaffold, syncCards, syncPokemonJson, syncSets } from "../lib/index.js";

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

program.command('json:sync')
  .description('Synchronizes JSON data from the Pokemon TCG API V2')
  .action(async () => {
    await syncPokemonJson();
  });

program
  .command('scaffold')
  .argument('<type>', 'Type of thing to scaffold, either "lib", "rs-app", "ts-app", or "web-app"')
  .argument('name', 'Name of the thing')
  .action(async (type, name) => {
    const knownScaffoldingTypes = ['lib', 'rs-app', 'ts-app', 'web-app'];
    
    if (!knownScaffoldingTypes.includes(type)) {
      throw new Error(`Unknown scaffolding type ${type}`);
    }
    
    await scaffold(type, name);
  })

program.parse();