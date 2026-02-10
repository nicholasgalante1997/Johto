import type { Pokemon } from '@pokemon/clients';

/**
 * Database row type for sets (with JSON fields as strings)
 */
export interface SetRow {
  id: string;
  name: string;
  series: string;
  printed_total: number | null;
  total: number | null;
  legalities: string | null;
  ptcgo_code: string | null;
  release_date: string | null;
  updated_at: string | null;
  images: string | null;
  created_at: string;
}

/**
 * Re-export Pokemon types for convenience
 */
export type Set = Pokemon.Set;
