import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiUrl, getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { decisionsSchema, identitySchema, responseSchema } from './overview.schema';

export function exportSummary() {
  window.location.assign(apiUrl('/work/export'));
}

export function useOverview(period = 'today') {
  return useQuery({
    queryKey: [...queryKeys.page('overview'), period],
    queryFn: () => getResponse('/overview?period=' + period, responseSchema),
    placeholderData: keepPreviousData,
  });
}

export function useOverviewIdentity() {
  return useQuery({ queryKey: ['overview-me'], queryFn: () => getResponse('/me', identitySchema) });
}

export function useLatestUpdates() {
  return useQuery({
    queryKey: ['overview-decisions'],
    queryFn: () => getResponse('/decisions?limit=3', decisionsSchema),
    retry: false,
  });
}
