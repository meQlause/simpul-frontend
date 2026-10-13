import { useRef, useState, type RefObject } from 'react';
import { Drawer } from '../../../shared/ui/Drawer';
import { DrawerIdentity, DrawerSection } from '../../../shared/ui/DrawerParts';
import { Icon } from '../../../shared/ui/Icon';
import { OfflineControls } from '../../../shared/ui/OfflineControls';
import { useOnline } from '../../../shared/useOnline';
import { channelRequest } from '../channels.api';
import { connectionSchema, credentialCheckSchema, type Connection } from '../channels.schema';
import { channelsCopy as copy } from '../channels.copy';
import { sentenceOf, setupError } from '../useChannelSetup';
import { ErrorToast } from '../../../shared/ui/ErrorToast';
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
      <DrawerIdentity
        icon="telegram"
        title={`@${connection.botUsername.replace(/^@/, '')}`}
        description={`Shared connection · ${connection.groups.length} groups`}
      />
      <OfflineControls>
        <DrawerSection
          number="01"
          title="Connection details"
          description="The credential is stored separately and never shown again."
        >
          <label className="field" data-component="Field" data-variant="default" data-size="drawer">
            Connection name
            <input
              maxLength={80}
              value={form.name}
              onChange={(event) => form.setName(event.target.value)}
            />
          </label>
          <TokenField form={form} token={token} />
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
            <Icon name="check-circle" />
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
        </DrawerSection>
        <SharedGroups connection={connection} />
      </OfflineControls>
      {form.confirmation && (
        <ChannelConfirmation
          eyebrow="UPDATE SHARED CONNECTION"
          title="Save connection"
          description="Changing this connection applies to every group below."
          label="Save connection"
          pending={form.pending}
          onClose={() => form.setConfirmation('')}
          onConfirm={() => {
            void form.rotate();
          }}
        >
          <p>{connection.groups.map((group) => group.displayName).join(', ')}</p>
        </ChannelConfirmation>
      )}
    </Drawer>
  );
}

function TokenField({
  form,
  token,
}: {
  form: ReturnType<typeof useCredentialForm>;
  token: RefObject<HTMLInputElement | null>;
}) {
  return (
    <label className="field" data-component="Field" data-variant="default" data-size="drawer">
      Replacement bot token
      <input
        ref={token}
        type="password"
        aria-label="Replacement bot token"
        autoComplete="off"
        disabled={form.pending || Boolean(form.confirmation)}
        aria-invalid={Boolean(form.tokenError)}
        aria-describedby={form.tokenError ? 'bot-token-error' : undefined}
        onChange={() => {
          void form.changed();
        }}
        placeholder="Existing credential is hidden"
      />
      {form.tokenError && (
        <small id="bot-token-error" role="alert" className="field-error">
          {form.tokenError}
        </small>
      )}
    </label>
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
  const [error, setError] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  // A field's own problem stays on the token field; anything else is a toast.
  function fail(failure: unknown) {
    const message = setupError(failure);
    const show = message.startsWith('E-TG-INPUT-INVALID') ? setTokenError : setError;

    show(sentenceOf(message));
  }

  function checkable(field: HTMLInputElement) {
    setResult('');
    setError('');
    setTokenError(emptyToken(field));

    return !emptyToken(field);
  }

  async function verify() {
    const field = token.current;

    if (pending || !field || !checkable(field)) {
      return;
    }

    setPending(true);
    setVerified('');
    setMatches(false);

    try {
      const checked = await verifyToken(field.value);

      if (checked.sameBotAsStored === false) {
        setError(sentenceOf(copy.mismatch));
      } else {
        setVerified(checked.fingerprint);
        setResult('@' + checked.botUsername.replace(/^@/, ''));
      }
    } catch (failure) {
      fail(failure);
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
      const saved = await rotateToken({
        botToken: field.value,
        verified,
        connection,
        name,
        key: confirmation,
      });

      if (saved) {
        onSaved();
      }
    } catch (failure) {
      fail(failure);
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
    error,
    setError,
    tokenError,
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
    <DrawerSection
      number="02"
      title="Shared by these groups"
      description="Changing this connection applies to every group below."
    >
      {connection.groups.map((group) => (
        <div className="drawer-check-row" key={group.channelId}>
          <Icon name="telegram" />
          <div>
            <strong>{group.displayName}</strong>
          </div>
          <span className="badge gray">{group.connectionStatus}</span>
        </div>
      ))}
    </DrawerSection>
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
      <ErrorToast message={form.error} onClose={() => form.setError('')} />
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

// An empty token never reaches Telegram: the field says so and takes focus.
function emptyToken(field: HTMLInputElement) {
  if (field.value.trim()) {
    return '';
  }

  field.focus();

  return copy.tokenRequired;
}

async function verifyToken(botToken: string) {
  const fingerprint = await digest(botToken);
  const checked = await channelRequest(
    '/telegram/connections/verify',
    credentialCheckSchema,
    'POST',
    { botToken },
  );

  return { ...checked, fingerprint };
}

async function rotateToken(input: {
  botToken: string;
  verified: string;
  connection: Connection;
  name: string;
  key: string;
}) {
  if ((await digest(input.botToken)) !== input.verified) {
    return false;
  }

  await channelRequest(
    '/telegram/connections/' + input.connection.id + '/credentials',
    connectionSchema,
    { method: 'PUT', key: input.key },
    {
      botToken: input.botToken,
      connectionName: input.name.trim(),
      expectedCredentialVersion: input.connection.credentialVersion,
    },
  );

  return true;
}
