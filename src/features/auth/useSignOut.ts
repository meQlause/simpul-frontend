import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { signOut } from './auth.api';

export function useSignOut() {
  const client = useQueryClient();
  const navigate = useNavigate();

  return async () => {
    await signOut();
    client.clear();
    await navigate('/sign-in', { replace: true });
  };
}
