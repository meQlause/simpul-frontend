import { useSearchParams } from 'react-router';
import {
  DirectoryContext,
  DirectoryEmpty,
  DirectoryFooter,
  DirectoryToolbar,
  PageHeading,
} from '../../../shared/ui/Directory';
import { Icon } from '../../../shared/ui/Icon';
import { InfoTip } from '../../../shared/ui/InfoTip';
import { useOnline } from '../../../shared/useOnline';
import { dayTime } from '../../work';
import type { Channel, Connection } from '../channels.schema';
import { channelsCopy as copy } from '../channels.copy';
import { channelName } from '../channels.rules';

type Handlers = {
  onOpen: (id: string) => void;
  onPause: (channel: Channel) => void;
};

function Audience({ external }: { external: boolean }) {
  return (
    <span className={`directory-category ${external ? 'external-category' : ''}`}>
      <Icon name={external ? 'external' : 'building'} />
      {external ? 'External' : 'Internal'}
    </span>
  );
}

function Readiness({ verification }: { verification: Channel['lastVerification'] }) {
  const passed = verification?.status === 'pass';

  return (
    <>
      <span className="safeguard">
        <Icon name={passed ? 'check-circle' : 'clock'} />
        {passed ? 'Checks passed' : 'Setup incomplete'}
      </span>
      <small>
        {verification ? `Last checked · ${dayTime(verification.checkedAt)}` : 'Not verified'}
      </small>
    </>
  );
}

function ChannelRow({ channel, onOpen, onPause }: { channel: Channel } & Handlers) {
  const online = useOnline();

  return (
    <tr data-directory-row>
      <td data-label="Channel">
        <div className="directory-identity">
          <span className="directory-icon">
            <Icon name="telegram" />
          </span>
          <div>
            <button
              className="directory-title"
              title={channelName(channel)}
              disabled={!online}
              onClick={() => onOpen(channel.id)}
            >
              {channelName(channel)}
            </button>
            <p>Telegram group</p>
          </div>
        </div>
      </td>
      <td data-label="Audience">
        <Audience external={channel.class === 'external'} />
      </td>
      <td data-label="Language">{copy.languages[channel.primaryLanguage]}</td>
      <td data-label="Readiness">
        <Readiness verification={channel.lastVerification} />
      </td>
      <td data-label="Monitoring">
        <span className={`badge ${channel.monitored ? 'green' : 'gray'}`}>
          {copy.statuses[channel.connectionStatus]}
        </span>
      </td>
      <td className="directory-actions">
        <button
          className="icon-button"
          data-component="IconButton"
          data-variant="default"
          disabled={!online}
          aria-label={`${channel.monitored ? 'Pause' : 'Resume'} ${channelName(channel)}`}
          onClick={() => (channel.monitored ? onPause(channel) : onOpen(channel.id))}
        >
          <Icon name={channel.monitored ? 'pause' : 'play'} />
        </button>
        <button
          className="icon-button"
          data-component="IconButton"
          data-variant="default"
          disabled={!online}
          aria-label={`Configure ${channelName(channel)}`}
          onClick={() => onOpen(channel.id)}
        >
          <Icon name="chevron-right" />
        </button>
      </td>
    </tr>
  );
}

function ChannelTable({ channels, ...handlers }: { channels: Channel[] } & Handlers) {
  return (
    <div className="table-wrap directory-table-wrap">
      <table className="directory-table">
        <thead>
          <tr>
            {copy.columns.slice(0, -1).map((name) => (
              <th key={name} scope="col">
                {name}
              </th>
            ))}
            <th scope="col">
              <span className="sr-only">{copy.columns[copy.columns.length - 1]}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {channels.map((channel) => (
            <ChannelRow key={channel.id} channel={channel} {...handlers} />
          ))}
          {channels.length === 0 && <DirectoryEmpty columns={copy.columns.length} />}
        </tbody>
      </table>
    </div>
  );
}

