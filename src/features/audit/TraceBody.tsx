import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from '../../shared/ui/Icon';
import { InfoTip } from '../../shared/ui/InfoTip';
import { avatarTone, initialsOf } from '../work';
import { auditCopy as copy, kindCopy, type Kind } from './audit.copy';
import type { Trace } from './audit.schema';

const DONE_ICON = 'check-circle';

const KIND_ICONS: Record<Kind, string> = {
  routing: 'send',
  work: DONE_ICON,
  queue: 'inbox',
  digest: 'layers',
};

const WORKSPACE_ZONE = 'Asia/Jakarta';

function recordedAt(instant: string, parts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { ...parts, timeZone: WORKSPACE_ZONE }).format(
    new Date(instant),
  );
}

// "10:50" — the clock of the workspace, as the mockup writes it.
const clockOf = (instant: string) =>
  recordedAt(instant, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

const dateOf = (instant: string) =>
  recordedAt(instant, { month: 'short', day: 'numeric', year: 'numeric' });

export function TraceHeader({ trace }: { trace: Trace }) {
  return (
    <header className="trace-header">
      <div className="eyebrow" data-role="eyebrow">
        HISTORY &amp; AUDIT <span>/</span> DECISION TRACE
      </div>
      <h2 id="drawer-title" className="detail-title" data-role="title">
        {trace.title}
      </h2>
      <div className="trace-record-meta">
        <span>
          <Icon name="clock" />
          {dateOf(trace.occurredAt)} · {clockOf(trace.occurredAt)} WIB
        </span>
      </div>
    </header>
  );
}

function Hero({ trace }: { trace: Trace }) {
  const kind = trace.kind as Kind;
  const meta = kindCopy[kind];
  const held = kind === 'queue';
  const lastStep = { routing: 'Delivered', work: 'Updated', queue: 'Held', digest: 'Digest' }[kind];

  return (
    <section className={`trace-outcome-hero ${held ? 'is-held' : ''}`} data-testid="trace-hero">
      <div className="trace-hero-top">
        <span className="trace-hero-icon">
          <Icon name={KIND_ICONS[kind]} />
        </span>
        <span className="trace-hero-status">
          <Icon name={held ? 'pause' : DONE_ICON} />
          {meta.badge}
        </span>
      </div>
      <h3>{meta.headline}</h3>
      <p>{meta.subline}</p>
      <div className="trace-path">
        <span>
          <Icon name="telegram" />
          Context
        </span>
        <Icon name="chevron-right" />
        <span>
          <Icon name="route" />
          {held ? 'Rule gap' : 'Policy'}
        </span>
        <Icon name="chevron-right" />
        <span>
          <Icon name={KIND_ICONS[kind]} />
          {lastStep}
        </span>
      </div>
    </section>
  );
}

function Step({
  number,
  icon,
  title,
  tag,
  open = false,
  children,
}: {
  number: number;
  icon: string;
  title: string;
  tag: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="rich-trace-step">
      <span className="rich-trace-marker">{number}</span>
      <details className="trace-step-card" open={open}>
        <summary>
          <span className="trace-step-icon">
            <Icon name={icon} />
          </span>
          <span className="trace-step-heading">
            <strong>{title}</strong>
            <small>{tag}</small>
          </span>
          <Icon name="chevron-down" />
        </summary>
        <div className="trace-step-content">{children}</div>
      </details>
    </li>
  );
}

function ContextStep({ trace }: { trace: Trace }) {
  const work = trace.work;

  return (
    <Step
      number={1}
      icon="layers"
      title={copy.trace.stepTitles.context}
      tag={work?.displayId ?? 'Conversation context'}
      open
    >
      <p>
        {work?.customer ? (
          <>
            The update was linked to <strong>{work.customer}</strong> and its existing work context.
          </>
        ) : (
          'The update was classified using its conversation context.'
        )}
      </p>
      {work ? (
        <Link className="trace-linked-work" to={`/work/${work.displayId}`}>
          <span className="directory-icon">
            <Icon name="package" />
          </span>
          <span>
            <strong>{work.customer}</strong>
            <small>
              {work.displayId} · {work.summary}
            </small>
          </span>
          <Icon name="arrow-up-right" />
        </Link>
      ) : (
        <div className="trace-inline-fact">
          <Icon name="layers" />
          <span>Operational conversation summary</span>
        </div>
      )}
      <div className="trace-agent-note">
        <Icon name="sparkles" />
        <span>{copy.trace.aiNote}</span>
      </div>
    </Step>
  );
}

const NO_RULE_SENTENCES: Record<Kind, string> = {
  queue:
    'The detected category had no matching notification rule. A recipient could not be selected.',
  work: 'Completion evidence matched the work item, so its reminders were stopped.',
  routing: 'The recorded policy was applied to this update.',
  digest: 'Related updates were grouped according to the digest schedule and notification limits.',
};

function NoRule({ kind }: { kind: Kind }) {
  const held = kind === 'queue';

  return (
    <>
      <p>{NO_RULE_SENTENCES[kind]}</p>
      <div className={`trace-inline-fact ${held ? 'hold-fact' : ''}`}>
        <Icon name={held ? 'pause' : 'shield'} />
        <span>{held ? 'Safe outcome: hold the update' : 'Configured policy applied'}</span>
      </div>
    </>
  );
}

function RuleBlock({
  trace,
  pending,
  onPause,
}: {
  trace: Trace;
  pending: boolean;
  onPause: () => void;
}) {
  const rule = trace.rule;

  if (!rule) {
    return <NoRule kind={trace.kind as Kind} />;
  }

  return (
    <>
      <p>A configured rule matched the recognized update.</p>
      <div className="trace-policy-box">
        <div className="trace-policy-header">
          <Icon name="route" />
          <strong>{rule.name}</strong>
          <span className={`badge ${rule.active ? 'green' : 'gray'}`}>
            {rule.active ? copy.trace.ruleActive : copy.trace.rulePaused}
          </span>
        </div>
        <dl className="trace-facts">
          <div>
            <dt>When</dt>
            <dd>{rule.conditionText}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{rule.category ?? ''}</dd>
          </div>
          <div>
            <dt>Notify</dt>
            <dd>{rule.recipientLabel ?? ''}</dd>
          </div>
        </dl>
        <Link className="text-button" to={`/rules/${rule.id}`}>
          {copy.trace.inspect}
          <Icon name="arrow-up-right" />
        </Link>
        <button className="text-button" disabled={pending} onClick={onPause}>
          {rule.active ? copy.trace.pause : copy.trace.resume}
          <Icon name="pause" />
        </button>
      </div>
    </>
  );
}

function matchTitleOf(trace: Trace): string {
  if (trace.rule) {
    return copy.trace.stepTitles.matched;
  }

  return trace.kind === 'queue' ? copy.trace.stepTitles.gap : copy.trace.stepTitles.policy;
}

function recipientTitleOf(trace: Trace): string {
  if (trace.recipient) {
    return copy.trace.stepTitles.recipient;
  }

  return trace.work ? copy.trace.stepTitles.workState : copy.trace.stepTitles.none;
}

function RecipientBody({ trace }: { trace: Trace }) {
  const recipient = trace.recipient;

  if (!recipient) {
    return (
      <p>
        {trace.work
          ? 'The recorded work state changed. No additional delivery is recorded in this entry.'
          : 'No recipient was selected. The update remains available for configuration review.'}
      </p>
    );
  }

  const letters = initialsOf(recipient.name);

  return (
    <>
      <div className="trace-recipient-row">
        <span className={`avatar ${avatarTone(letters)}`}>{letters}</span>
        <div>
          <strong>{recipient.name}</strong>
          <small>{recipient.roleName ?? 'Digest recipient'}</small>
        </div>
        <span className="badge green">Resolved</span>
      </div>
      <dl className="trace-facts">
        <div>
          <dt>Selection</dt>
          <dd>
            {recipient.selection === 'digest' ? 'Configured digest recipient' : 'Configured role'}
          </dd>
        </div>
        {recipient.backupName && (
          <div>
            <dt>Backup</dt>
            <dd>{recipient.backupName}</dd>
          </div>
        )}
      </dl>
    </>
  );
}

function OutcomeBody({ trace }: { trace: Trace }) {
  const kind = trace.kind as Kind;
  const held = kind === 'queue';
  const sentence = {
    queue: 'No notification was sent. Define a routing rule to give similar updates a destination.',
    work: 'The work item was closed and further reminders stopped.',
    digest: 'The recorded updates were combined into a single digest.',
    routing: 'The 60-second hold completed before the recorded delivery.',
  }[kind];

  return (
    <>
      <p>{sentence}</p>
      <div className="trace-outcome-stamp">
        <Icon name={held ? 'pause' : DONE_ICON} />
        <span>{kindCopy[kind].badge}</span>
        <time dateTime={trace.occurredAt}>{clockOf(trace.occurredAt)} WIB</time>
      </div>
    </>
  );
}

function FlowSteps({
  trace,
  pending,
  onPause,
}: {
  trace: Trace;
  pending: boolean;
  onPause: () => void;
}) {
  const kind = trace.kind as Kind;

  return (
    <ol className="rich-decision-trace" data-testid="trace-steps">
      <ContextStep trace={trace} />
      <Step
        number={2}
        icon="route"
        title={matchTitleOf(trace)}
        tag={trace.rule?.category ?? 'Deterministic check'}
        open
      >
        <RuleBlock trace={trace} pending={pending} onPause={onPause} />
      </Step>
      <Step
        number={3}
        icon="users"
        title={recipientTitleOf(trace)}
        tag={trace.recipient?.name ?? 'No delivery recorded'}
      >
        <RecipientBody trace={trace} />
      </Step>
      <Step
        number={4}
        icon={KIND_ICONS[kind]}
        title={kindCopy[kind].badge}
        tag={`${clockOf(trace.occurredAt)} WIB`}
      >
        <OutcomeBody trace={trace} />
      </Step>
    </ol>
  );
}

function TraceLink({ to, label }: { to: string; label: string }) {
  return (
    <Link className="trace-work-link" to={to}>
      {label}
      <Icon name="arrow-up-right" />
    </Link>
  );
}

function workFacts(work: Trace['work']): [string, ReactNode][] {
  if (!work) {
    return [
      ['Work item', 'No specific work item linked'],
      ['Customer', 'Not recorded in this summary'],
      ['Source', 'Operational conversation'],
    ];
  }

  return [
    ['Work item', <TraceLink key="work" to={`/work/${work.displayId}`} label={work.displayId} />],
    ['Customer', work.customer ?? 'Not recorded in this summary'],
    ['Source', work.channelName ?? 'Operational conversation'],
  ];
}

function ContextFacts({ trace }: { trace: Trace }) {
  const { rule, recipient } = trace;
  const facts: [string, ReactNode][] = [
    ...workFacts(trace.work),
    [
      'Matching rule',
      rule ? <TraceLink to={`/rules/${rule.id}`} label={rule.name} /> : 'No rule matched',
    ],
    ['Recipient', recipient?.name ?? copy.noDelivery],
  ];

  return (
    <>
      <dl className="trace-facts trace-context-facts">
        {facts.map(([term, value]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="trace-evidence-lock">
        <span>
          <Icon name="shield" />
        </span>
        <div>
          <h3>Raw conversation access is restricted</h3>
          <InfoTip
            title="Raw conversation access is restricted"
            text="Decisions are shown as summaries. Source message content is not exposed."
          />
        </div>
      </div>
    </>
  );
}

export function TraceBody({
  trace,
  pending,
  onPause,
}: {
  trace: Trace;
  pending: boolean;
  onPause: () => void;
}) {
  const [tab, setTab] = useState<'flow' | 'context'>('flow');

  return (
    <>
      <Hero trace={trace} />
      <div className="trace-view-tabs" role="tablist" aria-label="Trace details">
        <button
          role="tab"
          aria-selected={tab === 'flow'}
          className={tab === 'flow' ? 'active' : ''}
          onClick={() => setTab('flow')}
        >
          {copy.trace.flow}
          <span>4 steps</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === 'context'}
          className={tab === 'context' ? 'active' : ''}
          onClick={() => setTab('context')}
        >
          {copy.trace.context}
          <Icon name="link" />
        </button>
      </div>
      <section className="trace-tab-panel" role="tabpanel">
        <div className="trace-section-heading">
          <h3>{tab === 'flow' ? copy.trace.flowHeading : copy.trace.contextHeading}</h3>
          <span>{tab === 'flow' ? 'Expand a step for details' : 'Summary access only'}</span>
        </div>
        {tab === 'flow' ? (
          <FlowSteps trace={trace} pending={pending} onPause={onPause} />
        ) : (
          <ContextFacts trace={trace} />
        )}
      </section>
      <div className="trace-privacy-line">
        <Icon name="shield" />
        Decisions stay explainable
      </div>
    </>
  );
}
