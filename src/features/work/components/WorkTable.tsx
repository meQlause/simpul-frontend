import { Link } from 'react-router';
import type { SetURLSearchParams } from 'react-router';
import { Icon } from '../../../shared/ui/Icon';
import { useOnline } from '../../../shared/useOnline';
import type { WorkItem } from '../work.schema';
import { workCopy as copy } from '../work.copy';
import { avatarTone, elapsed, initialsOf, statusColor } from '../work.format';
import { WorkSearch } from './WorkSearch';

type Props = {
  items: WorkItem[];
  total: number;
  params: URLSearchParams;
  onFilter: SetURLSearchParams;
  loadMore?: () => void;
  pending: boolean;
};

function Owner({ item }: { item: WorkItem }) {
  const letters = item.owner ? initialsOf(item.owner.name) : '';

  return (
    <div className="person">
      <span className={`avatar ${avatarTone(letters)}`}>{letters}</span>
      <div>
        {item.owner?.name.split(' ')[0]}
        <div className="muted text-small">{item.owner?.team}</div>
      </div>
    </div>
  );
}

function today() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date());
}

function Row({ item }: { item: WorkItem }) {
  const path = `/work/${item.displayId}${location.search}`;
  const stalled = item.status === 'stalled';

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
        <Owner item={item} />
      </td>
      <td>
        <span className="channel-label">
          <Icon name="telegram" />
          {item.channel.displayName}
        </span>
      </td>
      <td>
        <span
          className={`badge ${statusColor(item.status)}`}
          data-component="Badge"
          data-variant={item.status}
        >
          {copy.statuses[item.status]}
        </span>
      </td>
      <td>
        <time className={stalled ? 'warning-text' : 'muted'} dateTime={item.lastActivityAt}>
          {stalled && <Icon name="clock" />}
          {elapsed(item.lastActivityAt, item.status)}
        </time>
      </td>
      <td>
        <Link className="icon-button" to={path} aria-label={`View ${item.displayId}`}>
          <Icon name="chevron-right" />
        </Link>
      </td>
    </tr>
  );
}

function Toolbar({ params, onFilter }: Pick<Props, 'params' | 'onFilter'>) {
  const online = useOnline();

  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    void onFilter(next);
  }

  return (
    <div className="toolbar">
      <div className="search-field">
        <Icon name="search" />
        <WorkSearch value={params.get('q') ?? ''} onChange={(value) => filter('q', value)} />
      </div>
      <select
        aria-label="Filter status"
        value={params.get('status') ?? ''}
        disabled={!online}
        onChange={(event) => filter('status', event.target.value)}
      >
        <option value="">All statuses</option>
        {Object.entries(copy.statuses).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function WorkTable({ items, total, params, onFilter, loadMore, pending }: Props) {
  const online = useOnline();

  return (
    <section className="panel" data-component="Panel" data-variant="work">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">All work</h2>
          <p className="panel-subtitle">{today()}</p>
        </div>
        <span className="muted text-small" id="jobs-count">
          {total} work items
        </span>
      </div>
      <Toolbar params={params} onFilter={onFilter} />
      <div className="table-wrap">
        <table className="data-table work-table">
          <thead>
            <tr>
              {copy.columns.map((column, index) => (
                <th key={column || index} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <Row key={item.displayId} item={item} />
            ))}
            {!items.length && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">{copy.noMatch}</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="directory-footer">
        <span role="status">
          Showing {items.length} of {total} work items
        </span>
        {loadMore && (
          <button className="button button-soft" disabled={!online || pending} onClick={loadMore}>
            Load more
          </button>
        )}
      </div>
    </section>
  );
}
