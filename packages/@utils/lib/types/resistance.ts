import { z } from 'zod';
import { type Pokemon } from '@pokemon/clients';

export const PokemonCardResistanceSchema = z.object({
  type: z.string(),
  value: z.string()
});

export type PokemonCardResistanceSchemaType = z.infer<
  typeof PokemonCardResistanceSchema
>;

export function isPokemonCardResistance(
  value: unknown
): value is Pokemon.Resistance {
  try {
    PokemonCardResistanceSchema.parse(value);
    return true;
  } catch (e) {
    return false;
  }
}
