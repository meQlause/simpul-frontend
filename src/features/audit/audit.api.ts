import { useQuery } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { responseSchema } from './audit.schema';

export function useAudit() {
  return useQuery({
    queryKey: queryKeys.page('audit'),
    queryFn: () => getResponse('/decisions', responseSchema),
  });
}
