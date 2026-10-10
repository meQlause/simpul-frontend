import { useQuery } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { responseSchema } from './settings.schema';

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.page('settings'),
    queryFn: () => getResponse('/settings', responseSchema),
  });
}
