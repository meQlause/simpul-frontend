import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { responseSchema, settingsInputSchema, workspaceSchema } from './settings.schema';

export function useSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.page('settings'),
    queryFn: () => getResponse('/settings', responseSchema),
  });
}

export function useSettingsWorkspace() {
  return useQuery({
    queryKey: queryKeys.page('settings-workspace'),
    queryFn: () => getResponse('/me', workspaceSchema),
  });
}

export function useSettings() {
  const client = useQueryClient();
  const query = useSettingsQuery();
  const save = useMutation({
    mutationFn: (input: unknown) =>
      getResponse('/settings', responseSchema, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsInputSchema.parse(input)),
      }),
    onSuccess: (response) => client.setQueryData(queryKeys.page('settings'), response),
  });

  return { ...query, save };
}
