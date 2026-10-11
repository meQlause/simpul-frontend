import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z as schema } from 'zod';
import { getResponse } from '../../shared/api/client';
import { listResponse, traceResponse } from './audit.schema';

export function useAudit(kind: string, search: string) {
  const params = new URLSearchParams();

  if (kind) {
    params.set('kind', kind);
  }

  if (search) {
    params.set('q', search);
  }

  const query = params.toString();
  const suffix = query ? '?' + query : '';

  return useQuery({
    queryKey: ['audit', kind, search],
    queryFn: () => getResponse(`/decisions${suffix}`, listResponse),
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
