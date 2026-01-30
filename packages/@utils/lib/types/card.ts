import { z } from 'zod/mini';
import { type Pokemon } from '@pokemon/clients';
import { PokemonCardAttackSchema } from './attack.ts';
import { PokemonCardResistanceSchema } from './resistance.ts';
import { PokemonCardSetSchema } from './set.ts';
import { PokemonCardWeaknessSchema } from './weakness.ts';

export const PokemonCardSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  set: PokemonCardSetSchema,
  supertype: z.string(),
  number: z.optional(z.string()),
  subtypes: z.optional(z.array(z.string())),
  hp: z.optional(z.string()),
  types: z.optional(z.array(z.string())),
  evolvesTo: z.optional(z.array(z.string())),
  rules: z.optional(z.array(z.string())),
  attacks: z.optional(z.array(PokemonCardAttackSchema)),
  weaknesses: z.optional(z.array(PokemonCardWeaknessSchema)),
  resistances: z.optional(z.array(PokemonCardResistanceSchema)),
  retreatCost: z.optional(z.array(z.string())),
  convertedRetreatCost: z.optional(z.number()),
  artist: z.optional(z.string()),
  rarity: z.optional(z.string()),
  nationalPokedexNumbers: z.optional(z.array(z.number())),
  tcgplayer: z.optional(
    z.nullable(
      z.looseObject({
        url: z.string()
      })
    )
  ),
  cardmarket: z.optional(
    z.nullable(
      z.looseObject({
        url: z.string()
      })
    )
  ),
  legalities: z.optional(
    z.looseObject({
      unlimited: z.optional(z.string()),
      expanded: z.optional(z.string())
    })
  ),
  images: z.object({
    small: z.string(),
    large: z.string()
  })
});

export function isPokemonCard(value: unknown): value is Pokemon.Card {
  try {
    PokemonCardSchema.parse(value);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export const PokemonCardSchemaKey = z.keyof(PokemonCardSchema);

export type PokemonCardSchemaType = z.infer<typeof PokemonCardSchema>;
