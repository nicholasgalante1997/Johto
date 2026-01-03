import { z } from 'zod/mini';
import { type Pokemon } from '@pokemon/clients';

export const PokemonCardAttackSchema = z.looseObject({
  name: z.string(),
  cost: z.array(z.string()),
  convertedEnergyCost: z.number(),
  damage: z.optional(z.string()),
  text: z.string()
});

export type PokemonCardAttackSchemaType = z.infer<typeof PokemonCardAttackSchema>;

export function isPokemonCardAttack(value: unknown): value is Pokemon.Attack {
  try {
    PokemonCardAttackSchema.parse(value);
    return true;
  } catch (e) {
    return false;
  }
}
