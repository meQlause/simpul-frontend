import { useSyncExternalStore } from 'react';
import { ApiError } from './api/error';

function subscribe(notify: () => void) {
  window.addEventListener('online', notify);
  window.addEventListener('offline', notify);
  return () => {
    window.removeEventListener('online', notify);
    window.removeEventListener('offline', notify);
  };
}

export function useScreenState(query: { isPending: boolean; error: Error | null }, empty: boolean) {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine);
  if (!online) {
    return 'offline';
  }
  if (query.error instanceof ApiError && query.error.code === 'E-NOT-FOUND') {
    return 'not-found';
  }
  if (query.error) {
    return 'error';
  }
  if (query.isPending) {
    return 'loading';
  }
  if (empty) {
    return 'empty';
  }
  return 'ready';
}
