import { Link } from 'react-router';
import type { Overview } from '../overview.schema';

const numbers = new Intl.NumberFormat('en-US');

export function StatTiles({ overview }: { overview: Overview }) {
  return (
    <section className="stats-grid" data-testid="home-stats" aria-label="Activity summary">
      <Stat label="Messages understood" count={overview.messagesUnderstood.count}>
        <>
          {overview.messagesUnderstood.trendPercent !== null && (
            <>
              <span className="trend">↗ {overview.messagesUnderstood.trendPercent}%</span>
              <span>vs. the previous period</span>
            </>
          )}
        </>
      </Stat>
      <Stat label="Active work" count={overview.activeWork.count}>
        <span>{overview.activeWork.completedToday} completed today</span>
      </Stat>
      <Stat label="Updates delivered" count={overview.updatesDelivered.count}>
        <span>To the right people, automatically</span>
        <span className="avatar-stack">
          {overview.updatesDelivered.topRecipients.map((person) => (
            <span key={person.name}>
              {person.name
                .split(' ')
                .map((part) => part[0])
                .join('')}
            </span>
          ))}
          {overview.updatesDelivered.recipients > 2 && (
            <span>+{overview.updatesDelivered.recipients - 2}</span>
          )}
        </span>
      </Stat>
      <Stat label="Needs attention" count={overview.needsReview.count}>
        <span>{overview.needsReview.areas} areas you can improve</span>
        <Link to="/queue" aria-label="Open attention queue">
          ↗
        </Link>
      </Stat>
    </section>
  );
}

function Stat({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <article className="stat-card" data-component="StatCard" data-variant={label}>
      <div className="stat-top">
        <span>{label}</span>
      </div>
      <div className="stat-main">
        <strong>{numbers.format(count)}</strong>
      </div>
      <div className="stat-foot">{children}</div>
    </article>
  );
}

export function AttentionStrip({ overview }: { overview: Overview }) {
  return (
    <section
      className="attention-strip"
      data-component="AttentionStrip"
      data-testid="home-attention"
    >
      <div className="attention-intro">
        <div>
          <h2>
            A little attention.
            <br />A smoother flow.
          </h2>
          <p>Simpul found {overview.needsReview.areas} areas to review.</p>
        </div>
      </div>
      {[
        ['unrouted', 'No matching rule'],
        ['alias', 'Names need clarification'],
        ['category', 'Suggested category'],
      ].map(([kind, label]) => (
        <Link
          key={kind}
          className="attention-item"
          to={'/queue?kind=' + kind}
          aria-label={
            String(
              overview.needsReview.byKind[kind as keyof Overview['needsReview']['byKind']],
            ).padStart(2, '0') +
            ' ' +
            label
          }
        >
          <span className="attention-number">
            {String(
              overview.needsReview.byKind[kind as keyof Overview['needsReview']['byKind']],
            ).padStart(2, '0')}
          </span>
          <b>{label}</b>
        </Link>
      ))}
    </section>
  );
}
