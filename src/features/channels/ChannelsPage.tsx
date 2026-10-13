import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenState } from '../../shared/ui/ScreenState';
import { Drawer } from '../../shared/ui/Drawer';
import { useScreenState } from '../../shared/useScreenState';
import { useChannels, useConnections, readChannel, channelRequest } from './channels.api';
import { channelSchema, type Channel, type Connection } from './channels.schema';
import { sentenceOf, setupError } from './useChannelSetup';
import { ErrorToast } from '../../shared/ui/ErrorToast';
import { ChannelList } from './components/ChannelList';
import { ChannelDrawer } from './components/ChannelDrawer';
import { ConnectionDrawer } from './components/ConnectionDrawer';
import { ChannelConfirmation } from './components/ChannelConfirmation';

export function ChannelsPage() {
  const page = useChannelPage();
  const state = useScreenState(page.channels, page.channels.data?.data.length === 0);

  return (
    <>
      <ScreenState state={state} onRetry={page.reload} />
      {page.channels.data && (
        <ChannelList
          channels={page.channels.data.data}
          connection={page.connection}
          onOpen={page.open}
          onPause={page.setPause}
          onManage={() => page.open('connection')}
        />
      )}
      <PageDrawers page={page} />
      {page.message && <p role="status">{page.message}</p>}
      {page.pause && (
        <ChannelConfirmation
          eyebrow="PAUSE MONITORING"
          title={'Pause ' + page.pause.displayName + '?'}
          description="New messages and notifications for this group will stop. Other groups sharing the bot stay active."
          chatId={page.pause.providerChatId}
          detail={`@${page.connection?.botUsername.replace(/^@/, '')} · ${page.pause.class === 'external' ? 'External' : 'Internal'} audience`}
          label="Pause group"
          pending={page.pending}
          onClose={() => {
            page.setPause(null);
            page.setError('');
          }}
          onConfirm={() => {
            void page.confirmPause();
          }}
        >
          {/* A failed pause keeps the popup open: the toast belongs inside it. */}
          <ErrorToast message={page.error} onClose={() => page.setError('')} />
        </ChannelConfirmation>
      )}
    </>
  );
}

function useChannelPage() {
  const channels = useChannels();
  const connections = useConnections();
  const navigate = useNavigate();
  const [returnId, setReturnId] = useState('');
  const [pause, setPause] = useState<Channel | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const routeId = useLocation().pathname.split('/')[2] ?? '';

  function open(id: string) {
    void navigate('/channels/' + id);
  }

  function close() {
    setReturnId('');
    void navigate('/channels');
  }

  function reload() {
    void channels.refetch();
    void connections.refetch();
  }

  function saved(message: string) {
    reload();
    close();
    setMessage(message);
  }

  async function confirmPause() {
    if (!pause || pending) {
      return;
    }

    setPending(true);

    try {
      await channelRequest('/channels/' + pause.id + '/pause', channelSchema, 'POST', {
        expectedConfigVersion: pause.configVersion,
      });
      reload();
      setPause(null);
      setMessage('Group paused. Other groups remain active.');
    } catch (failure) {
      setError(sentenceOf(setupError(failure)));
    } finally {
      setPending(false);
    }
  }

  return {
    channels,
    connection: connections.data?.data[0],
    routeId,
    drawerId: routeId === 'connection' ? returnId : routeId,
    returnId,
    setReturnId,
    pause,
    setPause,
    pending,
    message,
    error,
    setError,
    open,
    close,
    reload,
    saved,
    confirmPause,
  };
}

function PageDrawers({ page }: { page: ReturnType<typeof useChannelPage> }) {
  const detail = useQuery({
    queryKey: ['channels', page.drawerId],
    queryFn: () => readChannel(page.drawerId),
    enabled: Boolean(page.drawerId && page.drawerId !== 'new'),
  });

  const drawerState = useScreenState(detail, false);

  if (!page.connection) {
    return null;
  }

  return (
    <>
      {page.drawerId && (
        <SetupDrawer
          key={page.drawerId}
          id={page.drawerId}
          channel={detail.data}
          state={drawerState}
          connection={page.connection}
          onRetry={() => {
            void detail.refetch();
          }}
          onClose={page.close}
          onSaved={() => page.saved('Channel saved.')}
          onManage={() => {
            page.setReturnId(page.drawerId);
            page.open('connection');
          }}
        />
      )}
      {page.routeId === 'connection' && (
        <ConnectionDrawer
          connection={page.connection}
          returning={Boolean(page.returnId)}
          onClose={() => {
            if (page.returnId) {
              page.open(page.returnId);
              page.setReturnId('');
            } else {
              page.close();
            }
          }}
          onSaved={() => page.saved('Connection saved.')}
        />
      )}
    </>
  );
}

function SetupDrawer(props: {
  id: string;
  channel?: Channel;
  state: ReturnType<typeof useScreenState>;
  connection: Connection;
  onRetry: () => void;
  onClose: () => void;
  onSaved: () => void;
  onManage: () => void;
}) {
  if (props.id === 'new' || props.channel) {
    return (
      <ChannelDrawer
        channel={props.channel}
        connection={props.connection}
        onClose={props.onClose}
        onSaved={props.onSaved}
        onManage={props.onManage}
      />
    );
  }

  return (
    <Drawer
      title="Configure channel"
      eyebrow="CHANNELS / TELEGRAM SETUP"
      description="Save a draft now, or complete the readiness checks to start monitoring."
      closeLabel="Close channel setup"
      onClose={props.onClose}
      footer={
        <button className="button" onClick={props.onClose}>
          Close
        </button>
      }
    >
      <ScreenState state={props.state} onRetry={props.onRetry} />
    </Drawer>
  );
}
