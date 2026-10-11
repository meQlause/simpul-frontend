import { Link } from 'react-router';
import { kindCopy, auditCopy as copy, type Kind } from './audit.copy';
import type { Entry } from './audit.schema';

type Counts = { all: number; routing: number; work: number; queue: number; digest: number };

const tabs = ['', 'routing', 'queue', 'work', 'digest'] as const;

export function AuditTable({
  entries,
  total,
  pending,
  onLoadMore,
  counts,
  kind,
  q,
  onKind,
  onSearch,
}: {
  entries: Entry[];
  total: number;
  pending: boolean;
  onLoadMore?: () => void;
  counts: Counts;
  kind: string;
  q: string;
  onKind: (value: string) => void;
  onSearch: (value: string) => void;
}) {
  const countOf = (value: string) => (value ? counts[value as Kind] : counts.all);

  return (
    <section
      className="panel directory-panel audit-panel"
      data-component="Panel"
      data-variant="directory"
    >
      <div className="directory-toolbar">
        <div className="directory-tabs">
          {tabs.map((value) => (
            <button
              key={value || 'all'}
              className={`directory-tab ${kind === value ? 'active' : ''}`}
              aria-pressed={kind === value}
              onClick={() => onKind(value)}
            >
              {value ? copy.tabs[value] : copy.tabs.all}
              <span>{countOf(value)}</span>
            </button>
          ))}
        </div>
        <label className="directory-search">
          <input
            type="search"
            aria-label={copy.search}
            placeholder={copy.search}
            value={q}
            onChange={(event) => onSearch(event.target.value)}
          />
        </label>
      </div>
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
            {entries.map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="directory-footer">
        <span role="status">{copy.showing(entries.length, total)}</span>
        {onLoadMore && (
          <button className="button button-soft" disabled={pending} onClick={onLoadMore}>
            {copy.loadMore}
          </button>
        )}
      </div>
      {entries.length === 0 && (
        <div className="screen-state">
          <h2>{copy.noMatch}</h2>
          <p>{copy.noMatchHelp}</p>
        </div>
      )}
    </section>
  );
}

function AuditRow({ entry }: { entry: Entry }) {
  const meta = kindCopy[entry.kind];
  const time = new Date(entry.occurredAt).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });

  return (
    <tr data-directory-row>
      <td data-label={copy.columns[0]}>
        <span className="audit-time">{time}</span>
        <small>WIB</small>
      </td>
      <td data-label={copy.columns[1]}>
        <Link className="directory-title" to={`/audit/${entry.id}`}>
          {entry.title}
        </Link>
        <p>{entry.detail}</p>
      </td>
      <td data-label={copy.columns[2]}>
        <span className={`badge ${meta.color}`}>{meta.badge}</span>
      </td>
      <td data-label={copy.columns[3]}>{entry.recipient?.name ?? copy.noDelivery}</td>
      <td className="directory-actions">
        <Link className="button button-small" to={`/audit/${entry.id}`}>
          {copy.viewTrace}
        </Link>
      </td>
    </tr>
  );
}
