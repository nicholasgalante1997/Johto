import PokemonSearchQuery from './SearchQuery.js';
import { type CommonSetSearchCriteria } from './SetSearchQuery.js';

type CommonCardSearchCriteria =
  | `set.${string | CommonSetSearchCriteria}`
  | 'id'
  | 'name'
  | 'subtype'
  | 'supertype'
  | 'evolvesTo';

export default class PokemonCardSearchQuery extends PokemonSearchQuery {
  constructor() {
    super();
  }

  set(term: CommonCardSearchCriteria, value: string) {
    return this.setQueryParam(term, value);
  }
}
