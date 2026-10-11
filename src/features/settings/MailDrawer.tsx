import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { useNavigate } from 'react-router';
import { Drawer } from '../../shared/ui/Drawer';
import { OfflineControls } from '../../shared/ui/OfflineControls';
import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { useMail, useSaveMail } from './settings.api';
import { settingsCopy as copy } from './settings.copy';
import { ApiError } from '../../shared/api/error';

function useMailSave() {
  const [failure, setFailure] = useState('');
  const save = useSaveMail();
  const navigate = useNavigate();

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const password = String(values.get('password'));

    setFailure('');

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
      const refused = error instanceof ApiError && error.code === 'E-MAIL-CONNECTION-FAILED';

      setFailure(refused ? copy.mailFailed : copy.failed);

      const field = form.elements.namedItem('password');

      if (field instanceof HTMLInputElement) {
        field.value = '';
      }
    }
  }

  return { failure, pending: save.isPending, submit };
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

function MailFields({ mail, waiting }: { mail: Mail; waiting: number }) {
  const defaults = mailDefaults(mail);

  return (
    <OfflineControls>
      {!mail && waiting > 0 && (
        <p className="notice">
          {waiting} {copy.mailWaiting}
        </p>
      )}
      <label className="field">
        {copy.mailHost}
        <input name="host" defaultValue={defaults.host} maxLength={255} required />
      </label>
      <label className="field">
        {copy.mailPort}
        <input
          name="port"
          type="number"
          min={1}
          max={65535}
          defaultValue={defaults.port}
          required
        />
      </label>
      <label className="field">
        {copy.mailUsername}
        <input name="username" defaultValue={defaults.username} maxLength={255} required />
      </label>
      <label className="field">
        {copy.mailPassword}
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={defaults.stored ? copy.mailPasswordHidden : undefined}
          required={!defaults.stored}
        />
      </label>
      <label className="field">
        {copy.mailFrom}
        <input name="fromAddress" type="email" defaultValue={defaults.fromAddress} required />
      </label>
    </OfflineControls>
  );
}

function MailFooter({
  failure,
  pending,
  onClose,
}: {
  failure: string;
  pending: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {failure && (
        <p role="alert" className="channel-error drawer-error">
          {failure}
        </p>
      )}
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
  const { failure, pending, submit } = useMailSave();
  const close = () => void navigate('/settings');

  return (
    <Drawer
      title={copy.mailTitle}
      eyebrow={copy.mailEyebrow}
      description={copy.mailDescription}
      closeLabel={copy.close}
      onClose={close}
      footer={<MailFooter failure={failure} pending={pending || !query.data} onClose={close} />}
    >
      {query.data ? (
        <form id="mail-form" onSubmit={submit}>
          <MailFields mail={query.data.data} waiting={query.data.pendingDigestItems ?? 0} />
        </form>
      ) : (
        <ScreenState state={state} onRetry={() => void query.refetch()} />
      )}
    </Drawer>
  );
}
