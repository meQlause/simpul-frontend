import { ApiError } from './api/error';
import { useOnline } from './useOnline';

export function useScreenState(query: { isPending: boolean; error: Error | null }, empty: boolean) {
  const online = useOnline();

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
