import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { useReviewQueue } from './review-queue.api';
import { reviewCopy as copy } from './review-queue.copy';
import { ReviewList } from './components/ReviewList';
import { ReviewDrawer } from './components/ReviewDrawer';

const toastDuration = 4800;

export function ReviewQueuePage() {
  const [params] = useSearchParams();
  const query = useReviewQueue(params.toString());
  const items = query.data?.pages.flatMap((page) => page.data) ?? [];
  const state = useScreenState(query, emptyQueue(items.length, params.size));
  const { itemId, action } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setNotice(''), toastDuration);

    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <section data-component="ReviewQueuePage" data-variant="default">
      <header className="page-heading">
        <div>
          <div className="eyebrow">{copy.eyebrow}</div>
          <h1 className="page-title">{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
      </header>
      {query.data && state !== 'empty' ? (
        <ReviewList
          items={items}
          counts={query.data.pages[0].counts}
          total={query.data.pages[0].page.total}
          pending={query.isFetchingNextPage}
          loadMore={
            query.hasNextPage
              ? () => {
                  void query.fetchNextPage();
                }
              : undefined
          }
        />
      ) : (
        <ScreenState
          state={state}
          onRetry={() => {
            void query.refetch();
          }}
        />
      )}
      {notice && (
        <p className="toast visible" role="status">
          {notice}
        </p>
      )}
      {itemId && (
        <ReviewDrawer
          id={itemId}
          mapping={action === 'resolve'}
          onClose={() => {
            void navigate('/queue');
          }}
          onSaved={(kind) => {
            setNotice(kind === 'alias' ? 'Alias linked.' : 'Category saved.');
            void navigate('/queue');
          }}
        />
      )}
    </section>
  );
}

function emptyQueue(rows: number, filters: number) {
  return rows === 0 && filters === 0;
}
