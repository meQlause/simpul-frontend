import { useCallback, useState } from 'react';
import type { Channel, Connection, CodeSession } from '../channels.schema';
import { Drawer } from '../../../shared/ui/Drawer';
import { DrawerIdentity, DrawerSection } from '../../../shared/ui/DrawerParts';
import { Icon } from '../../../shared/ui/Icon';
import { OfflineControls } from '../../../shared/ui/OfflineControls';
import { useOnline } from '../../../shared/useOnline';
import { useChannelSetup } from '../useChannelSetup';
import { channelsCopy as copy } from '../channels.copy';
import { ChannelAudience, ChannelFields } from './ChannelFields';
import { Checklist, useFreshVerification } from './Checklist';
import { ConnectionCode } from './ConnectionCode';
import { ChannelConfirmation } from './ChannelConfirmation';

type Setup = ReturnType<typeof useChannelSetup>;

export function ChannelDrawer({
  channel,
  connection,
  onClose,
  onSaved,
  onManage,
}: {
  channel?: Channel;
  connection: Connection;
  onClose: () => void;
  onSaved: () => void;
  onManage: () => void;
}) {
  const setup = useChannelSetup(channel, connection, onSaved);
  const fresh = useFreshVerification(setup.verification);
  const [metadata, setMetadata] = useState<CodeSession['candidate']>(null);
  const [activationKey, setActivationKey] = useState('');
  const { setInput } = setup;
  const candidate = useCallback(
    (value: NonNullable<CodeSession['candidate']>) => {
      setMetadata(value);
      setInput((current) => ({
        ...current,
        providerChatId: value.providerChatId,
        displayName: current.displayName || value.title,
      }));
    },
    [setInput],
  );

  return (
    <Drawer
      title={channel ? 'Configure channel' : copy.add}
      eyebrow="CHANNELS / TELEGRAM SETUP"
      description="Save a draft now, or complete the readiness checks to start monitoring."
      closeLabel="Close channel setup"
      onClose={onClose}
      footer={
        <ChannelFooter
          setup={setup}
          fresh={fresh && matchesSavedInput(setup)}
          onActivate={() => setActivationKey(crypto.randomUUID())}
        />
      }
    >
      <ChannelIdentity saved={Boolean(channel)} name={setup.input.displayName} />
      <OfflineControls>
        <WorkspaceBot connection={connection} onManage={onManage} />
        <DrawerSection
          number="02"
          title="Identify the group"
          description="Choose the audience before any monitoring starts."
        >
          <ChannelFields
            input={setup.input}
            onChange={setup.setInput}
            saved={Boolean(setup.channel)}
            error={setup.error}
          />
          {!setup.channel && (
            <details className="setup-alternative">
              <summary>Identify with a connection code instead</summary>
              <ConnectionCode
                connectionId={connection.id}
                purpose="identify_group"
                onCandidate={candidate}
                onError={setup.setError}
              />
            </details>
          )}
          <GroupMetadata channel={setup.channel} candidate={metadata} />
          <ChannelAudience input={setup.input} onChange={setup.setInput} />
        </DrawerSection>
        <ChannelReadiness setup={setup} connection={connection} />
      </OfflineControls>
      {activationKey && (
        <ChannelConfirmation
          eyebrow="ACTIVATE MONITORING"
          title={'Start monitoring ' + setup.input.displayName + '?'}
          description={`New messages in this ${setup.input.class} group will start to be read and routed by your rules.`}
          chatId={setup.input.providerChatId}
          detail={`@${connection.botUsername.replace(/^@/, '')} · ${setup.input.class === 'external' ? 'External' : 'Internal'} audience`}
          label="Activate monitoring"
          pending={setup.pending}
          onClose={() => setActivationKey('')}
          onConfirm={() => {
            void setup.activate(activationKey).then(() => setActivationKey(''));
          }}
        />
      )}
    </Drawer>
  );
}

