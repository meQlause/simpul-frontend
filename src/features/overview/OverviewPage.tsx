import { useSearchParams } from 'react-router';
import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { exportSummary, useOverview, useOverviewIdentity } from './overview.api';
import { overviewCopy } from './overview.copy';
import { AttentionStrip, StatTiles } from './components/StatTiles';
import { RecentWork } from './components/RecentWork';
import { FlowPanel } from './components/FlowPanel';
import { LatestUpdates } from './components/LatestUpdates';

export function OverviewPage() {
  const [params, setParams] = useSearchParams();
  const period = params.get('period') === 'week' ? 'week' : 'today';
  const query = useOverview(period);
  const identity = useOverviewIdentity();
  const state = useScreenState(query, false);
  const person = identity.data?.data.person.name.split(' ')[0];
  const date = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: identity.data?.data.workspace.timezone,
  })
    .format(new Date())
    .toUpperCase();

  return (
    <>
      <div className="section-heading" data-component="PageHeading" data-variant="with action">
        <div>
          <p className="eyebrow" data-role="eyebrow">
            {date}
          </p>
          <h1 data-role="page-title">Good morning{person ? ', ' + person : ''}.</h1>
          <p data-role="page-description">
            Here’s what’s happening in {identity.data?.data.workspace.name}.
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="button"
            type="button"
            data-action="export"
            disabled={state !== 'ready'}
            onClick={exportSummary}
          >
            {overviewCopy.download}
          </button>
        </div>
      </div>
      <ScreenState
        state={state}
        onRetry={() => {
          void query.refetch();
        }}
      />
      {state === 'ready' && query.data && (
        <>
          <FlowPanel />
          <div className="period-switch" aria-label="Summary period">
            {[
              ['today', 'Today'],
              ['week', 'Last 7 days'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={period === value}
                className={period === value ? 'active' : ''}
                onClick={() => {
                  setParams(value === 'today' ? {} : { period: value });
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <StatTiles overview={query.data.data} />
          <AttentionStrip overview={query.data.data} />
          <div className="dashboard-bottom">
            <RecentWork total={query.data.data.activeWork.count} />
            <LatestUpdates />
          </div>
        </>
      )}
    </>
  );
}
