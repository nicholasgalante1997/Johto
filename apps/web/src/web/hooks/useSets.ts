import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query';

import { SetsService } from '@/web/services';

type QueryResult = Awaited<
  ReturnType<InstanceType<typeof SetsService>['getSets']>
>;

const QUERY_KEY_SETS = 'sets' as const;

export function useSets(
  page?: number,
  count?: number,
  options: Partial<UseQueryOptions> = {}
): UseQueryResult<QueryResult, Error> {
  const keys = [QUERY_KEY_SETS, `page=${page}`, `count=${count}`];
  return useQuery({
    ...options,
    queryKey: keys,
    queryFn: () => new SetsService().getSets(page, count)
  }) as UseQueryResult<QueryResult, Error>;
}
