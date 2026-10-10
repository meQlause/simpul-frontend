import { useQuery } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { responseSchema } from './rules.schema';

export function useRules() {
  return useQuery({
    queryKey: queryKeys.page('rules'),
    queryFn: () => getResponse('/rules', responseSchema),
  });
}