function ChannelFooter({
  setup,
  fresh,
  onActivate,
}: {
  setup: Setup;
  fresh: boolean;
  onActivate: () => void;
}) {
  const online = useOnline();

  return (
    <>
      <p id="channel-setup-error" role="alert" className="channel-error drawer-error">
        {setup.error}
      </p>
      <button
        className="button"
        data-component="Button"
        data-variant="default"
        data-size="drawer"
        disabled={setup.pending || !online}
        onClick={() => {
          void setup.run('save');
        }}
      >
        {setup.channel ? 'Save changes' : 'Save draft'}
      </button>
      <button
        className="button button-primary"
        data-component="Button"
        data-variant="primary"
        data-size="drawer"
        disabled={!fresh || !setup.consent || setup.pending || !online}
        onClick={onActivate}
      >
        <Icon name="play" />
        Activate monitoring
      </button>
    </>
  );
}

function ChannelIdentity({ saved, name }: { saved: boolean; name: string }) {
  return (
    <DrawerIdentity
      icon="telegram"
      title={name || 'Your next conversation source'}
      description="Telegram groups & supergroups only"
      status={<span className="badge green">{saved ? 'Configure group' : 'New group'}</span>}
    />
  );
}

function WorkspaceBot({ connection, onManage }: { connection: Connection; onManage: () => void }) {
  return (
    <DrawerSection
      number="01"
      title="Use your workspace bot"
      description="Reuse one connection across your Telegram groups."
    >
      <div className="channel-bot-reference">
        <Icon name="link" />
        <div>
          <strong>@{connection.botUsername.replace(/^@/, '')}</strong>
          <small>Token stored separately · Never required for each group</small>
        </div>
        <button
          className="button"
          data-component="Button"
          data-variant="default"
          data-size="drawer"
          onClick={onManage}
        >
          Manage
        </button>
      </div>
      <div className="drawer-inline-note">
        <Icon name="help" />
        Add this bot to your Telegram group and disable its privacy mode in BotFather.
      </div>
    </DrawerSection>
  );
}

function ChannelReadiness({ setup, connection }: { setup: Setup; connection: Connection }) {
  const ignoreCandidate = useCallback(() => {}, []);
  let label = setup.verification || setup.channel ? 'Recheck' : 'Check group';

  if (setup.pending) {
    label = 'Verifying…';
  }

  return (
    <DrawerSection
      number="03"
      title="Verify before you activate"
      description="A bot connection and group monitoring are separate states."
    >
      <Checklist verification={setup.verification} />
      <div className="channel-check-actions">
        <button
          className="button"
          data-component="Button"
          data-variant="default"
          data-size="drawer"
          disabled={setup.pending}
          onClick={() => {
            void setup.run('verify');
          }}
        >
          <Icon name="refresh" />
          {label}
        </button>
      </div>
      {setup.channel && (
        <ConnectionCode
          connectionId={connection.id}
          purpose="receive_check"
          onCandidate={ignoreCandidate}
          onError={setup.setError}
        />
      )}
      {setup.verification?.activationReady && (
        <p className="setup-freshness">Last checked just now · Valid for 10 minutes</p>
      )}
      <div className="drawer-inline-note" data-component="InlineNote">
        <Icon name="clock" />
        History starts when monitoring is activated. Earlier Telegram group messages cannot be
        fetched by a new Bot API connection.
      </div>
      <label className="channel-consent">
        <input
          type="checkbox"
          checked={setup.consent}
          onChange={(event) => setup.setConsent(event.target.checked)}
        />
        <span>{copy.consent}</span>
      </label>
    </DrawerSection>
  );
}

function matchesSavedInput(setup: Setup) {
  const saved = setup.channel;

  return Boolean(
    saved &&
    setup.input.displayName.trim() === saved.displayName &&
    setup.input.class === saved.class &&
    setup.input.primaryLanguage === saved.primaryLanguage &&
    setup.input.providerChatId === saved.providerChatId,
  );
}

function GroupMetadata({
  channel,
  candidate,
}: {
  channel?: Channel;
  candidate: CodeSession['candidate'];
}) {
  const group =
    candidate ??
    (channel
      ? {
          title: channel.providerChatTitle,
          providerChatId: channel.providerChatId,
          chatType: channel.providerChatType,
        }
      : null);

  if (!group?.title) {
    return null;
  }

  return (
    <dl
      className="trace-facts group-metadata"
      data-component="TraceFacts"
      data-variant="group-metadata"
    >
      <div>
        <dt>Telegram title</dt>
        <dd>{group.title}</dd>
      </div>
      <div>
        <dt>Chat ID / type</dt>
        <dd>
          {group.providerChatId} · {group.chatType}
        </dd>
      </div>
    </dl>
  );
}
