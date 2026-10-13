import { useEffect, useRef, useState } from 'react';
import { ErrorToast } from '../../shared/ui/ErrorToast';
import type { InputHTMLAttributes, SubmitEvent } from 'react';
import { useNavigate } from 'react-router';
import { Drawer } from '../../shared/ui/Drawer';
import { OfflineControls } from '../../shared/ui/OfflineControls';
import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { useMail, useSaveMail } from './settings.api';
import { settingsCopy as copy } from './settings.copy';
import { ApiError } from '../../shared/api/error';

type Invalid = { field: string; message: string };

function invalidOf(error: unknown): Invalid | null {
  if (!(error instanceof ApiError) || error.code !== 'E-VALIDATION') {
    return null;
  }

  const detail: unknown = error.details[0];
  const field = detail && typeof detail === 'object' && 'field' in detail ? detail.field : null;

  return typeof field === 'string' ? { field, message: error.message || copy.invalid } : null;
}

function failureOf(error: unknown): { invalid: Invalid | null; failure: string } {
  const invalid = invalidOf(error);

  if (invalid) {
    return { invalid, failure: '' };
  }

  const refused = error instanceof ApiError && error.code === 'E-MAIL-CONNECTION-FAILED';

  return { invalid: null, failure: refused ? copy.mailFailed : copy.failed };
}

function clearPassword(form: HTMLFormElement) {
  const field = form.elements.namedItem('password');

  if (field instanceof HTMLInputElement) {
    field.value = '';
  }
}

function useMailSave() {
  const [failure, setFailure] = useState('');
  const [invalid, setInvalid] = useState<Invalid | null>(null);
  const save = useSaveMail();
  const navigate = useNavigate();

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const password = String(values.get('password'));

    setFailure('');
    setInvalid(null);

    try {
      await save.mutateAsync({
        host: values.get('host'),
        port: Number(values.get('port')),
        username: values.get('username'),
        fromAddress: values.get('fromAddress'),
        ...(password ? { password } : {}),
      });
      await navigate('/settings', { state: { toast: copy.mailSaved } });
    } catch (error) {
      const next = failureOf(error);

      setInvalid(next.invalid);
      setFailure(next.failure);
      clearPassword(form);
    }
  }

  return { failure, setFailure, invalid, pending: save.isPending, submit };
}

type Mail = NonNullable<ReturnType<typeof useMail>['data']>['data'];

function mailDefaults(mail: Mail) {
  return {
    host: mail?.host,
    port: mail?.port,
    username: mail?.username,
    fromAddress: mail?.fromAddress,
    stored: mail?.passwordPresent ?? false,
  };
}

function MailField({
  name,
  label,
  invalid,
  ...input
}: {
  name: string;
  label: string;
  invalid: Invalid | null;
} & InputHTMLAttributes<HTMLInputElement>) {
  const field = useRef<HTMLInputElement>(null);
  const failing = invalid?.field === name;

  useEffect(() => {
    if (failing) {
      field.current?.focus();
    }
  }, [failing, invalid]);

  return (
    <label className="field">
      {label}
      <input
        {...input}
        ref={field}
        name={name}
        aria-invalid={failing}
        aria-describedby={failing ? `mail-error-${name}` : undefined}
      />
      {failing && (
        <small id={`mail-error-${name}`} role="alert" className="channel-error">
          {invalid.message}
        </small>
      )}
    </label>
  );
}

function MailFields({
  mail,
  waiting,
  invalid,
}: {
  mail: Mail;
  waiting: number;
  invalid: Invalid | null;
}) {
  const defaults = mailDefaults(mail);

  return (
    <OfflineControls>
      {!mail && waiting > 0 && (
        <p className="notice">
          {waiting} {copy.mailWaiting}
        </p>
      )}
      <MailField
        name="host"
        label={copy.mailHost}
        invalid={invalid}
        defaultValue={defaults.host}
        maxLength={255}
        required
      />
      <MailField
        name="port"
        label={copy.mailPort}
        invalid={invalid}
        type="number"
        min={1}
        max={65535}
        defaultValue={defaults.port}
        required
      />
      <MailField
        name="username"
        label={copy.mailUsername}
        invalid={invalid}
        defaultValue={defaults.username}
        maxLength={255}
        required
      />
      <MailField
        name="password"
        label={copy.mailPassword}
        invalid={invalid}
        type="password"
        autoComplete="new-password"
        placeholder={defaults.stored ? copy.mailPasswordHidden : undefined}
        required={!defaults.stored}
      />
      <MailField
        name="fromAddress"
        label={copy.mailFrom}
        invalid={invalid}
        type="email"
        defaultValue={defaults.fromAddress}
        required
      />
    </OfflineControls>
  );
}

function MailFooter({
  failure,
  onDismiss,
  pending,
  onClose,
}: {
  failure: string;
  onDismiss: () => void;
  pending: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <ErrorToast message={failure} onClose={onDismiss} />
      <button type="button" className="button" onClick={onClose}>
        {copy.cancel}
      </button>
      <button className="button button-primary" type="submit" form="mail-form" disabled={pending}>
        {copy.mailSave}
      </button>
    </>
  );
}

export function MailDrawer() {
  const navigate = useNavigate();
  const query = useMail();
  const state = useScreenState(query, false);
  const { failure, setFailure, invalid, pending, submit } = useMailSave();
  const close = () => void navigate('/settings');

  return (
    <Drawer
      title={copy.mailTitle}
      eyebrow={copy.mailEyebrow}
      description={copy.mailDescription}
      closeLabel={copy.close}
      onClose={close}
      footer={
        <MailFooter
          failure={failure}
          onDismiss={() => setFailure('')}
          pending={pending || !query.data}
          onClose={close}
        />
      }
    >
      {query.data ? (
        <form id="mail-form" onSubmit={submit}>
          <MailFields
            mail={query.data.data}
            waiting={query.data.pendingDigestItems ?? 0}
            invalid={invalid}
          />
        </form>
      ) : (
        <ScreenState state={state} onRetry={() => void query.refetch()} />
      )}
    </Drawer>
  );
}
