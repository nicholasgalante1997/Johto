/**
 * GRAPHQL TYPE DEFINITIONS
 *
 * TypeScript types matching the GraphQL schema for type-safe queries and mutations
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Set {
  id: string;
  name: string;
  series: string;
  printed_total: number;
  total: number;
  images: string;
  legalities: string;
  ptcgo_code: string;
  release_date: string;
  updated_at?: string;
  created_at?: string;
}

export interface Card {
  id: string;
  name: string;
  supertype: string;
  subtypes: string;
  hp?: number;
  types?: string;
  evolves_from?: string;
  evolves_to?: string;
  rules?: string;
  abilities?: string;
  attacks?: string;
  weaknesses?: string;
  retreat_cost?: string;
  converted_retreat_cost?: number;
  set_id: string;
  number: string;
  artist?: string;
  rarity?: string;
  flavor_text?: string;
  national_pokedex_numbers?: string;
  legalities?: string;
  images?: string;
  tcgplayer_url?: string;
  cardmarket_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Deck {
  id: string;
  name: string;
  cards: string[];
  metadata?: string;
}

// ============================================================================
// QUERY RESPONSE TYPES
// ============================================================================

export interface GetUserResponse {
  user: User;
}

export interface GetUsersResponse {
  users: User[];
}

export interface GetSetResponse {
  set: Set;
}

export interface GetSetsResponse {
  sets: Set[];
}

export interface GetSetsBySeriesResponse {
  setsBySeries: Set[];
}

export interface GetCardResponse {
  card: Card;
}

export interface GetCardsBySetResponse {
  cardsBySet: Card[];
}

export interface GetCardsByNameResponse {
  cardsByName: Card[];
}

export interface GetCardsResponse {
  cards: Card[];
}

export interface CardAbility {
  name: string;
  type: string;
  text: string;
}

export interface CardAttack {
  name: string;
  cost?: string[];
  damage?: string;
  text?: string;
  convertedEnergyCost?: number;
}

export interface CardWeakness {
  type: string;
  value: string;
}

export interface CardResistance {
  type: string;
  value: string;
}

export interface CardImages {
  small?: string;
  large?: string;
}

export interface CardLegalities {
  standard?: string;
  expanded?: string;
  unlimited?: string;
}

export interface CardSet {
  id: string;
  name: string;
  releaseDate?: string;
}

/**
 * Card type matching the GraphQL response for GET_CARD_BY_ID
 */
export interface CardDetail {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: number;
  types?: string[];
  evolvesFrom?: string;
  evolvesTo?: string[];
  rules?: string[];
  abilities?: CardAbility[];
  attacks?: CardAttack[];
  weaknesses?: CardWeakness[];
  resistances?: CardResistance[];
  retreatCost?: string[];
  convertedRetreatCost?: number;
  number: string;
  artist?: string;
  rarity?: string;
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  legalities?: CardLegalities;
  images?: CardImages;
  set?: CardSet;
  tcgplayerUrl?: string;
  cardmarketUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetCardDetailResponse {
  card: CardDetail;
}

export interface SearchCardNode {
  id: string;
  name: string;
  hp?: number;
  supertype: string;
  subtypes?: string[];
  types?: string[];
  rarity?: string;
  artist?: string;
  number: string;
  images?: {
    small?: string;
    large?: string;
  };
  legalities?: {
    standard?: string;
    expanded?: string;
    unlimited?: string;
  };
  set: {
    id: string;
    name: string;
    releaseDate: string;
  };
}

export interface SearchCardsResponse {
  cards: {
    edges: Array<{
      node: SearchCardNode;
    }>;
    totalCount: number;
  };
}

export interface SearchCardsVariables {
  name?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// MUTATION RESPONSE TYPES
// ============================================================================

export interface CreateUserResponse {
  createUser: User;
}

export interface UpdateUserResponse {
  updateUser: User | null;
}

export interface DeleteUserResponse {
  deleteUser: boolean;
}

export interface CreateSetResponse {
  createSet: Set;
}

export interface CreateCardResponse {
  createCard: Card;
}

export interface DeleteCardResponse {
  deleteCard: boolean;
}

// ============================================================================
// QUERY VARIABLES
// ============================================================================

export interface GetUserVariables {
  userId: string;
}

export interface GetUsersVariables {
  limit?: number;
}

export interface GetSetVariables {
  setId: string;
}

export interface GetSetsVariables {
  limit?: number;
}

export interface GetSetsBySeriesVariables {
  series: string;
}

export interface GetCardVariables {
  cardId: string;
}

export interface GetCardsBySetVariables {
  setId: string;
}

export interface GetCardsByNameVariables {
  name: string;
}

export interface GetCardsVariables {
  limit?: number;
  offset?: number;
}

// ============================================================================
// MUTATION VARIABLES
// ============================================================================

export interface CreateUserVariables {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserVariables {
  id: string;
  username: string;
  email: string;
  password: string;
}

export interface DeleteUserVariables {
  id: string;
}

export interface CreateSetVariables {
  id: string;
  name: string;
  series: string;
  printed_total?: number;
  total?: number;
  ptcgo_code?: string;
  release_date?: string;
  images?: string;
}

export interface CreateCardVariables {
  id: string;
  name: string;
  supertype: string;
  subtypes: string;
  set_id: string;
  number: string;
  hp?: number;
  types?: string;
  rarity?: string;
  artist?: string;
}

export interface DeleteCardVariables {
  id: string;
}
