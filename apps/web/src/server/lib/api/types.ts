import type { Pokemon } from '@pokemon/clients';

// Re-export types from clients package
export type { Pokemon } from '@pokemon/clients';

// Database row types (with JSON fields as strings)
export type CardRow = {
  id: string;
  name: string;
  supertype: string;
  subtypes: string; // JSON array
  hp: number | null;
  types: string; // JSON array
  evolves_from: string | null;
  evolves_to: string | null; // JSON array
  rules: string | null; // JSON array
  abilities: string | null; // JSON array
  attacks: string | null; // JSON array
  weaknesses: string | null; // JSON array
  retreat_cost: string | null; // JSON array
  converted_retreat_cost: number | null;
  set_id: string;
  number: string;
  artist: string | null;
  rarity: string | null;
  flavor_text: string | null;
  national_pokedex_numbers: string | null; // JSON array
  legalities: string | null; // JSON object
  images: string | null; // JSON object
  tcgplayer_url: string | null;
  cardmarket_url: string | null;
  created_at: string;
  updated_at: string;
};

export type SetRow = {
  id: string;
  name: string;
  series: string;
  printed_total: number | null;
  total: number | null;
  legalities: string | null; // JSON object
  ptcgo_code: string | null;
  release_date: string | null;
  updated_at: string | null;
  images: string | null; // JSON object
  created_at: string;
};

// Pagination metadata
export type PaginationMeta = {
  page: number;
  pageSize: number;
  count: number; // Items in current response
  totalCount: number; // Total items in database
};

// API Response wrapper
export type ApiResponse<T> = {
  data: T;
  meta?: PaginationMeta;
};

// Error response
export type ApiError = {
  error: {
    message: string;
    code: string;
    status: number;
  };
};
