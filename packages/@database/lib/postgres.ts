import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { type Pokemon } from '@pokemon/clients';
import { Primitives } from '@pokemon/utils';

function getPool() {
  const config = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432
  };

  return new Pool(config);
}

async function runQuery<Item extends QueryResultRow>(
  pool: Pool,
  query: string,
  params: any[]
) {
  const client = await pool.connect();

  let data: QueryResult<Item> | null = null;
  let error: Error | null = null;

  try {
    data = await client.query(query, params);
  } catch (e) {
    error = e instanceof Error ? e : new Error('GenericPostgresInsertError');
  } finally {
    client.release();

    if (error) {
      throw error;
    }

    if (data) {
      return data;
    }
  }
}

async function insertSet(pool: Pool, set: Pokemon.Set) {
  const query = `
    INSERT INTO pokemon_card_sets (
      id, name, series, printed_total, total, legalities, ptcgo_code, release_date, updated_at, images
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
    ) ON CONFLICT (id) DO NOTHING;
  `;

  const params = [
    set.id,
    set.name,
    set.series,
    set.printedTotal,
    set.total,
    JSON.stringify(set.legalities),
    set.ptcgoCode,
    set.releaseDate,
    set.updatedAt,
    JSON.stringify(set.images)
  ];

  return await runQuery(pool, query, params);
}

async function insertCard(pool: Pool, card: Pokemon.Card) {
  const query = `
    INSERT INTO pokemon_cards (
      id, 
      name, 
      supertype, 
      subtypes, 
      hp, 
      types, 
      evolves_from, 
      evolves_to, 
      rules, 
      abilities, 
      attacks, 
      weaknesses, 
      retreat_cost,
      converted_retreat_cost, 
      set_id, 
      number, 
      artist, 
      rarity, 
      flavor_text, 
      national_pokedex_numbers, 
      legalities,
      images, 
      tcgplayer_url, 
      tcgplayer_updated_at, 
      tcgplayer_prices, 
      cardmarket_url, 
      cardmarket_updated_at,
      cardmarket_prices
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
    ) ON CONFLICT (id) DO NOTHING;
  `;

  const params = [
    card.id /** Will need ID to be unique non-null non-default value */,
    card.name /** Will also need name */,
    Primitives.coerceToString(card.supertype),
    Primitives.coerceToArray(card.subtypes),
    parseInt(Primitives.coerceToString(card.hp, '0'), 10),
    Primitives.coerceToArray(card.types),
    Primitives.coerceToArray(card?.evolvesFrom),
    Primitives.coerceToArray(card?.evolvesTo),
    Primitives.coerceToArray(card?.rules),
    JSON.stringify(card.abilities || []),
    JSON.stringify(card.attacks || []),
    JSON.stringify(card.weaknesses || []),
    JSON.stringify(card.retreatCost || []),
    card?.convertedRetreatCost || 0,
    card.set.id,
    Primitives.coerceToString(card.number),
    Primitives.coerceToString(card.artist),
    Primitives.coerceToString(card.rarity),
    Primitives.coerceToString(card.flavorText),
    JSON.stringify(card?.nationalPokedexNumbers || []),
    JSON.stringify(card?.legalities || {}),
    JSON.stringify(card?.images || {}),
    Primitives.coerceToString(card?.tcgplayer?.url, '#no-url'),
    null,
    null,
    null,
    null,
    null
  ];

  return await runQuery(pool, query, params);
}

export { insertSet, insertCard, getPool };
