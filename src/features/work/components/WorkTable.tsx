import { Link } from 'react-router';
import type { SetURLSearchParams } from 'react-router';
import { useOnline } from '../../../shared/useOnline';
import type { WorkItem } from '../work.schema';
import { workCopy as copy } from '../work.copy';
import { WorkSearch } from './WorkSearch';

export function WorkTable({
  items,
  total,
  params,
  onFilter,
  loadMore,
  pending,
}: {
  items: WorkItem[];
  total: number;
  params: URLSearchParams;
  onFilter: SetURLSearchParams;
  loadMore?: () => void;
  pending: boolean;
}) {
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
    <section className="panel" data-component="Panel" data-variant="work">
      <div className="panel-header">
        <h2 className="panel-title">All work</h2>
      </div>
      <div className="toolbar">
        <div className="search-field">
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
      <div className="table-wrap">
        <table className="data-table work-table">
          <thead>
            <tr>
              {copy.columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <WorkRow key={item.displayId} item={item} />
            ))}
            {!items.length && (
              <tr>
                <td colSpan={6}>{copy.noMatch}</td>
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

function WorkRow({ item }: { item: WorkItem }) {
  const path = '/work/' + item.displayId + location.search;

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
        {item.owner?.name}
        <div className="muted text-small">{item.owner?.team}</div>
      </td>
      <td>{item.channel.displayName}</td>
      <td>
        <span className="badge" data-component="Badge" data-variant={item.status}>
          {copy.statuses[item.status]}
        </span>
      </td>
      <td>
        <time dateTime={item.lastActivityAt}>{relativeTime(item.lastActivityAt, item.status)}</time>
      </td>
      <td>
        <Link className="icon-button" to={path} aria-label={'View ' + item.displayId}>
          ›
        </Link>
      </td>
    </tr>
  );
}

function relativeTime(instant: string, status: WorkItem['status']) {
  const hour = 3600000;
  const hours = Math.max(0, Math.round((Date.now() - Date.parse(instant)) / hour));

  return status === 'stalled' ? 'No update for ' + hours + ' hours' : hours + ' hours ago';
}
