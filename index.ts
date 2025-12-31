#! /usr/bin/env bun

import 'dotenv/config.js';

import { Agent } from 'undici';

import sets from './packages/@pokemon-data/data/sets.json';

import fs from 'fs/promises';
import { inspect } from 'node:util';
import path from 'node:path';

const filters = ['Mega Evolution', 'Scarlet & Violet', 'Sword & Shield'];

const page = 1;
const pageSize = 2000;

const getCards = (setId: string) => {
  const agent = new Agent({
    connectTimeout: 60000,
    bodyTimeout: 60000,
    headersTimeout: 60000
  });
  const req = new Request(
    `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&orderBy=number&page=${page}&pageSize=${pageSize}`,
    {
      dispatcher: agent,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-API-KEY': process.env.POKEMON_TCG_API_KEY!
      }
    } as any
  );
  return fetch(req);
};

const getCard = (cardId: string) => {
  const selectAttrs = [
    'name',
    'id',
    'supertype',
    'subtype',
    'images',
    'hp',
    'attacks',
    'resistances',
    'types',
    'evolvesTo',
    'rules',
    'retreatCost',
    'convertedRetreatCost',
    'weaknesses',
    'number',
    'artist',
    'rarity',
    'nationalPokedexNumbers'
  ];
  const req = new Request(
    `https://api.pokemontcg.io/v2/cards/${cardId}?select=${selectAttrs.join(',')}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-API-KEY': process.env.POKEMON_TCG_API_KEY!
      }
    }
  );
  return fetch(req);
};

const hasCardsData = async (set: any) => {
  const data = await Bun.file(
    path.resolve(process.cwd(), 'packages', '@pokemon-data', 'data', 'cards', `${set.id}.d`, 'cards.json')
  ).json();

  return data && data.data && data.data.length > 0;
};

async function pullMissingSets() {
  let fsets: any[] = [];

  for (const set of sets.data) {
    if (!(await hasCardsData(set))) {
      fsets.push([set.id, set.total]);
    }
  }

  // fsets = fsets.filter(([setId]) => setId.startsWith('swsh') || setId.startsWith('sv'))

  console.log(inspect(fsets, false, null, true));

  const write = false;

  if (write) {
    for (const fset of fsets) {
      const [setId, total] = fset;
      console.log(`Set ${setId} is missing cards data, fetching...`);

      const cards = [];
      for (let x = 1; x <= total; x++) {
        const response = await getCard(`${setId}-${x}`);
        if (response.ok) {
          const data = await response.json();
          cards.push(data);
        } else {
          console.error(
            `Error fetching card ${setId}-${x} - (${response.status}) ${response.statusText}`
          );
          throw new Error(response.statusText);
        }
      }

      console.log('Finished pulling set');
      const jsonFilePath = path.resolve(
        process.cwd(),
        'data',
        'sets',
        `${setId}.d`,
        'cards.json'
      );

      await Bun.write(jsonFilePath, JSON.stringify(cards), {
        createPath: true
      });
      console.log(`Wrote ${cards.length} cards for set ${setId}`);
    }
  }
}

async function pullCardsInSetOneShot(fsets: string[]) {
  const dex = new Map();

  for (const setId of fsets) {
    console.log(`Fetching cards for set: ${setId}`);
    const response = await getCards(setId);
    if (response.ok) {
      const data = await response.json();
      if (!data) {
        console.error(`No data for set: ${setId}`);
        throw new Error(response.statusText);
      }

      console.log(`Fetched ${data?.data?.length} cards for set: ${setId}`);
      dex.set(setId, data);
    } else {
      console.error(
        `Error fetching cards for set: ${setId} - (${response.status}) ${response.statusText}`
      );

      // Try to parse error response as JSON, but don't fail if it's not JSON
      try {
        const errorData = await response.json();
        console.error(errorData);
      } catch {
        // Response is not JSON (common for 504/503 errors)
        console.error('Response body is not valid JSON');
      }

      throw new Error(response.statusText);
    }
  }

  try {
    await Bun.write(
      './data/pokemon-dex-recent2.json',
      JSON.stringify(Object.fromEntries(dex), null, 2)
    );
  } catch (e) {
    console.error('Error writing file:', e);
  }
}

async function consolidateSets() {
  const cards = path.resolve(process.cwd(), 'data', 'pokemon-json', 'cards');
  const files = await fs.readdir(cards, {
    encoding: 'utf-8',
    recursive: true,
    withFileTypes: true
  });
  for (const set of sets.data) {
    const jsonFilePath = path.resolve(
      process.cwd(),
      'data',
      'sets',
      `${set.id}.d`,
      'cards.json'
    );
    if (await Bun.file(jsonFilePath).exists()) {
      console.log(`cards.json for set ${set.id} already exists, skipping`);
      continue;
    }

    const setCards = [];
    const filtered_files = files.filter((file) => file.name.startsWith(set.id));
    for (const file of filtered_files) {
      const filePath = path.resolve(file.parentPath, file.name);
      const card = await Bun.file(filePath).json();
      setCards.push(card);
    }

    /**
     * Write cards to sets/{{id}}.d/cards.json
     */
    await Bun.write(jsonFilePath, JSON.stringify({ data: setCards }), {
      createPath: true
    });

    console.log(`Wrote ${setCards.length} cards for set ${set.id}`);
  }
}

await pullMissingSets();
