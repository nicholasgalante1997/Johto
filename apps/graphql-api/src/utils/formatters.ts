import { sqlite } from '@pokemon/database';

const { parseJSON, parseJSONArray } = sqlite;

/**
 * Format a user from database row to GraphQL type
 */
export function formatUser(user: any) {
  return {
    id: user.id.toString(),
    username: user.username,
    email: user.email,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}

/**
 * Format a set from database row to GraphQL type
 */
export function formatSet(set: any) {
  return {
    id: set.id,
    name: set.name,
    series: set.series,
    printedTotal: set.printed_total || 0,
    total: set.total || 0,
    legalities: parseJSON(set.legalities),
    ptcgoCode: set.ptcgo_code,
    releaseDate: set.release_date,
    updatedAt: set.updated_at,
    images: parseJSON(set.images),
    createdAt: set.created_at
  };
}

/**
 * Format a card from database row to GraphQL type
 */
export function formatCard(card: any) {
  return {
    id: card.id,
    name: card.name,
    supertype: card.supertype,
    subtypes: parseJSONArray(card.subtypes),
    hp: card.hp,
    types: parseJSONArray(card.types),
    evolvesFrom: card.evolves_from,
    evolvesTo: parseJSONArray(card.evolves_to),
    rules: parseJSONArray(card.rules),
    abilities: parseJSONArray(card.abilities),
    attacks: parseJSONArray(card.attacks),
    weaknesses: parseJSONArray(card.weaknesses),
    resistances: parseJSONArray(card.resistances),
    retreatCost: parseJSONArray(card.retreat_cost),
    convertedRetreatCost: card.converted_retreat_cost,
    setId: card.set_id, // Keep for resolver to load set
    number: card.number,
    artist: card.artist,
    rarity: card.rarity,
    flavorText: card.flavor_text,
    nationalPokedexNumbers: parseJSONArray<string>(
      card.national_pokedex_numbers
    )?.map((n) => parseInt(n, 10)),
    legalities: parseJSON(card.legalities),
    images: parseJSON(card.images),
    tcgplayerUrl: card.tcgplayer_url,
    cardmarketUrl: card.cardmarket_url,
    createdAt: card.created_at,
    updatedAt: card.updated_at
  };
}

/**
 * Create a cursor from offset
 */
export function encodeCursor(offset: number): string {
  return Buffer.from(`cursor:${offset}`).toString('base64');
}

/**
 * Decode cursor to offset
 */
export function decodeCursor(cursor: string): number {
  const decoded = Buffer.from(cursor, 'base64').toString('utf8');
  const match = decoded.match(/^cursor:(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}
