import { useMutation, useQuery } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { responseSchema, settingsInputSchema } from './settings.schema';

export function useSettings() {
  const query = useQuery({
    queryKey: queryKeys.page('settings'),
    queryFn: () => getResponse('/settings', responseSchema),
  });
  const save = useMutation({
    mutationFn: (input: unknown) =>
      getResponse('/settings', responseSchema, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsInputSchema.parse(input)),
      }),
  });
  return { ...query, save };
}
