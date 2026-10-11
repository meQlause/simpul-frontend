import { useState } from 'react';
import { Link } from 'react-router';
import { auditCopy as copy, kindCopy, type Kind } from './audit.copy';
import type { Trace } from './audit.schema';

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
  const meta = kindCopy[trace.kind as Kind];

  return (
    <div className="audit-trace">
      <h3>{meta.headline}</h3>
      <div className="trace-view-tabs" role="tablist" aria-label={copy.trace.flow}>
        <button
          role="tab"
          aria-selected={tab === 'flow'}
          className={tab === 'flow' ? 'active' : ''}
          onClick={() => setTab('flow')}
        >
          {copy.trace.flow}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'context'}
          className={tab === 'context' ? 'active' : ''}
          onClick={() => setTab('context')}
        >
          {copy.trace.context}
        </button>
      </div>
      {tab === 'flow' ? (
        <FlowSteps trace={trace} pending={pending} onPause={onPause} />
      ) : (
        <ContextFacts trace={trace} />
      )}
    </div>
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
  const meta = kindCopy[trace.kind as Kind];
  const matchTitle = matchTitleOf(trace);
  const recipientTitle = recipientTitleOf(trace);

  return (
    <ol className="rich-decision-trace">
      <li>
        <strong>{copy.trace.stepTitles.context}</strong>
        <p>
          {trace.work?.customer
            ? `The update was linked to ${trace.work.customer}.`
            : 'The update was classified using its conversation context.'}
        </p>
      </li>
      <li>
        <strong>{matchTitle}</strong>
        <RuleBlock trace={trace} pending={pending} onPause={onPause} />
      </li>
      <li>
        <strong>{recipientTitle}</strong>
        <p>{trace.recipient?.name ?? copy.noDelivery}</p>
      </li>
      <li>
        <strong>{meta.last}</strong>
        <p>{meta.subline}</p>
      </li>
    </ol>
  );
}

function ContextFacts({ trace }: { trace: Trace }) {
  return (
    <dl className="trace-facts trace-context-facts">
      <div>
        <dt>Work item</dt>
        <dd>{trace.work?.displayId ?? 'No specific work item linked'}</dd>
      </div>
      <div>
        <dt>Customer</dt>
        <dd>{trace.work?.customer ?? 'Not recorded in this summary'}</dd>
      </div>
      <div>
        <dt>Matching rule</dt>
        <dd>
          {trace.rule ? (
            <Link to={`/rules/${trace.rule.id}`}>{trace.rule.name}</Link>
          ) : (
            'No rule matched'
          )}
        </dd>
      </div>
      <div>
        <dt>Recipient</dt>
        <dd>{trace.recipient?.name ?? copy.noDelivery}</dd>
      </div>
    </dl>
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
    return (
      <p>
        {trace.kind === 'queue'
          ? 'The detected category had no matching notification rule.'
          : copy.noDelivery}
      </p>
    );
  }

  return (
    <div className="trace-policy-box">
      <div className="trace-policy-header">
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
      </Link>
      <button className="text-button" disabled={pending} onClick={onPause}>
        {rule.active ? copy.trace.pause : copy.trace.resume}
      </button>
    </div>
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
