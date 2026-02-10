import { z } from 'zod/mini';
import { type Pokemon } from '@pokemon/clients';

export const PokemonCardSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  series: z.string(),
  printedTotal: z.number(),
  total: z.number(),
  releaseDate: z.string(),
  updatedAt: z.string(),
  images: z.object({
    symbol: z.string(),
    logo: z.string()
  })
});

export type PokemonCardSetSchemaType = z.infer<typeof PokemonCardSetSchema>;

export const PokemonCardSetSchemaKey = z.keyof(PokemonCardSetSchema);

export function isPokemonCardSet(value: unknown): value is Pokemon.Set {
  try {
    PokemonCardSetSchema.parse(value);
    return true;
  } catch (e) {
    return false;
  }
}
