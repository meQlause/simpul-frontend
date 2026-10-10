import { useQuery } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { responseSchema } from './overview.schema';

export function useOverview() {
  return useQuery({
    queryKey: queryKeys.page('overview'),
    queryFn: () => getResponse('/overview', responseSchema),
  });
}
