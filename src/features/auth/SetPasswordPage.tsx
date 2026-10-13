import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { OfflineControls } from '../../shared/ui/OfflineControls';
import { ErrorToast } from '../../shared/ui/ErrorToast';
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
    const form = event.currentTarget;
    const values = new FormData(form);
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
      form.reset();
      setPending(false);
    }
  }

  return { message, setMessage, pending, submit };
}

export function SetPasswordPage() {
  const { message, setMessage, pending, submit } = useSetPassword();
  // The mismatch is the confirm field's own; anything else is a toast (error-handling §5).
  const mismatch = message === authCopy.mismatch;

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
            <input
              type="password"
              name="confirm"
              aria-label={authCopy.confirmPassword}
              autoComplete="new-password"
              required
              aria-invalid={mismatch}
              aria-describedby={mismatch ? 'confirm-error' : undefined}
            />
            {mismatch && (
              <small id="confirm-error" role="alert" className="field-error">
                {message}
              </small>
            )}
          </label>
          <ErrorToast message={mismatch ? '' : message} onClose={() => setMessage('')} />
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
