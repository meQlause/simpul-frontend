import { useParams, useSearchParams } from 'react-router';
import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { useAudit } from './audit.api';
import { auditCopy as copy } from './audit.copy';
import { AuditTable } from './AuditTable';
import { TraceDrawer } from './TraceDrawer';

export function AuditPage() {
  const [params, setParams] = useSearchParams();
  const { decisionId } = useParams();
  const { kind, search } = filtersOf(params);
  const query = useAudit(kind, search);
  const state = useScreenState(query, isEmptyUnfiltered(query.data, kind, search));

  if (!query.data || state !== 'ready') {
    return (
      <ScreenState
        state={state}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  }

  const counts = query.data.counts;
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
          <p className="page-description" data-role="description">
            {copy.description}
          </p>
        </div>
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
        entries={query.data.data}
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

function withParam(params: URLSearchParams, key: string, value: string): URLSearchParams {
  const next = new URLSearchParams(params);

  if (value) {
    next.set(key, value);
  } else {
    next.delete(key);
  }

  return next;
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
