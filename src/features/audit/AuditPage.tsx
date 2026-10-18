import { useParams, useSearchParams } from 'react-router';
import { PageHeading } from '../../shared/ui/Directory';
import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { useAudit } from './audit.api';
import { auditCopy as copy } from './audit.copy';
import { AuditTable } from './AuditTable';
import { AuditTabs, withParam } from './AuditTabs';
import { MessagesTab } from './MessagesTab';
import { TraceDrawer } from './TraceDrawer';

export function AuditPage() {
  const [params] = useSearchParams();

  return params.get('tab') === 'messages' ? <MessagesTab /> : <DecisionsTab />;
}

function DecisionsTab() {
  const [params, setParams] = useSearchParams();
  const { decisionId } = useParams();
  const { kind, search } = filtersOf(params);
  const query = useAudit(kind, search);
  const first = query.data?.pages[0];
  const state = useScreenState(query, isEmptyUnfiltered(first, kind, search));
  // The heading and tabs stay above every state, as on the Messages tab (ui-empty-layout, AC3).
  const heading = (
    <PageHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.description}>
      <AuditTabs active="decisions" />
    </PageHeading>
  );

  if (!first || state !== 'ready') {
    return (
      <section data-component="AuditPage" data-variant="default">
        {heading}
        <ScreenState
          state={state}
          onRetry={() => {
            void query.refetch();
          }}
        />
      </section>
    );
  }

  const counts = first.counts;
  const total = counts.routing + counts.work + counts.queue + counts.digest;

  return (
    <section data-component="AuditPage" data-variant="default">
      {heading}
      <div className="directory-context">
        <svg className="icon" aria-hidden="true">
          <use href="#i-history" />
        </svg>
        <span>
          <strong>{copy.summary(total)}</strong>
        </span>
        <span className="context-divider" />
        <span>{copy.timezone}</span>
      </div>
      <AuditTable
        entries={query.data?.pages.flatMap((page) => page.data) ?? []}
        total={first.page.total}
        pending={query.isFetchingNextPage}
        onLoadMore={
          query.hasNextPage
            ? () => {
                void query.fetchNextPage();
              }
            : undefined
        }
        counts={{ all: total, ...counts }}
        kind={kind}
        q={search}
        onKind={(value) => setParams(withParam(params, 'kind', value))}
        onSearch={(value) => setParams(withParam(params, 'q', value))}
      />
      <p className="directory-note">
        <svg className="icon" aria-hidden="true">
          <use href="#i-shield" />
        </svg>
        {copy.footnote}
      </p>
      {decisionId && <TraceDrawer id={decisionId} />}
    </section>
  );
}

function filtersOf(params: URLSearchParams): { kind: string; search: string } {
  return { kind: params.get('kind') ?? '', search: params.get('q') ?? '' };
}

function isEmptyUnfiltered(
  data: { data: unknown[] } | undefined,
  kind: string,
  search: string,
): boolean {
  return data?.data.length === 0 && !kind && !search;
}
