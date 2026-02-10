import { type Pokemon } from '../types/index.js';

import CardSearchQuery from './CardSearchQuery.js';
import {
  type default as PokemonSearchQuery,
  PokemonSearchQueryError
} from './SearchQuery.ts';
import SetSearchQuery from './SetSearchQuery.ts';

interface PokemonSearchQueryResponse {
  data: Pokemon.CardResponse | Pokemon.SetResponse | null;
  error?: unknown;
}

export default class PokemonTCGClient {
  private static readonly base = 'https://api.pokemontcg.io/v2/';

  private defaultOrderByParam = 'orderBy=-set.releaseDate';

  static getQueryBuilder(queryType: 'card' | 'set') {
    return queryType === 'card' ? new CardSearchQuery() : new SetSearchQuery();
  }

  private fetchWithAuth(url: string | Request, init: RequestInit = {}) {
    return fetch(url, {
      ...init,
      method: 'GET',
      headers: {
        ...(init?.headers ? init.headers : {}),
        Accept: 'application/json',
        'X-API-KEY': process.env.POKEMON_TCG_API_KEY!
      }
    });
  }

  public async *getAllSets(): AsyncGenerator<Pokemon.Set> {
    try {
      let page = 1;
      const pageSize = 250;
      let count = 0;
      let max = Infinity;

      while (count < max) {
        const url = `${PokemonTCGClient.base}sets?page=${page}&pageSize=${pageSize}&${this.defaultOrderByParam}`;
        const response = await this.fetchWithAuth(url);

        if (response.ok) {
          const data: Pokemon.SetResponse = await response.json();
          const {
            count: nextCount,
            data: json,
            page: nextPage,
            totalCount
          } = data;
          page = nextPage;
          count += nextCount;
          max = Math.min(max, totalCount);

          for (const set of json) {
            yield set;
          }
        } else {
          throw new Error(response.statusText);
        }
      }
    } catch (e) {
      /**
       * Implement failure metric emission logic here
       */
      throw e;
    }
  }

  public async *getAllCardsInSet(setId: string): AsyncGenerator<Pokemon.Card> {
    try {
      let page = 1;
      const pageSize = 250;
      let count = 0;
      let max = Infinity;

      while (count < max) {
        const url = `${PokemonTCGClient.base}cards?q=set.id:${setId}&orderBy=number&page=${page}&pageSize=${pageSize}`;
        const response = await this.fetchWithAuth(url);

        if (response.ok) {
          const data: Pokemon.CardResponse = await response.json();
          const {
            count: nextCount,
            data: json,
            page: nextPage,
            totalCount
          } = data;
          page = nextPage + 1;
          count += nextCount;
          max = Math.min(max, totalCount);

          for (const card of json) {
            yield card;
          }
        } else {
          throw new Error(response.statusText);
        }
      }
    } catch (e) {
      /**
       * Implement failure metric emission logic here
       */
      throw e;
    }
  }

  async search<Query extends PokemonSearchQuery>(
    query: Query
  ): Promise<PokemonSearchQueryResponse> {
    const isCardQuery = query instanceof CardSearchQuery;
    const queryType = isCardQuery ? 'cards' : 'sets';
    const url = `${PokemonTCGClient.base}${queryType}?${query.toString()}`;
    const response = await this.fetchWithAuth(url);

    if (response.ok) {
      const data: Pokemon.CardResponse | Pokemon.SetResponse =
        await response.json();
      return {
        data
      };
    }

    return {
      data: null,
      error: new PokemonSearchQueryError(response.statusText, response.status)
    };
  }
}
