import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query';

import { SetsService } from '@/web/services';

type QueryResult = Awaited<
  ReturnType<InstanceType<typeof SetsService>['getSet']>
>;

const QUERY_KEY_SET = 'set' as const;

export function useSet(
  id: string,
  options: Partial<UseQueryOptions> = {}
): UseQueryResult<QueryResult, Error> {
  const keys = [QUERY_KEY_SET, id];
  return useQuery({
    ...options,
    queryKey: keys,
    queryFn: () => new SetsService().getSet(id)
  }) as UseQueryResult<QueryResult, Error>;
}
