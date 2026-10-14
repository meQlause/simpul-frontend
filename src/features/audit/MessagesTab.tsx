import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { DirectoryToolbar, PageHeading, type Tab } from '../../shared/ui/Directory';
import { Icon } from '../../shared/ui/Icon';
import { OfflineCard, ScreenState } from '../../shared/ui/ScreenState';
import { useOnline } from '../../shared/useOnline';
import { useScreenState } from '../../shared/useScreenState';
import { useMessages } from './audit.api';
import { auditCopy, messagesCopy as copy } from './audit.copy';
import type { MessageRow as Row, MessagesPage } from './audit.schema';
import { AuditTabs, withParam } from './AuditTabs';
import { CorrectionDrawer } from './CorrectionDrawer';
import { MessageRow } from './MessageRow';

type Counts = Record<Row['outcome'], number>;

const FILTERS = ['created', 'attached', 'held', 'rejected', 'ignored'] as const;
const HEADERS = [auditCopy.columns[0], ...copy.columns, auditCopy.columns[2], ''];

function tabsOf(counts: Counts): Tab[] {
  const all = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return [
    { key: '', label: copy.filters.all, count: all },
    ...FILTERS.map((key) => ({ key, label: copy.filters[key], count: counts[key] })),
  ];
}

function isEmptyUnfiltered(page: MessagesPage | undefined, outcome: string, search: string) {
  return Boolean(page && page.data.length === 0 && !outcome && !search);
}

// The Messages tab: the tab strip and the heading stay on screen; the list, the loading, empty
// and offline states replace or join it. The URL holds the filter (outcome) and the search (q).
export function MessagesTab() {
  const [params, setParams] = useSearchParams();
  const outcome = params.get('outcome') ?? '';
  const search = params.get('q') ?? '';
  const query = useMessages(outcome, search);
  const first = query.data?.pages[0];
  const state = useScreenState(query, isEmptyUnfiltered(first, outcome, search));
  const [correcting, setCorrecting] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const retry = () => {
    void query.refetch();
  };

  return (
    <section data-component="MessagesTab" data-variant="default">
      <PageHeading
        eyebrow={auditCopy.eyebrow}
        title={auditCopy.title}
        description={auditCopy.description}
      >
        <AuditTabs active="messages" />
      </PageHeading>
      {first && state !== 'empty' ? (
        <MessageTable
          query={query}
          page={first}
          state={state}
          outcome={outcome}
          search={search}
          onFilter={(value) => setParams(withParam(params, 'outcome', value))}
          onSearch={(value) => setParams(withParam(params, 'q', value))}
          onRetry={retry}
          correcting={correcting}
          onCorrect={(unitId) => {
            setApplied(false);
            setCorrecting(unitId);
          }}
          onClose={() => setCorrecting(null)}
          onApplied={() => {
            setCorrecting(null);
            setApplied(true);
          }}
        />
      ) : (
        <ScreenState state={state} onRetry={retry} />
      )}
      {applied && (
        <div role="status" className="toast">
          {copy.correctionApplied}
        </div>
      )}
    </section>
  );
}

function MessageTable({
  query,
  page,
  state,
  outcome,
  search,
  onFilter,
  onSearch,
  onRetry,
  correcting,
  onCorrect,
  onClose,
  onApplied,
}: {
  query: ReturnType<typeof useMessages>;
  page: MessagesPage;
  state: string;
  outcome: string;
  search: string;
  onFilter: (value: string) => void;
  onSearch: (value: string) => void;
  onRetry: () => void;
  correcting: string | null;
  onCorrect: (unitId: string) => void;
  onClose: () => void;
  onApplied: () => void;
}) {
  const online = useOnline();
  const rows = query.data?.pages.flatMap((loaded) => loaded.data) ?? [];
  const target = rows.find((row) => row.unitId === correcting);

  return (
    <>
      <OfflineCard state={state} shown onRetry={onRetry} />
      <section
        className="panel directory-panel audit-panel"
        data-component="Panel"
        data-variant="directory"
      >
        <DirectoryToolbar
          tabs={tabsOf(page.counts)}
          active={outcome}
          onTab={onFilter}
          search={search}
          onSearch={onSearch}
          placeholder={copy.search}
        />
        <div className="directory-table-wrap">
          <table className="directory-table">
            <thead>
              <tr>
                {HEADERS.map((name, index) => (
                  <th key={`${index}-${name}`} scope="col">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <MessageRow
                  key={row.unitId}
                  row={row}
                  textAccess={page.textAccess}
                  disabled={!online}
                  onCorrect={() => onCorrect(row.unitId)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="directory-footer">
          <span role="status">{copy.showing(rows.length, page.page.total)}</span>
          {query.hasNextPage && (
            <button
              className="button button-soft"
              type="button"
              disabled={query.isFetchingNextPage}
              onClick={() => {
                void query.fetchNextPage();
              }}
            >
              {auditCopy.loadMore}
            </button>
          )}
        </div>
        {rows.length === 0 && (
          <div className="screen-state">
            <h2>{auditCopy.noMatch}</h2>
            <p>{auditCopy.noMatchHelp}</p>
          </div>
        )}
        <Footnote textAccess={page.textAccess} />
      </section>
      {target && <CorrectionDrawer row={target} onClose={onClose} onApplied={onApplied} />}
    </>
  );
}

function Footnote({ textAccess }: { textAccess: boolean }) {
  return (
    <p className="directory-note" data-role="footnote">
      <Icon name="shield" />
      {textAccess ? (
        copy.footnoteOn
      ) : (
        <>
          {copy.footnote.off} <Link to="/settings">{copy.footnote.link}</Link>
        </>
      )}
    </p>
  );
}