function ConnectionCard({
  connection,
  onManage,
}: {
  connection?: Connection;
  onManage: () => void;
}) {
  const online = useOnline();

  return (
    <section
      className="telegram-connection"
      data-component="ConnectionCard"
      data-testid="connection-card"
      data-variant="telegram"
    >
      <span className="telegram-connection-mark">
        <Icon name="telegram" />
      </span>
      <div>
        <div className="eyebrow">WORKSPACE CONNECTION</div>
        <h3 data-role="section-title">{connection?.connectionName}</h3>
        <p>
          @{connection?.botUsername.replace(/^@/, '')} · Shared by {connection?.groups.length ?? 0}{' '}
          groups
        </p>
      </div>
      <button
        className="button"
        data-component="Button"
        data-variant="default"
        data-size="page"
        disabled={!online}
        onClick={onManage}
      >
        <Icon name="settings" />
        {copy.manage}
      </button>
    </section>
  );
}

function SetUpCallout({ onOpen, disabled }: { onOpen: () => void; disabled: boolean }) {
  return (
    <div className="directory-callout" data-component="Callout" data-variant="default">
      <span className="directory-icon">
        <Icon name="shield" />
      </span>
      <div>
        <h3 data-role="section-title">Connect deliberately</h3>
        <InfoTip
          title="Connect deliberately"
          text="Add the bot to your group, verify ordinary messages, then activate monitoring. Saving a draft never starts ingestion."
        />
      </div>
      <button className="button" disabled={disabled} onClick={onOpen}>
        Set up a group
        <Icon name="arrow-right" />
      </button>
    </div>
  );
}

export function ChannelList({
  channels,
  connection,
  onOpen,
  onPause,
  onManage,
}: {
  channels: Channel[];
  connection?: Connection;
  onManage: () => void;
} & Handlers) {
  const [params, setParams] = useSearchParams();
  const online = useOnline();
  const state = params.get('state') ?? '';
  const search = (params.get('q') ?? '').toLowerCase();
  const visible = channels.filter(
    (channel) =>
      (!state || channel.connectionStatus === state) &&
      `${channelName(channel)} ${channel.providerChatId}`.toLowerCase().includes(search),
  );
  const count = (value: string) =>
    channels.filter((channel) => !value || channel.connectionStatus === value).length;

  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    void setParams(next);
  }

  return (
    <>
      <PageHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.description}>
        <button
          className="button button-primary"
          data-component="Button"
          data-variant="primary"
          data-size="page"
          disabled={!online}
          onClick={() => onOpen('new')}
        >
          <Icon name="plus" />
          {copy.add}
        </button>
      </PageHeading>
      <ConnectionCard connection={connection} onManage={onManage} />
      <DirectoryContext
        icon="activity"
        headline={
          <>
            <strong>{count('active')} groups monitored</strong> · {count('draft')} drafts
          </>
        }
        note="Only monitored groups are read."
      />
      <section className="panel directory-panel" data-component="Panel" data-variant="directory">
        <DirectoryToolbar
          tabs={[
            { key: '', label: 'All groups', count: count('') },
            { key: 'active', label: 'Active', count: count('active') },
            { key: 'draft', label: 'Drafts', count: count('draft') },
            { key: 'paused', label: 'Paused', count: count('paused') },
          ]}
          active={state}
          onTab={(value) => filter('state', value)}
          search={params.get('q') ?? ''}
          onSearch={(value) => filter('q', value)}
          placeholder="Search by group name or Chat ID…"
          disabled={!online}
        />
        <ChannelTable channels={visible} onOpen={onOpen} onPause={onPause} />
        {channels.length > 0 && (
          <DirectoryFooter status={`Showing ${visible.length} of ${channels.length} channels`} />
        )}
      </section>
      <SetUpCallout onOpen={() => onOpen('new')} disabled={!online} />
    </>
  );
}
