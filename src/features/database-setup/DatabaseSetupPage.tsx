import { Navigate, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../shared/api/error';
import { ScreenState } from '../../shared/ui/ScreenState';
import { AuthShell, useSignOut } from '../auth';
import { useDatabase } from './database.api';
import { databaseCopy as copy } from './database.copy';
import { AvailabilityNotice } from './AvailabilityNotice';
import { DatabaseConnectionForm } from './DatabaseConnectionForm';

export function DatabaseSetupPage() {
  const query = useDatabase();
  const navigate = useNavigate();
  const client = useQueryClient();
  const signOut = useSignOut();

  if (query.error instanceof ApiError && query.error.code === 'E-NOT-FOUND') {
    return <ScreenState state="not-found" />;
  }

  if (!query.data) {
    return <ScreenState state={query.isError ? 'error' : 'loading'} />;
  }

  if (query.data.data.status !== 'pending') {
    return <Navigate to="/settings/database" replace />;
  }

  return (
    <AuthShell variant="database-setup" eyebrow={copy.eyebrow} title={copy.title} lead={copy.lead}>
      <AvailabilityNotice />
      <DatabaseConnectionForm
        firstConnect
        onConnected={() => {
          client.clear();
          void navigate('/', { replace: true });
        }}
      />
      <button className="text-button" type="button" onClick={() => void signOut()}>
        {copy.signOut}
      </button>
    </AuthShell>
  );
}
