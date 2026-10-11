import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiUrl, getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { detailSchema, responseSchema, type closureSchema } from './work.schema';
import type { infer as Infer } from 'zod';

export async function exportWork(filter: string) {
  const response = await fetch(apiUrl('/work/export?' + filter), { credentials: 'include' });

  if (!response.ok) {
    throw new Error('Export failed');
  }

  return response.blob();
}

export function useWork(filter = '') {
  return useInfiniteQuery({
    queryKey: [...queryKeys.page('work'), filter],
    initialPageParam: '',
    queryFn: ({ pageParam }) =>
      getResponse(
        '/work?' + filter + (pageParam ? '&cursor=' + encodeURIComponent(pageParam) : ''),
        responseSchema,
      ),
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  });
}

export function useWorkDetail(displayId: string) {
  return useQuery({
    queryKey: ['work-detail', displayId],
    queryFn: () => getResponse('/work/' + displayId, detailSchema),
    enabled: !!displayId,
  });
}

export function useWorkChange(displayId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: Infer<typeof closureSchema> | undefined) =>
      getResponse('/work/' + displayId + '/close' + (input ? '' : '/undo'), detailSchema, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input ?? {}),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.page('work') });
      await client.invalidateQueries({ queryKey: ['work-detail', displayId] });
    },
  });
}
