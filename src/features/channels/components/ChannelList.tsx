import { useSearchParams } from 'react-router';
import type { Channel, Connection } from '../channels.schema';
import { channelsCopy as copy } from '../channels.copy';
import { useOnline } from '../../../shared/useOnline';
export function ChannelList({
  channels,
  connection,
  onOpen,
  onPause,
  onManage,
}: {
  channels: Channel[];
  connection?: Connection;
  onOpen: (id: string) => void;
  onPause: (channel: Channel) => void;
  onManage: () => void;
}) {
  const [params, setParams] = useSearchParams();
  const online = useOnline();
  const state = params.get('state') ?? '';
  const search = (params.get('q') ?? '').toLowerCase();
  const visible = channels.filter(
    (channel) =>
      (!state || channel.connectionStatus === state) &&
      (channel.displayName + ' ' + channel.providerChatId).toLowerCase().includes(search),
  );
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
      <ChannelHeading onOpen={onOpen} />
      <ConnectionCard connection={connection} onManage={onManage} />
      <section className="panel directory-panel" data-component="Panel" data-variant="directory">
        <div className="directory-toolbar">
          <div className="directory-tabs">
            {[
              ['', 'All groups'],
              ['active', 'Active'],
              ['draft', 'Drafts'],
              ['paused', 'Paused'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={'directory-tab ' + (state === value ? 'active' : '')}
                aria-pressed={state === value}
                disabled={!online}
                onClick={() => filter('state', value)}
              >
                {label}{' '}
                <span>
                  {
                    channels.filter((channel) => !value || channel.connectionStatus === value)
                      .length
                  }
                </span>
              </button>
            ))}
          </div>
          <label className="field directory-search">
            <input
              type="search"
              aria-label="Search by group name or Chat ID…"
              placeholder="Search by group name or Chat ID…"
              disabled={!online}
              value={params.get('q') ?? ''}
              onChange={(event) => filter('q', event.target.value)}
            />
          </label>
        </div>
        <ChannelTable channels={visible} onOpen={onOpen} onPause={onPause} />
      </section>
      <div className="directory-callout">
        <div>
          <h3 data-role="section-title">Connect deliberately</h3>
          <p>
            Add the bot to your group, verify ordinary messages, then activate monitoring. Saving a
            draft never starts ingestion.
          </p>
        </div>
        <button className="text-button" disabled={!online} onClick={() => onOpen('new')}>
          Set up a group
        </button>
      </div>
    </>
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
        <svg className="icon" aria-hidden="true">
          <use href="#i-telegram" />
        </svg>
      </span>
      <div>
        <div className="eyebrow">WORKSPACE CONNECTION</div>
        <h3 data-role="section-title">{connection?.connectionName}</h3>
        <p>
          @{connection?.botUsername} · Shared by {connection?.groups.length ?? 0} groups
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
        {copy.manage}
      </button>
    </section>
  );
}
function ChannelTable({
  channels,
  onOpen,
  onPause,
}: {
  channels: Channel[];
  onOpen: (id: string) => void;
  onPause: (channel: Channel) => void;
}) {
  return (
    <div className="directory-table-wrap">
      <table className="directory-table">
        <thead>
          <tr>
            {copy.columns.map((name) => (
              <th key={name} scope="col">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {channels.map((channel) => (
            <ChannelRow key={channel.id} channel={channel} onOpen={onOpen} onPause={onPause} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
function ChannelRow({
  channel,
  onOpen,
  onPause,
}: {
  channel: Channel;
  onOpen: (id: string) => void;
  onPause: (channel: Channel) => void;
}) {
  const online = useOnline();
  return (
    <tr>
      <td>
        <div className="directory-identity">
          <div>
            <button
              className="directory-title"
              title={channel.displayName}
              disabled={!online}
              onClick={() => onOpen(channel.id)}
            >
              {channel.displayName}
            </button>
            <p>{channel.providerChatId} · Telegram group</p>
          </div>
        </div>
      </td>
      <td>{channel.class === 'external' ? 'External' : 'Internal'}</td>
      <td>{copy.languages[channel.primaryLanguage]}</td>
      <td>{channel.lastVerification?.status === 'pass' ? 'Checks passed' : 'Setup incomplete'}</td>
      <td>
        <span className={'badge ' + (channel.monitored ? 'green' : 'gray')}>
          {copy.statuses[channel.connectionStatus]}
        </span>
      </td>
      <td>
        <button
          className="icon-button"
          data-component="IconButton"
          data-variant="default"
          data-size="page"
          disabled={!online}
          aria-label={(channel.monitored ? 'Pause ' : 'Resume ') + channel.displayName}
          onClick={() => (channel.monitored ? onPause(channel) : onOpen(channel.id))}
        >
          <svg className="icon" aria-hidden="true">
            <use href={channel.monitored ? '#i-pause' : '#i-play'} />
          </svg>
        </button>
        <button
          className="icon-button"
          data-component="IconButton"
          data-variant="default"
          data-size="page"
          disabled={!online}
          aria-label={'Configure ' + channel.displayName}
          onClick={() => onOpen(channel.id)}
        >
          <svg className="icon" aria-hidden="true">
            <use href="#i-settings" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

function ChannelHeading({ onOpen }: { onOpen: (id: string) => void }) {
  const online = useOnline();
  return (
    <header className="page-heading" data-component="PageHeading" data-variant="default">
      <div>
        <div className="eyebrow" data-role="eyebrow">
          {copy.eyebrow}
        </div>
        <h1 className="page-title" data-role="page-title">
          {copy.title}
        </h1>
        <p className="page-description" data-role="page-description">
          {copy.description}
        </p>
      </div>
      <button
        className="button button-primary"
        data-component="Button"
        data-variant="primary"
        data-size="page"
        disabled={!online}
        onClick={() => onOpen('new')}
      >
        {copy.add}
      </button>
    </header>
  );
}
