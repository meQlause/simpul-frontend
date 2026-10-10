import { useQuery } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { responseSchema } from './review-queue.schema';

export function useReviewQueue() {
  return useQuery({
    queryKey: queryKeys.page('review-queue'),
    queryFn: () => getResponse('/review-items', responseSchema),
  });
}
