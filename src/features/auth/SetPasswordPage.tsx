import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { OfflineControls } from '../../shared/ui/OfflineControls';
import { AuthShell } from './AuthShell';
import { setPassword } from './auth.api';
import { authCopy } from './auth.copy';

function useSetPassword() {
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const password = String(values.get('password'));

    if (password !== values.get('confirm')) {
      setMessage(authCopy.mismatch);

      return;
    }

    setPending(true);
    setMessage('');

    try {
      await setPassword(params.get('token') ?? '', password);
      await navigate('/sign-in', { replace: true });
    } catch {
      setMessage(authCopy.saveFailed);
    } finally {
      setPending(false);
    }
  }

  return { message, pending, submit };
}

export function SetPasswordPage() {
  const { message, pending, submit } = useSetPassword();

  return (
    <AuthShell
      variant="set-password"
      eyebrow={authCopy.setEyebrow}
      title={authCopy.setTitle}
      lead={authCopy.setLead}
    >
      <form onSubmit={submit} data-component="SetPasswordForm">
        <OfflineControls>
          <label className="field">
            {authCopy.newPassword}
            <input type="password" name="password" autoComplete="new-password" required />
          </label>
          <label className="field">
            {authCopy.confirmPassword}
            <input type="password" name="confirm" autoComplete="new-password" required />
          </label>
          <p className="channel-error" role="alert">
            {message}
          </p>
          <button className="button button-primary auth-submit" type="submit" disabled={pending}>
            {authCopy.save}
            <svg className="icon" aria-hidden="true">
              <use href="#i-arrow-right" />
            </svg>
          </button>
        </OfflineControls>
      </form>
    </AuthShell>
  );
}
