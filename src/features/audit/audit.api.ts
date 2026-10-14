import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { z as schema } from 'zod';
import { getResponse } from '../../shared/api/client';
import {
  correctionResponse,
  listResponse,
  messagesResponse,
  traceResponse,
  type MessagesPage,
} from './audit.schema';

export function useAudit(kind: string, search: string) {
  return useInfiniteQuery({
    queryKey: ['audit', kind, search],
    initialPageParam: '',
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();

      for (const [key, value] of [
        ['kind', kind],
        ['q', search],
        ['cursor', pageParam],
      ]) {
        if (value) {
          params.set(key, value);
        }
      }

      const query = params.toString();

      return getResponse(`/decisions${query ? '?' + query : ''}`, listResponse);
    },
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  });
}

const MESSAGES_KEY = 'audit-messages';

export function useMessages(outcome: string, search: string) {
  return useInfiniteQuery({
    queryKey: [MESSAGES_KEY, outcome, search],
    initialPageParam: '',
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();

      for (const [key, value] of [
        ['outcome', outcome],
        ['q', search],
        ['cursor', pageParam],
      ]) {
        if (value) {
          params.set(key, value);
        }
      }

      const query = params.toString();

      return getResponse(`/messages${query ? '?' + query : ''}`, messagesResponse);
    },
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  });
}

export function useCorrectMessage() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ unitId, body }: { unitId: string; body: Record<string, unknown> }) =>
      getResponse(`/messages/${unitId}/correct`, correctionResponse, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: ({ data }) => {
      client.setQueriesData<InfiniteData<MessagesPage>>(
        { queryKey: [MESSAGES_KEY] },
        (old) =>
          old && {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((row) => (row.unitId === data.unitId ? data : row)),
            })),
          },
      );
      void client.invalidateQueries({ queryKey: [MESSAGES_KEY] });
      void client.invalidateQueries({ queryKey: ['work'] });
    },
  });
}

export function useTrace(id: string) {
  return useQuery({
    queryKey: ['audit-trace', id],
    queryFn: () => getResponse(`/decisions/${id}`, traceResponse),
  });
}

export function usePauseRule() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, active }: { ruleId: string; active: boolean }) =>
      getResponse(`/rules/${ruleId}`, schema.object({ data: schema.unknown() }), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['audit-trace'] });
      void client.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}
