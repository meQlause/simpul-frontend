import { useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from './api/error';

// True while any query's last error is E-DB-UNAVAILABLE (the customer's database cannot be reached).
export function useUnavailable() {
  const client = useQueryClient();

  return useSyncExternalStore(
    (notify) => client.getQueryCache().subscribe(notify),
    () =>
      client
        .getQueryCache()
        .getAll()
        .some(
          (entry) =>
            entry.state.error instanceof ApiError && entry.state.error.code === 'E-DB-UNAVAILABLE',
        ),
  );
}
