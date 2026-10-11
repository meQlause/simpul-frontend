import { useState } from 'react';
import { Link } from 'react-router';
import { useWork } from '../../work';
import { useOnline } from '../../../shared/useOnline';

export function RecentWork({ total }: { total: number }) {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const filter = new URLSearchParams({ limit: '5' });

  if (status) {
    filter.set('status', status);
  }

  if (search) {
    filter.set('q', search);
  }

  const query = useWork(filter.toString());
  const online = useOnline();
  const items = query.data?.pages[0].data ?? [];

  return (
    <section
      className="panel work-panel"
      data-testid="recent-work"
      data-component="Panel"
      data-variant="work"
    >
      <div className="panel-header">
        <h2 data-role="panel-title">Recent work</h2>
        <Link to="/work">View all</Link>
      </div>
      <div className="toolbar">
        <input
          type="search"
          aria-label="Search recent work"
          placeholder="Search names or work…"
          value={search}
          disabled={!online}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter work status"
          value={status}
          disabled={!online}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All statuses</option>
          {['active', 'stalled', 'completed'].map((value) => (
            <option key={value} value={value}>
              {value[0].toUpperCase() + value.slice(1)}
            </option>
          ))}
        </select>
      </div>
      {query.data ? (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {['Work', 'Status', 'Owner', 'Update'].map((name) => (
                    <th key={name} scope="col">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.displayId}>
                    <td>
                      <Link
                        className="job-link"
                        to={'/work/' + item.displayId}
                        aria-label={item.displayId}
                      >
                        {item.displayId}
                        <strong title={item.customer ?? ''}>{item.customer}</strong>
                      </Link>
                      <p>{item.summary}</p>
                    </td>
                    <td>{item.status[0].toUpperCase() + item.status.slice(1)}</td>
                    <td>
                      {item.owner?.name}
                      <small>{item.owner?.team}</small>
                    </td>
                    <td>{relativeUpdate(item.lastActivityAt, item.status)}</td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={4}>No matching work. Try another keyword or status.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            {items.length} of {total} work items
          </div>
        </>
      ) : (
        <p>{query.error ? 'Recent work could not be loaded.' : 'Loading recent work�'}</p>
      )}
    </section>
  );
}

function relativeUpdate(instant: string, status: string) {
  const hour = 3600000;
  const hours = Math.max(0, Math.round((Date.now() - Date.parse(instant)) / hour));

  return status === 'stalled' ? 'No update for ' + hours + ' hours' : hours + ' hours ago';
}
