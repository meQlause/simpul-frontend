import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { useWork } from './work.api';
import { WorkHeading } from './components/WorkHeading';
import { WorkToast } from './components/WorkToast';
import { WorkTable } from './components/WorkTable';
import { WorkDrawer } from './components/WorkDrawer';
import { workCopy as copy } from './work.copy';

const undoDuration = 10000;
const toastDuration = 4800;

export function WorkPage() {
  const [params, setParams] = useSearchParams();
  const filter = workFilter(params);

  const query = useWork(filter.toString());
  const items = query.data?.pages.flatMap((page) => page.data) ?? [];
  const state = useScreenState(query, items.length === 0 && !filter.size);
  const { displayId } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState({ text: '', undoId: '' });

  useEffect(() => {
    const timer = setTimeout(
      () => setNotice({ text: '', undoId: '' }),
      notice.undoId ? undoDuration : toastDuration,
    );

    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <section data-component="WorkPage" data-variant="default">
      <WorkHeading
        filter={filter.toString()}
        onExport={() => setNotice({ text: copy.exported, undoId: '' })}
      />
      {query.data && state !== 'empty' ? (
        <WorkTable
          items={items}
          total={query.data.pages[0].page.total}
          params={params}
          onFilter={setParams}
          loadMore={
            query.hasNextPage
              ? () => {
                  void query.fetchNextPage();
                }
              : undefined
          }
          pending={query.isFetchingNextPage}
        />
      ) : (
        <ScreenState
          state={state}
          onRetry={() => {
            void query.refetch();
          }}
        />
      )}
      <WorkToast notice={notice} onNotice={setNotice} />
      {displayId && (
        <WorkDrawer
          displayId={displayId}
          onClose={() => {
            void navigate('/work?' + filter);
          }}
          onSaved={() => {
            setNotice({ text: displayId + ' closed. Reminders stopped.', undoId: displayId });
            void navigate('/work?' + filter);
          }}
        />
      )}
    </section>
  );
}

function workFilter(params: URLSearchParams) {
  const filter = new URLSearchParams();

  for (const key of ['status', 'q']) {
    const value = params.get(key);

    if (value) {
      filter.set(key, value);
    }
  }

  return filter;
}
