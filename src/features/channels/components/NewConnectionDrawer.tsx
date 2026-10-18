import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Drawer } from '../../../shared/ui/Drawer';
import { DrawerSection } from '../../../shared/ui/DrawerParts';
import { ErrorToast } from '../../../shared/ui/ErrorToast';
import { channelRequest } from '../channels.api';
import { connectionSchema } from '../channels.schema';
import { sentenceOf, setupError } from '../useChannelSetup';

// The first bot of the workspace: there is no connection to manage yet, so the form creates one.
// The server checks the token with Telegram before it stores it (POST /telegram/connections).
export function NewConnectionDrawer({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const client = useQueryClient();
  const [connectionName, setConnectionName] = useState('Workspace bot');
  const [botToken, setBotToken] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setPending(true);
    setError('');

    try {
      await channelRequest(
        '/telegram/connections',
        connectionSchema,
        { method: 'POST', key: crypto.randomUUID() },
        { botToken, connectionName },
      );
      await client.invalidateQueries({ queryKey: ['telegram', 'connections'] });
      onSaved();
    } catch (failure) {
      setError(sentenceOf(setupError(failure)));
    } finally {
      setPending(false);
    }
  }

  return (
    <Drawer
      title="Telegram bot connection"
      eyebrow="CHANNELS / WORKSPACE CONNECTION"
      description="Connect the workspace bot first. Groups are added to it afterwards."
      closeLabel="Close Telegram connection"
      onClose={onClose}
      footer={
        <button
          className="button button-primary"
          data-component="Button"
          data-variant="primary"
          data-size="drawer"
          disabled={pending || botToken.trim() === '' || connectionName.trim() === ''}
          onClick={() => {
            void save();
          }}
        >
          Save connection
        </button>
      }
    >
      <DrawerSection
        number="01"
        title="Bot details"
        description="The token comes from @BotFather. It is stored separately and never shown again."
      >
        <label className="field" data-component="Field" data-variant="default" data-size="drawer">
          Connection name
          <input
            maxLength={80}
            value={connectionName}
            onChange={(event) => setConnectionName(event.target.value)}
          />
        </label>
        <label className="field" data-component="Field" data-variant="default" data-size="drawer">
          Bot token
          <input
            type="password"
            aria-label="Bot token"
            autoComplete="off"
            value={botToken}
            onChange={(event) => setBotToken(event.target.value)}
          />
        </label>
      </DrawerSection>
      <ErrorToast message={error} onClose={() => setError('')} />
    </Drawer>
  );
}
