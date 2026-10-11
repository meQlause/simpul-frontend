import { useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router';
import { ApiError } from '../shared/api/error';

function isExpired(entry: { state: { error: unknown } }) {
  return entry.state.error instanceof ApiError && entry.state.error.code === 'E-AUTH-REQUIRED';
}

export function SessionGuard() {
  const client = useQueryClient();
  const location = useLocation();
  const expired = useSyncExternalStore(
    (notify) => {
      const queries = client.getQueryCache().subscribe(notify);
      const mutations = client.getMutationCache().subscribe(notify);

      return () => {
        queries();
        mutations();
      };
    },
    () =>
      client.getQueryCache().getAll().some(isExpired) ||
      client.getMutationCache().getAll().some(isExpired),
  );

  if (expired) {
    return (
      <Navigate
        to="/sign-in"
        replace
        state={{ returnTo: location.pathname + location.search + location.hash }}
      />
    );
  }

  return <Outlet />;
}
