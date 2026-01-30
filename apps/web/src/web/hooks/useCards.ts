import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query';

import { CardsService } from '@/web/services';

type QueryResult = Awaited<
  ReturnType<InstanceType<typeof CardsService>['getCards']>
>;

const QUERY_KEY_CARDS = 'cards' as const;

export function useCards(
  page?: number,
  count?: number,
  options: Partial<UseQueryOptions> = {}
): UseQueryResult<QueryResult, Error> {
  const keys = [QUERY_KEY_CARDS, `page=${page}`, `count=${count}`];
  return useQuery({
    ...options,
    queryKey: keys,
    queryFn: () => new CardsService().getCards(page, count)
  }) as UseQueryResult<QueryResult, Error>;
}
