import { getResponse } from '../../shared/api/client';
import { ApiError } from '../../shared/api/error';
import { sessionSchema } from './auth.schema';
import { authCopy } from './auth.copy';

export async function signIn(values: FormData) {
  const response = await fetch(`${import.meta.env.VITE_API_BASE ?? ''}/api/auth/sign-in/email`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: values.get('email'), password: values.get('password') }),
  });

  if (!response.ok) {
    throw new ApiError({
      code: 'E-AUTH-INVALID',
      message: authCopy.invalid,
      details: [],
      requestId: response.headers.get('x-request-id') ?? '',
    });
  }

  await getResponse('/me', sessionSchema);
}

const authUrl = (path: string) => `${import.meta.env.VITE_API_BASE ?? ''}/api/auth/${path}`;

export async function setPassword(token: string, newPassword: string) {
  const response = await fetch(authUrl('reset-password'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword, token }),
  });

  if (!response.ok) {
    throw new Error(authCopy.saveFailed);
  }
}

export async function signOut() {
  await fetch(authUrl('sign-out'), { method: 'POST', credentials: 'include' });
}
