export namespace Pokemon {
  export type Attack = {
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
  } & { [key: string]: any };

  export type Weakness = {
    type: string;
    value: string;
  } & { [key: string]: any };

  export type Resistance = {
    type: string;
    value: string;
  } & { [key: string]: any };

  export type Card = {
    id: string;
    name: string;
    supertype: string;
    subtypes: string[];
    hp: string;
    types: string[];
    evolvesTo: string[];
    rules: string[];
    attacks: Attack[];
    weaknesses: Weakness[];
    resistances: Resistance[];
    retreatCost: string[];
    convertedRetreatCost: number;
    set: Set;
    number: number;
    artist: string;
    rarity: string;
    nationalPokedexNumbers: string[];
    legalities: {
      unlimited: string;
      expanded: string;
    };
    images: {
      small: string;
      large: string;
    };
  } & { [key: string]: any };

  export type Set = {
    id: string;
    name: string;
    series: string;
    printedTotal: number;
    total: number;
    releaseDate: string;
    updatedAt: string;
    images: {
      symbol: string;
      logo: string;
    };
  } & { [key: string]: any };

  export interface Response<T> {
    data: T[];
    page: number;
    pageSize: number;
    count: number;
    totalCount: number;
  }

  export interface SetResponse extends Response<Set> {}

  export interface CardResponse extends Response<Card> {}
}
