import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { detailSchema, resolvedSchema, responseSchema } from './review-queue.schema';

export function useReviewQueue(filter = '') {
  return useInfiniteQuery({
    queryKey: [...queryKeys.page('review-queue'), filter],
    initialPageParam: '',
    queryFn: ({ pageParam }) =>
      getResponse(
        '/review-items?' + filter + (pageParam ? '&cursor=' + encodeURIComponent(pageParam) : ''),
        responseSchema,
      ),
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  });
}

export function useReviewItem(id: string) {
  return useQuery({
    queryKey: ['review-item', id],
    queryFn: () => getResponse('/review-items/' + id, detailSchema),
  });
}

export function useResolveReview(id: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: Record<string, string>) =>
      getResponse('/review-items/' + id + '/resolve', resolvedSchema, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await Promise.all(
        ['review-queue', 'shell-attention', 'shell-overview', 'overview', 'vocabulary'].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      );
      client.removeQueries({ queryKey: ['review-item', id] });
    },
  });
}
