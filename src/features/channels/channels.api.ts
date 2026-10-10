import { useQuery } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { responseSchema } from './channels.schema';

export function useChannels() {
  return useQuery({
    queryKey: queryKeys.page('channels'),
    queryFn: () => getResponse('/channels', responseSchema),
  });
}
