import { Link, useSearchParams } from 'react-router';
import {
  DirectoryCallout,
  DirectoryContext,
  DirectoryEmpty,
  DirectoryFooter,
  DirectoryToolbar,
} from '../../../shared/ui/Directory';
import { Icon } from '../../../shared/ui/Icon';
import { useOnline } from '../../../shared/useOnline';
import { elapsed } from '../../work';
import type { ReviewItem } from '../review-queue.schema';
import { reviewCopy as copy } from '../review-queue.copy';

type Props = {
  items: ReviewItem[];
  counts: Record<string, number>;
  total: number;
  loadMore?: () => void;
  pending: boolean;
};

export function reviewAction(item: ReviewItem) {
  return item.kind === 'unrouted'
    ? `/rules/new?reviewItemId=${item.id}`
    : `/queue/${item.id}/resolve`;
}

function Row({ item }: { item: ReviewItem }) {
  const kind = copy.kinds[item.kind];

  return (
    <tr data-directory-row>
      <td data-label="Needs review">
        <div className="directory-identity">
          <span className={`directory-icon review-icon ${item.kind}`}>
            <Icon name={kind.icon} />
          </span>
          <div>
            <Link className="directory-title" to={`/queue/${item.id}`}>
              {item.title}
            </Link>
            <p>{item.detail}</p>
          </div>
        </div>
      </td>
      <td data-label="Reason">
        <span className={`badge ${kind.color}`}>{kind.badge}</span>
      </td>
      <td data-label="Source">
        <span className="directory-recipient">
          <Icon name="telegram" />
          {item.channel.displayName}
        </span>
        <small>Telegram group</small>
      </td>
      <td data-label="Detected">
        <time className="review-age" dateTime={item.detectedAt}>
          {elapsed(item.detectedAt, 'active')}
        </time>
      </td>
      <td className="directory-actions">
        <Link className="button button-small" to={reviewAction(item)}>
          {kind.action}
          <Icon name="arrow-right" />
        </Link>
      </td>
    </tr>
  );
}

function Table({ items }: { items: ReviewItem[] }) {
  return (
    <div className="table-wrap directory-table-wrap">
      <table className="directory-table">
        <thead>
          <tr>
            <th scope="col">Update &amp; context</th>
            <th scope="col">Why it is held</th>
            <th scope="col">Source channel</th>
            <th scope="col">Detected</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <Row key={item.id} item={item} />
          ))}
          {!items.length && <DirectoryEmpty columns={5} />}
        </tbody>
      </table>
    </div>
  );
}

export function ReviewList({ items, counts, total, loadMore, pending }: Props) {
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
      <DirectoryContext
        icon="inbox"
        headline={<strong>{all} updates to review</strong>}
        note="Held safely until their context or destination is clear."
      />
      {online && (
        <section
          className="panel directory-panel review-panel"
          data-component="Panel"
          data-variant="review"
        >
          <DirectoryToolbar
            tabs={[
              { key: '', label: 'All updates', count: all },
              { key: 'unrouted', label: 'Routing gaps', count: counts.unrouted },
              { key: 'alias', label: 'Names', count: counts.alias },
              { key: 'category', label: 'Categories', count: counts.category },
            ]}
            active={params.get('kind') ?? ''}
            onTab={(key) => filter('kind', key)}
            search={params.get('q') ?? ''}
            onSearch={(value) => filter('q', value)}
            placeholder="Search updates or channels…"
            disabled={!online}
          />
          <Table items={items} />
          <DirectoryFooter
            status={`Showing ${items.length} of ${total} updates`}
            loadMore={loadMore}
            pending={pending || !online}
          />
        </section>
      )}
      <DirectoryCallout
        icon="shield"
        title="Resolve the configuration, improve the next update"
        description="These are routing and vocabulary gaps. Questions about ambiguous work stay in the original conversation with the people who know."
        to="/rules"
        action="View routing rules"
      />
    </>
  );
}
