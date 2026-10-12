import { useState } from 'react';
import { Link } from 'react-router';
import { useWork } from '../../work';
import { Icon } from '../../../shared/ui/Icon';
import { useOnline } from '../../../shared/useOnline';

const SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const MINUTE = SECOND * SECONDS_PER_MINUTE;
const HOUR = MINUTE * MINUTES_PER_HOUR;
const ROWS = 5;
const COLORS: Record<string, string> = { stalled: 'amber', active: 'blue', completed: 'green' };
const AVATARS: Record<string, string> = { BS: 'sand', RA: 'lavender' };

type Item = NonNullable<ReturnType<typeof useWork>['data']>['pages'][number]['data'][number];

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? '' : 's'}`;
const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('');

function elapsed(instant: string, status: string) {
  const age = Math.max(0, Date.now() - Date.parse(instant));

  if (status === 'stalled') {
    return `No update for ${plural(Math.round(age / HOUR), 'hour')}`;
  }

  return age < HOUR
    ? `${plural(Math.round(age / MINUTE), 'minute')} ago`
    : `${plural(Math.round(age / HOUR), 'hour')} ago`;
}

function Owner({ item }: { item: Item }) {
  const letters = item.owner ? initials(item.owner.name) : '';

  return (
    <div className="person">
      <span className={`avatar ${AVATARS[letters] ?? 'mint'}`}>{letters}</span>
      <div>
        {item.owner?.name.split(' ')[0]}
        <div className="muted text-small">{item.owner?.team}</div>
      </div>
    </div>
  );
}

function Update({ item }: { item: Item }) {
  const stalled = item.status === 'stalled';

  return (
    <span className={stalled ? 'warning-text' : 'muted'}>
      {stalled && <Icon name="clock" />}
      {elapsed(item.lastActivityAt, item.status)}
    </span>
  );
}

function Row({ item }: { item: Item }) {
  const path = `/work/${item.displayId}`;

  return (
    <tr>
      <td>
        <Link className="job-link" to={path} aria-label={item.displayId}>
          <span className="mono muted">{item.displayId}</span>
          <strong title={item.customer ?? ''}>{item.customer}</strong>
        </Link>
        <div className="text-small muted">{item.summary}</div>
      </td>
      <td>
        <span className={`badge ${COLORS[item.status] ?? 'gray'}`}>
          {item.status[0].toUpperCase() + item.status.slice(1)}
        </span>
      </td>
      <td>
        <Owner item={item} />
      </td>
      <td>
        <Update item={item} />
      </td>
      <td>
        <Link className="icon-button" to={path} aria-label={`View ${item.displayId}`}>
          <Icon name="chevron-right" />
        </Link>
      </td>
    </tr>
  );
}

function Table({ items }: { items: Item[] }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Work</th>
            <th>Status</th>
            <th>Owner</th>
            <th>Update</th>
            <th>
              <span className="sr-only">Detail</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <Row key={item.displayId} item={item} />
          ))}
          {!items.length && (
            <tr>
              <td colSpan={5}>
                <div className="empty-state">No matching work. Try another keyword or status.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

type Toolbar = {
  search: string;
  status: string;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
};

function WorkToolbar({ search, status, onSearch, onStatus }: Toolbar) {
  const online = useOnline();

  return (
    <div className="toolbar">
      <label className="search-field">
        <Icon name="search" />
        <input
          type="search"
          aria-label="Search recent work"
          placeholder="Search names or work…"
          value={search}
          disabled={!online}
          onChange={(event) => onSearch(event.target.value)}
        />
      </label>
      <label className="filter-field">
        <Icon name="filter" />
        <select
          aria-label="Filter work status"
          value={status}
          disabled={!online}
          onChange={(event) => onStatus(event.target.value)}
        >
          <option value="">All statuses</option>
          {['active', 'stalled', 'completed'].map((value) => (
            <option key={value} value={value}>
              {value[0].toUpperCase() + value.slice(1)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function RecentWork({ total }: { total: number }) {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const filter = new URLSearchParams({ limit: String(ROWS) });

  if (status) {
    filter.set('status', status);
  }

  if (search) {
    filter.set('q', search);
  }

  const query = useWork(filter.toString());
  const items = query.data?.pages[0].data;

  return (
    <section
      className="panel work-panel"
      data-testid="recent-work"
      data-component="Panel"
      data-variant="work"
      aria-labelledby="work-heading"
    >
      <div className="panel-header">
        <div className="panel-title-row">
          <h2 id="work-heading" data-role="panel-title">
            Recent work
          </h2>
          <span className="count-badge">{total}</span>
        </div>
        <Link className="text-button" to="/work">
          View all <Icon name="arrow-right" />
        </Link>
      </div>
      <WorkToolbar search={search} status={status} onSearch={setSearch} onStatus={setStatus} />
      {items ? (
        <>
          <Table items={items} />
          <div className="table-footer">
            <span>
              {items.length} of {total} work items
            </span>
            <span className="tiny-dot" />
            <span>Linked to your team’s conversations</span>
          </div>
        </>
      ) : (
        <p>{query.error ? 'Recent work could not be loaded.' : 'Loading recent work…'}</p>
      )}
    </section>
  );
}
