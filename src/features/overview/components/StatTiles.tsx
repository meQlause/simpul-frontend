import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from '../../../shared/ui/Icon';
import type { Overview } from '../overview.schema';

const numbers = new Intl.NumberFormat('en-US');
const BARS = 9;
const SHOWN_RECIPIENTS = 2;
const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('');
const figure = (count: number | undefined) => (count === undefined ? '—' : numbers.format(count));

type Props = { overview?: Overview };

type TileProps = {
  label: string;
  icon: string;
  count: number | undefined;
  extra: ReactNode;
  foot: ReactNode;
  attention?: boolean;
};

function Tile({ label, icon, count, extra, foot, attention = false }: TileProps) {
  return (
    <article
      className={attention ? 'stat-card attention-stat' : 'stat-card'}
      data-component="StatCard"
      data-variant={label}
    >
      <div className="stat-top">
        <span>{label}</span>
        <Icon name={icon} />
      </div>
      <div className="stat-main">
        <strong>{figure(count)}</strong>
        {extra}
      </div>
      <div className="stat-foot">{foot}</div>
    </article>
  );
}

function Messages({ overview }: Props) {
  const tile = overview?.messagesUnderstood;
  const trend = tile?.trendPercent ?? null;

  return (
    <Tile
      label="Messages understood"
      icon="inbox"
      count={tile?.count}
      extra={
        <svg className="sparkline" viewBox="0 0 110 38" aria-hidden="true">
          <path d="M1 33 14 24 25 29 38 18 48 23 60 12 72 17 84 7 94 10 109 2" />
        </svg>
      }
      foot={
        trend !== null && (
          <>
            <span className="trend">↗ {trend}%</span>
            <span>vs. the previous period</span>
          </>
        )
      }
    />
  );
}

function Work({ overview }: Props) {
  const tile = overview?.activeWork;

  return (
    <Tile
      label="Active work"
      icon="layers"
      count={tile?.count}
      extra={
        <span className="stat-subvisual">
          {Array.from({ length: BARS }, (_item, index) => (
            <i key={index} />
          ))}
        </span>
      }
      foot={
        <>
          <span className="tiny-dot" />
          <span>{tile?.completedToday ?? 0} completed today</span>
        </>
      }
    />
  );
}

function Delivered({ overview }: Props) {
  const tile = overview?.updatesDelivered;
  const people = (tile?.topRecipients ?? []).slice(0, SHOWN_RECIPIENTS);
  const more = (tile?.recipients ?? 0) - people.length;

  return (
    <Tile
      label="Updates delivered"
      icon="send"
      count={tile?.count}
      extra={
        <span className="avatar-stack">
          {people.map((person) => (
            <span key={person.name}>{initials(person.name)}</span>
          ))}
          {more > 0 && <span>+{more}</span>}
        </span>
      }
      foot={
        <>
          <Icon name="check" />
          <span>To the right people, automatically</span>
        </>
      }
    />
  );
}

function Attention({ overview }: Props) {
  const tile = overview?.needsReview;

  return (
    <Tile
      label="Needs attention"
      icon="alert"
      attention
      count={tile?.count}
      extra={
        <Link className="stat-open" to="/queue" aria-label="Open attention queue">
          <Icon name="arrow-up-right" />
        </Link>
      }
      foot={
        <>
          <span className="amber-dot" />
          <span>{tile?.areas ?? 0} areas you can improve</span>
        </>
      }
    />
  );
}

export function StatTiles({ overview }: Props) {
  return (
    <section className="stats-grid" data-testid="home-stats" aria-label="Activity summary">
      <Messages overview={overview} />
      <Work overview={overview} />
      <Delivered overview={overview} />
      <Attention overview={overview} />
    </section>
  );
}

const kinds = [
  ['unrouted', 'No matching rule', 'Choose who needs to know'],
  ['alias', 'Names need clarification', 'Help Simpul recognize names'],
  ['category', 'Suggested category', 'Review the pattern found'],
] as const;

function Item({
  kind,
  label,
  hint,
  count,
}: {
  kind: string;
  label: string;
  hint: string;
  count: number;
}) {
  const number = String(count).padStart(2, '0');

  return (
    <Link className="attention-item" to={`/queue?kind=${kind}`} aria-label={`${number} ${label}`}>
      <span className="attention-number">{number}</span>
      <span>
        <b>{label}</b>
        <small>{hint}</small>
      </span>
      <Icon name="arrow-up-right" />
    </Link>
  );
}

export function AttentionStrip({ overview }: Props) {
  const review = overview?.needsReview;

  return (
    <section
      className="attention-strip"
      data-component="AttentionStrip"
      data-testid="home-attention"
      aria-labelledby="attention-heading"
    >
      <div className="attention-intro">
        <span className="attention-icon">
          <Icon name="sparkles" />
        </span>
        <div>
          <h2 id="attention-heading">
            A little attention.
            <br />A smoother flow.
          </h2>
          <p>Simpul found {review?.areas ?? 0} areas to review.</p>
        </div>
      </div>
      {kinds.map(([kind, label, hint]) => (
        <Item key={kind} kind={kind} label={label} hint={hint} count={review?.byKind[kind] ?? 0} />
      ))}
    </section>
  );
}
