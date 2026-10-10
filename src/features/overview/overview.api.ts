import { useQuery } from '@tanstack/react-query';
import { apiUrl, getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { responseSchema } from './overview.schema';

export function exportSummary() {
  window.location.assign(apiUrl('/work/export'));
}

export function useOverview() {
  return useQuery({
    queryKey: queryKeys.page('overview'),
    queryFn: () => getResponse('/overview', responseSchema),
  });
}
