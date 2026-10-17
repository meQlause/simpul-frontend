import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import {
  responseSchema,
  savedPersonSchema,
  personInputSchema,
  newPersonSchema,
  signedInPersonSchema,
} from './people.schema';

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

export function useCreatePerson() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: unknown) =>
      getResponse('/people', savedPersonSchema, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPersonSchema.parse(input)),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.page('people') }),
  });
}

export function useDeactivatePerson(personId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () =>
      getResponse(`/people/${personId}`, savedPersonSchema, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.page('people') }),
  });
}

// The signed-in admin cannot be deactivated (FR-UI-23): the drawer hides the button for them.
export function useSignedInPersonId() {
  return useQuery({
    queryKey: queryKeys.page('signed-in-person'),
    queryFn: () => getResponse('/me', signedInPersonSchema),
    select: (response) => response.data.person.id,
  });
}
