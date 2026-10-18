import { Link, useSearchParams } from 'react-router';
import { Icon } from '../../shared/ui/Icon';
import { InfoTip } from '../../shared/ui/InfoTip';
import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { exportSummary, useOverview, useOverviewIdentity } from './overview.api';
import { overviewCopy } from './overview.copy';
import type { Overview } from './overview.schema';
import { AttentionStrip, StatTiles } from './components/StatTiles';
import { RecentWork } from './components/RecentWork';
import { FlowPanel } from './components/FlowPanel';
import { LatestUpdates } from './components/LatestUpdates';

const PERIODS = [
  ['today', 'Today'],
  ['week', 'Last 7 days'],
] as const;

function longDate(timeZone: string | undefined) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  })
    .format(new Date())
    .toUpperCase();
}

// A workspace that has understood nothing, routed nothing and holds no work has no data yet.
function isEmpty(overview: Overview | undefined) {
  return (
    overview !== undefined &&
    overview.messagesUnderstood.count +
      overview.activeWork.count +
      overview.updatesDelivered.count +
      overview.needsReview.count ===
      0
  );
}

function SetupBanner({ reviewed }: { reviewed: boolean }) {
  return (
    <div className="workspace-setup-banner">
      <span>
        <Icon name="check-circle" />
        <strong>{reviewed ? 'Onboarding reviewed' : 'Set up a thoughtful first week'}</strong> ·
        Four steps, no business notifications.
      </span>
      <Link className="text-button" to="/settings/onboarding">
        Review onboarding
        <Icon name="arrow-right" />
      </Link>
    </div>
  );
}

type Identity = ReturnType<typeof useOverviewIdentity>['data'];

function Greeting({ identity }: { identity: Identity }) {
  const person = identity?.data.person.name.split(' ')[0];
  const workspace = identity?.data.workspace;

  return (
    <section className="page-heading" data-component="PageHeading" data-variant="with action">
      <div>
        <div className="eyebrow greeting-date" data-role="eyebrow">
          {longDate(workspace?.timezone)} <span />{' '}
          <span className="greeting-workspace">{workspace?.name.toUpperCase()}</span>
        </div>
        <h1 className="page-title" data-role="page-title">
          Good morning{person ? `, ${person}` : ''}
          <span className="heading-dot">.</span>
        </h1>
        <InfoTip
          title="Good morning"
          text="Conversations keep moving. Important updates reach the right people."
        />
      </div>
      <div className="heading-actions">
        <button className="button" type="button" data-action="export" onClick={exportSummary}>
          <Icon name="download" />
          {overviewCopy.download}
        </button>
      </div>
    </section>
  );
}

function PeriodSwitch({ period }: { period: string }) {
  const [, setParams] = useSearchParams();

  return (
    <div className="section-heading overview-heading">
      <div className="section-title">
        <h2>Today at a glance</h2>
      </div>
      <div className="period-switch" aria-label="Summary period">
        {PERIODS.map(([value, label]) => (
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
    </div>
  );
}

function PageFooter() {
  return (
    <footer className="page-footer">
      <span>
        <span className="tiny-dot" />
        Stay informed. Important updates are accounted for.
      </span>
      <span>
        Simpul <span>·</span> Made for work that flows.
      </span>
    </footer>
  );
}

export function OverviewPage() {
  const [params] = useSearchParams();
  const period = params.get('period') === 'week' ? 'week' : 'today';
  const query = useOverview(period);
  const identity = useOverviewIdentity();
  const state = useScreenState(query, isEmpty(query.data?.data));
  const ready = state === 'ready';
  const overview = query.data?.data;

  return (
    <>
      {!['ready', 'empty'].includes(state) && (
        <ScreenState
          state={state}
          skeleton="cards"
          grid="stats-grid"
          onRetry={() => {
            void query.refetch();
          }}
        />
      )}
      <fieldset className="offline-controls" disabled={!ready}>
        {identity.data && (
          <SetupBanner reviewed={Boolean(identity.data.data.workspace.onboardingCompletedAt)} />
        )}
        <Greeting identity={identity.data} />
        <FlowPanel />
        <PeriodSwitch period={period} />
        <StatTiles overview={overview} />
        <AttentionStrip overview={overview} />
        {ready && overview && (
          <div className="dashboard-bottom">
            <RecentWork total={overview.activeWork.count} />
            <LatestUpdates />
          </div>
        )}
        <PageFooter />
      </fieldset>
    </>
  );
}
