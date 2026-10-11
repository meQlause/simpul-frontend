import { useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router';
import { NoAccess } from '../features/auth';
import { ApiError } from '../shared/api/error';

type Entry = { state: { error: unknown } };

const hasCode = (code: string) => (entry: Entry) =>
  entry.state.error instanceof ApiError && entry.state.error.code === code;
const isExpired = hasCode('E-AUTH-REQUIRED');
const isForbidden = hasCode('E-FORBIDDEN');
const needsSetup = hasCode('E-DB-SETUP-REQUIRED');

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
  const setupRequired = useSyncExternalStore(
    (notify) => client.getQueryCache().subscribe(notify),
    () => client.getQueryCache().getAll().some(needsSetup),
  );
  const forbidden = useSyncExternalStore(
    (notify) => client.getQueryCache().subscribe(notify),
    () => client.getQueryCache().getAll().some(isForbidden),
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

  if (setupRequired && location.pathname !== '/setup/database') {
    return <Navigate to="/setup/database" replace />;
  }

  return forbidden ? <NoAccess /> : <Outlet />;
}
