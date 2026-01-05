import PokemonSearchQuery from './SearchQuery.js';

export type CommonSetSearchCriteria = 'name' | 'id' | 'base';

export default class PokemonSetSearchQuery extends PokemonSearchQuery {
  constructor() {
    super();
  }

  set(term: CommonSetSearchCriteria, value: string) {
    return this.setQueryParam(term, value);
  }
}
