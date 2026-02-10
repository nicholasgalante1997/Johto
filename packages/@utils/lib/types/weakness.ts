import { z } from 'zod';
import { type Pokemon } from '@pokemon/clients';

export const PokemonCardWeaknessSchema = z.object({
  type: z.string(),
  value: z.string()
});

export type PokemonCardWeaknessSchemaType = z.infer<
  typeof PokemonCardWeaknessSchema
>;

export function isPokemonCardWeakness(
  value: unknown
): value is Pokemon.Weakness {
  try {
    PokemonCardWeaknessSchema.parse(value);
    return true;
  } catch (e) {
    return false;
  }
}
