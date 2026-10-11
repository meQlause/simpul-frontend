import { useRef, useState, type RefObject } from 'react';
import { Drawer } from '../../../shared/ui/Drawer';
import { OfflineControls } from '../../../shared/ui/OfflineControls';
import { useOnline } from '../../../shared/useOnline';
import { channelRequest } from '../channels.api';
import { connectionSchema, credentialCheckSchema, type Connection } from '../channels.schema';
import { channelsCopy as copy } from '../channels.copy';
import { setupError } from '../useChannelSetup';
import { ChannelConfirmation } from './ChannelConfirmation';
async function digest(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
  ).join(',');
}
export function ConnectionDrawer({
  connection,
  onClose,
  onSaved,
  returning,
}: {
  connection: Connection;
  onClose: () => void;
  onSaved: () => void;
  returning: boolean;
}) {
  const token = useRef<HTMLInputElement>(null);
  const form = useCredentialForm(connection, onSaved, token);
  return (
    <Drawer
      title="Telegram bot connection"
      eyebrow="CHANNELS / WORKSPACE CONNECTION"
      description="One bot connects multiple groups. Updating it affects the entire workspace."
      closeLabel="Close Telegram connection"
      onClose={onClose}
      footer={<ConnectionFooter form={form} returning={returning} onClose={onClose} />}
    >
      <OfflineControls>
        <section className="drawer-section" data-component="DrawerSection">
          <h3 data-role="section-title">Connection details</h3>
          <label className="field" data-component="Field" data-variant="default" data-size="drawer">
            Connection name
            <input
              maxLength={80}
              value={form.name}
              onChange={(event) => form.setName(event.target.value)}
            />
          </label>
          <label className="field" data-component="Field" data-variant="default" data-size="drawer">
            Replacement bot token
            <input
              ref={token}
              type="password"
              autoComplete="off"
              disabled={form.pending || Boolean(form.confirmation)}
              onChange={() => {
                void form.changed();
              }}
              placeholder="Existing credential is hidden"
            />
          </label>
          <button
            className="button"
            data-component="Button"
            data-variant="default"
            data-size="drawer"
            disabled={form.pending}
            onClick={() => {
              void form.verify();
            }}
          >
            Verify
          </button>
          <p
            id="bot-check-result"
            className="drawer-inline-note"
            data-component="InlineNote"
            role="status"
          >
            {form.result}
          </p>
        </section>
        <SharedGroups connection={connection} />
      </OfflineControls>
      {form.confirmation && (
        <ChannelConfirmation
          title="Save connection"
          label="Save connection"
          pending={form.pending}
          onClose={() => form.setConfirmation('')}
          onConfirm={() => {
            void form.rotate();
          }}
        >
          <p>Changing this connection applies to every group below.</p>
          <p>{connection.groups.map((group) => group.displayName).join(', ')}</p>
        </ChannelConfirmation>
      )}
    </Drawer>
  );
}

function useCredentialForm(
  connection: Connection,
  onSaved: () => void,
  token: RefObject<HTMLInputElement | null>,
) {
  const [name, setName] = useState(connection.connectionName);
  const [verified, setVerified] = useState('');
  const [matches, setMatches] = useState(false);
  const [result, setResult] = useState('');
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  async function verify() {
    const field = token.current;
    if (pending || !field) {
      return;
    }
    setPending(true);
    setVerified('');
    setMatches(false);
    try {
      const checked = await channelRequest(
        '/telegram/connections/verify',
        credentialCheckSchema,
        'POST',
        { botToken: field.value },
      );
      if (checked.sameBotAsStored === false) {
        setResult(copy.mismatch);
      } else {
        setVerified(await digest(field.value));
        setResult('@' + checked.botUsername);
      }
    } catch (error) {
      setResult(setupError(error));
    } finally {
      field.value = '';
      setPending(false);
    }
  }
  async function changed() {
    setMatches(false);
    if (token.current && verified) {
      const candidate = await digest(token.current.value);
      setMatches(candidate === verified);
    }
  }
  async function rotate() {
    const field = token.current;
    if (pending || !field) {
      return;
    }
    setPending(true);
    try {
      await channelRequest(
        '/telegram/connections/' + connection.id + '/credentials',
        connectionSchema,
        { method: 'PUT', key: confirmation },
        {
          botToken: field.value,
          connectionName: name.trim(),
          expectedCredentialVersion: connection.credentialVersion,
        },
      );
      onSaved();
    } catch (error) {
      setResult(setupError(error));
    } finally {
      field.value = '';
      setPending(false);
      setMatches(false);
      setVerified('');
      setConfirmation('');
    }
  }

  return {
    name,
    setName,
    matches,
    result,
    pending,
    confirmation,
    setConfirmation,
    verify,
    changed,
    rotate,
  };
}

function SharedGroups({ connection }: { connection: Connection }) {
  return (
    <section className="drawer-section" data-component="DrawerSection">
      <h3 data-role="section-title">Shared by these groups</h3>
      <p>Changing this connection applies to every group below.</p>
      {connection.groups.map((group) => (
        <div className="drawer-check-row" key={group.channelId}>
          <div>
            <strong>{group.displayName}</strong>
            <small>{group.providerChatId}</small>
          </div>
          <span className="badge gray">{group.connectionStatus}</span>
        </div>
      ))}
    </section>
  );
}

function ConnectionFooter({
  form,
  returning,
  onClose,
}: {
  form: ReturnType<typeof useCredentialForm>;
  returning: boolean;
  onClose: () => void;
}) {
  const online = useOnline();
  return (
    <>
      <button
        className="button"
        data-component="Button"
        data-variant="default"
        data-size="drawer"
        onClick={onClose}
      >
        {returning ? 'Back to setup' : 'Cancel'}
      </button>
      <button
        className="button button-primary"
        data-component="Button"
        data-variant="primary"
        data-size="drawer"
        disabled={!form.matches || !form.name.trim() || form.pending || !online}
        onClick={() => form.setConfirmation(crypto.randomUUID())}
      >
        Save connection
      </button>
    </>
  );
}
