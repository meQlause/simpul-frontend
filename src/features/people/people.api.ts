import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { responseSchema, savedPersonSchema, personInputSchema } from './people.schema';

export function usePeople() {
  return useQuery({
    queryKey: queryKeys.page('people'),
    queryFn: () => getResponse('/people', responseSchema),
  });
}

export function useSavePerson(personId: string, eligibleIds: string[]) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      getResponse(`/people/${personId}`, savedPersonSchema, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personInputSchema(personId, eligibleIds).parse(input)),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.page('people') }),
  });
}
