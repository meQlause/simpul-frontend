import { useParams, useSearchParams } from 'react-router';
import { InfoTip } from '../../shared/ui/InfoTip';
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

  if (!first || state !== 'ready') {
    return (
      <ScreenState
        state={state}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  }

  const counts = first.counts;
  const total = counts.routing + counts.work + counts.queue + counts.digest;

  return (
    <section data-component="AuditPage" data-variant="default">
      <header className="page-heading" data-component="PageHeading" data-variant="default">
        <div>
          <div className="eyebrow" data-role="eyebrow">
            {copy.eyebrow}
          </div>
          <h1 className="page-title" data-role="title">
            {copy.title}
          </h1>
          <InfoTip title={copy.title} text={copy.description} />
        </div>
        <AuditTabs active="decisions" />
      </header>
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
