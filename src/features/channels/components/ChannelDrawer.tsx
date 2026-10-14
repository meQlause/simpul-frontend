import { useEffect, useRef, useState } from 'react';
import type { Channel, Connection } from '../channels.schema';
import { Drawer } from '../../../shared/ui/Drawer';
import { DrawerIdentity } from '../../../shared/ui/DrawerParts';
import { Icon } from '../../../shared/ui/Icon';
import { OfflineControls } from '../../../shared/ui/OfflineControls';
import { useOnline } from '../../../shared/useOnline';
import { sentenceOf, useChannelSetup } from '../useChannelSetup';
import { ErrorToast } from '../../../shared/ui/ErrorToast';
import { channelsCopy as copy } from '../channels.copy';
import { channelName, shouldRecheck } from '../channels.rules';
import { ChannelAudience } from './ChannelFields';
import { useFreshVerification } from './Checklist';
import { ChannelConfirmation } from './ChannelConfirmation';
import { BotBody, CodeBody, ConfirmBody, MessageBody, SetupStep } from './SetupSteps';

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
  const stale = Boolean(setup.verification?.activationReady) && !fresh;
  const wasFresh = useRef(false);

  // A passing check that goes stale is checked once more, and the drawer says so.
  useEffect(() => {
    if (shouldRecheck(wasFresh.current, fresh)) {
      setup.recheck();
    }

    wasFresh.current = fresh;
  }, [fresh, setup]);
  const [activationKey, setActivationKey] = useState('');
  const name = setup.channel ? channelName(setup.channel) : '';
  const [botStatus, codeStatus, messageStatus, confirmStatus] = setup.steps;

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
          fresh={fresh}
          stale={stale}
          onActivate={() => setActivationKey(crypto.randomUUID())}
        />
      }
    >
      <ChannelIdentity saved={Boolean(channel)} name={name} />
      <OfflineControls>
        <ChannelAudience input={setup.input} onChange={setup.setInput} />
        <SetupStep number="01" title={copy.steps[0]} status={botStatus}>
          <BotBody
            botUsername={connection.botUsername.replace(/^@/, '')}
            onManage={onManage}
            code={setup.code}
          />
        </SetupStep>
        <SetupStep
          number="02"
          title={copy.steps[1]}
          status={codeStatus}
          result={copy.found + name}
          description={copy.codeNote}
        >
          <CodeBody code={setup.code} />
        </SetupStep>
        <SetupStep number="03" title={copy.steps[2]} status={messageStatus} result={copy.received}>
          <MessageBody verification={setup.verification} code={setup.code} />
        </SetupStep>
        <SetupStep number="04" title={copy.steps[3]} status={confirmStatus}>
          <ConfirmBody fresh={fresh} consent={setup.consent} onConsent={setup.setConsent} />
        </SetupStep>
      </OfflineControls>
      {activationKey && (
        <ChannelConfirmation
          eyebrow="ACTIVATE MONITORING"
          title={'Start monitoring ' + name + '?'}
          description={`New messages in this ${setup.input.class} group will start to be read and routed by your rules.`}
          heading={name}
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
  stale,
  onActivate,
}: {
  setup: Setup;
  fresh: boolean;
  stale: boolean;
  onActivate: () => void;
}) {
  const online = useOnline();
  const busy = setup.pending || !online;
  const message = setup.error || !stale ? sentenceOf(setup.error) : sentenceOf(copy.expired);

  return (
    <>
      <ErrorToast message={message} onClose={() => setup.setError('')} />
      {setup.failed && (
        <button
          className="button"
          data-component="Button"
          data-variant="default"
          data-size="drawer"
          disabled={busy}
          onClick={setup.retry}
        >
          {copy.retry}
        </button>
      )}
      {setup.channel && (
        <button
          className="button"
          data-component="Button"
          data-variant="default"
          data-size="drawer"
          disabled={busy}
          onClick={() => {
            void setup.saveChanges();
          }}
        >
          Save changes
        </button>
      )}
      <button
        className="button button-primary"
        data-component="Button"
        data-variant="primary"
        data-size="drawer"
        disabled={!fresh || !setup.consent || busy}
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
