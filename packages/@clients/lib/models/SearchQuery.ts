export default abstract class PokemonSearchQuery {
  page = 1;
  pageSize = 100;

  queries: Array<[string, string]> = [];

  orderBy = '&orderBy=-set.releaseDate';

  public setQueryParam(key: string, value: string) {
    this.queries.push([key, value]);
    return this;
  }

  public setOrderBy(orderBy: string) {
    this.orderBy = `&orderBy=${orderBy}`;
    return this;
  }

  public toString() {
    const queryString = this.queries
      .map((queryItem) => queryItem.join(':'))
      .join(' ');
    return `q=${encodeURIComponent(queryString)}${this.orderBy}&page=${this.page}&pageSize=${this.pageSize}`;
  }
}

export class PokemonSearchQueryError extends Error {
  constructor(message: string, code: number) {
    super(`[HttpError]:HttpStatusCode=${code},HttpStatusText="${message}"`);
    this.name = 'PokemonSearchQueryError';
  }
}
