import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query';

import { CardsService } from '@/web/services';

type QueryResult = Awaited<
  ReturnType<InstanceType<typeof CardsService>['getCard']>
>;

const QUERY_KEY_CARD = 'card' as const;

export function useCard(
  id: string,
  options: Partial<UseQueryOptions> = {}
): UseQueryResult<QueryResult, Error> {
  const keys = [QUERY_KEY_CARD, id];
  return useQuery({
    ...options,
    queryKey: keys,
    queryFn: () => new CardsService().getCard(id)
  }) as UseQueryResult<QueryResult, Error>;
}
