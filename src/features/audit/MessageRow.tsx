import { useId, useState } from 'react';
import { Link } from 'react-router';
import { Icon } from '../../shared/ui/Icon';
import { auditCopy, messagesCopy as copy } from './audit.copy';
import type { MessageRow as Row } from './audit.schema';
import { clockOf, matchedLines, outcomeLine, readLine } from './messages.rules';

type Step = Row['steps'][number];

const BADGE_COLOR: Record<Row['outcome'], string> = {
  created: 'green',
  attached: 'blue',
  held: 'amber',
  rejected: 'amber',
  ignored: 'gray',
  pending: 'gray',
};

const STATUS_ICON: Record<Extract<Step, { key: 'outcome' }>['status'], string> = {
  done: 'check-circle',
  held: 'pause',
  failed: 'alert',
  pending: 'clock',
};

const STEP_ICON = { read: 'inbox', matched: 'route', notified: 'send' } as const;

function dateOf(instant: string): string {
  return new Date(instant).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

function iconOf(step: Step): string {
  if (step.key === 'outcome') {
    return STATUS_ICON[step.status];
  }

  return STEP_ICON[step.key];
}

function StepBody({ step, row }: { step: Step; row: Row }) {
  if (step.key === 'read') {
    return <p>{readLine(step)}</p>;
  }

  if (step.key === 'matched') {
    return (
      <>
        {matchedLines(step, row).map((line) => (
          <p key={line}>{line}</p>
        ))}
        <ul>
          {step.candidates.map((candidate) => (
            <li key={candidate.displayId}>
              <strong>{candidate.displayId}</strong> {candidate.summary}{' '}
              <span>{candidate.score}</span>
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (step.key === 'outcome') {
    return <p>{outcomeLine(row)}</p>;
  }

  return (
    <p>
      <Link to={`/audit/${step.decisionId}`}>{copy.notified}</Link>
    </p>
  );
}

function StepItem({ number, step, row }: { number: number; step: Step; row: Row }) {
  return (
    <li className="rich-trace-step">
      <span className="rich-trace-marker">{number}</span>
      <details className="trace-step-card" open>
        <summary>
          <span className="trace-step-icon">
            <Icon name={iconOf(step)} />
          </span>
          <span className="trace-step-heading">
            <strong>{copy.steps[step.key]}</strong>
          </span>
          <Icon name="chevron-down" />
        </summary>
        <div className="trace-step-content">
          <StepBody step={step} row={row} />
        </div>
      </details>
    </li>
  );
}

// One unit of the log: its row, and when expanded, its steps and the "This is wrong" button.
export function MessageRow({
  row,
  textAccess,
  disabled,
  onCorrect,
}: {
  row: Row;
  textAccess: boolean;
  disabled: boolean;
  onCorrect?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const detailId = useId();

  return (
    <>
      <tr data-directory-row data-message-row>
        <td data-label={auditCopy.columns[0]}>
          <span className="audit-time">{clockOf(row.occurredAt)}</span>
          <small>{dateOf(row.occurredAt)} · WIB</small>
        </td>
        <td data-label={copy.columns[0]}>{row.channel.name}</td>
        <td data-label={copy.columns[1]}>{row.senderName ?? ''}</td>
        <td data-label={copy.columns[2]}>{textAccess ? (row.text ?? '') : copy.hidden}</td>
        <td data-label={auditCopy.columns[2]}>
          <span className={`badge ${BADGE_COLOR[row.outcome]}`}>{copy.badges[row.outcome]}</span>
        </td>
        <td className="directory-actions">
          <button
            className="button button-small"
            type="button"
            aria-expanded={open}
            aria-controls={detailId}
            onClick={() => setOpen(!open)}
          >
            {copy.expand}
          </button>
        </td>
      </tr>
      {open && (
        <tr id={detailId}>
          <td colSpan={6}>
            {/* On a phone each cell is a flex row: one full-width block keeps the steps and the button stacked. */}
            <div style={{ width: '100%' }}>
              <ol className="rich-decision-trace">
                {row.steps.map((step, index) => (
                  <StepItem key={step.key} number={index + 1} step={step} row={row} />
                ))}
              </ol>
              {row.outcome !== 'pending' && (
                <button
                  className="button button-soft"
                  type="button"
                  data-role="correct"
                  disabled={disabled}
                  onClick={onCorrect}
                >
                  {copy.wrong}
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
