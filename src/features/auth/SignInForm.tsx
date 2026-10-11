import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';
import { OfflineControls } from '../../shared/ui/OfflineControls';
import { signIn } from './auth.api';
import { authCopy } from './auth.copy';
import { returnPath } from './auth.rules';

function clearPassword(form: HTMLFormElement) {
  const password = form.elements.namedItem('password');

  if (password instanceof HTMLInputElement) {
    password.value = '';
  }
}

function useSignIn() {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const client = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setPending(true);
    setFailed(false);

    try {
      await signIn(new FormData(form));
      client.clear();
      await navigate(returnPath(location.state?.returnTo), { replace: true });
    } catch {
      setFailed(true);
      form.querySelector<HTMLInputElement>('[name="password"]')?.focus();
    } finally {
      clearPassword(form);
      setPending(false);
    }
  }

  return { pending, failed, submit };
}

export function SignInForm() {
  const { pending, failed, submit } = useSignIn();

  return (
    <form id="sign-in-form" onSubmit={submit} data-component="SignInForm">
      <OfflineControls>
        <label className="field">
          {authCopy.email}
          <input type="email" name="email" autoComplete="username" required />
        </label>
        <label className="field">
          {authCopy.password}
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        <p className="channel-error" role="alert" id="auth-error">
          {failed && authCopy.invalid}
        </p>
        <button className="button button-primary auth-submit" type="submit" disabled={pending}>
          {authCopy.title}
          <svg className="icon" aria-hidden="true">
            <use href="#i-arrow-right" />
          </svg>
        </button>
      </OfflineControls>
    </form>
  );
}
