import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { databaseSchema } from './database.schema';

export function useDatabase() {
  return useQuery({
    queryKey: queryKeys.page('database'),
    queryFn: () => getResponse('/database', databaseSchema),
  });
}

// A first connect leaves the setup page for `/`; caching the new status would first send it to
// the drawer. A replacement refreshes the drawer's own data.
export function useConnectDatabase(firstConnect: boolean) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: { connectionString: string; availabilityAck?: true }) =>
      getResponse('/database', databaseSchema, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: (response) => {
      if (!firstConnect) {
        client.setQueryData(queryKeys.page('database'), response);
      }
    },
  });
}
