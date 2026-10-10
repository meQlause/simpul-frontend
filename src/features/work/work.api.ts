import { useQuery } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { responseSchema } from './work.schema';

export function useWork() {
  return useQuery({
    queryKey: queryKeys.page('work'),
    queryFn: () => getResponse('/work', responseSchema),
  });
}
