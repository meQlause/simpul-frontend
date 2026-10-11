import { useQuery } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { attentionSchema, meSchema, overviewSchema } from './shell.schema';

export function useShellData() {
  const person = useQuery({
    queryKey: queryKeys.page('shell-me'),
    queryFn: () => getResponse('/me', meSchema),
  });
  const overview = useQuery({
    queryKey: queryKeys.page('shell-overview'),
    queryFn: () => getResponse('/overview', overviewSchema),
  });
  const attention = useQuery({
    queryKey: queryKeys.page('shell-attention'),
    queryFn: () => getResponse('/review-items?limit=1', attentionSchema),
  });

  return {
    me: person.data?.data,
    workCount: overview.data?.data.activeWork.count,
    attentionCount: attention.data?.page.total,
  };
}
