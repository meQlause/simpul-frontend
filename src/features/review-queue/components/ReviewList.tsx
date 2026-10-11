import { Link, useSearchParams } from 'react-router';
import { useOnline } from '../../../shared/useOnline';
import type { ReviewItem } from '../review-queue.schema';
import { reviewCopy as copy } from '../review-queue.copy';

export function ReviewList({
  items,
  counts,
  total,
  loadMore,
  pending,
}: {
  items: ReviewItem[];
  counts: Record<string, number>;
  total: number;
  loadMore?: () => void;
  pending: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const online = useOnline();
  const all = counts.unrouted + counts.alias + counts.category;

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
      <div className="directory-context">
        <strong>{all} updates to review</strong>
        <span>Held safely until their context or destination is clear.</span>
      </div>
      <section className="panel directory-panel" data-component="Panel" data-variant="review">
        <div className="directory-toolbar">
          <div className="directory-tabs" role="tablist" aria-label="Review kinds">
            {[
              ['', 'All updates', all],
              ['unrouted', 'Routing gaps', counts.unrouted],
              ['alias', 'Names', counts.alias],
              ['category', 'Categories', counts.category],
            ].map(([kind, label, count]) => (
              <button
                key={kind}
                role="tab"
                aria-selected={(params.get('kind') ?? '') === kind}
                disabled={!online}
                onClick={() => filter('kind', String(kind))}
              >
                {label} {count}
              </button>
            ))}
          </div>
          <input
            type="search"
            aria-label="Search updates or channels…"
            placeholder="Search updates or channels…"
            maxLength={100}
            value={params.get('q') ?? ''}
            disabled={!online}
            onChange={(event) => filter('q', event.target.value)}
          />
        </div>
        <ReviewTable items={items} />
        <div className="directory-footer">
          <span role="status">
            Showing {items.length} of {total} updates
          </span>
          {loadMore && (
            <button className="button" disabled={!online || pending} onClick={loadMore}>
              Load more
            </button>
          )}
        </div>
      </section>
      <Link to="/rules">View routing rules</Link>
    </>
  );
}

function ReviewTable({ items }: { items: ReviewItem[] }) {
  return (
    <div className="directory-table-wrap">
      <table className="directory-table">
        <thead>
          <tr>
            {['Update & context', 'Why it is held', 'Source channel', 'Detected', 'Actions'].map(
              (name) => (
                <th key={name} scope="col">
                  {name}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <Link className="directory-title" to={'/queue/' + item.id}>
                  {item.title}
                </Link>
                <p>{item.detail}</p>
              </td>
              <td>
                <span className="badge">{copy.kinds[item.kind].badge}</span>
              </td>
              <td>{item.channel.displayName}</td>
              <td>
                <time dateTime={item.detectedAt}>{item.detectedAt}</time>
              </td>
              <td>
                <Link className="button button-small" to={reviewAction(item)}>
                  {copy.kinds[item.kind].action}
                </Link>
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan={5}>
                <strong>No matches found</strong>
                <p>Try another name or filter.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function reviewAction(item: ReviewItem) {
  return item.kind === 'unrouted'
    ? '/rules/new?reviewItemId=' + item.id
    : '/queue/' + item.id + '/resolve';
}
