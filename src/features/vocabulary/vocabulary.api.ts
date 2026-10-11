import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z as schema } from 'zod';
import { getResponse } from '../../shared/api/client';
import { vocabularyResponse } from './vocabulary.schema';

export function useVocabulary() {
  return useQuery({
    queryKey: ['vocabulary'],
    queryFn: () => getResponse('/vocabulary', vocabularyResponse),
  });
}

export function useVocabularyWrite() {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['vocabulary-write'],
    mutationFn: (request: { path: string; method: string; input: unknown }) =>
      getResponse(request.path, schema.object({ data: schema.unknown() }), {
        method: request.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.input),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['vocabulary'] }),
  });
}
