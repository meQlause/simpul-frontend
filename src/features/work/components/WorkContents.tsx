import { Link } from 'react-router';
import { DrawerIdentity, DrawerSection } from '../../../shared/ui/DrawerParts';
import { Icon } from '../../../shared/ui/Icon';
import type { WorkDetail } from '../work.schema';
import { workCopy as copy } from '../work.copy';
import { avatarTone, dayTime, elapsed, initialsOf, statusColor } from '../work.format';

function Summary({ item }: { item: WorkDetail }) {
  const rhythm = item.rhythm;

  return (
    <div className="drawer-work-summary">
      <span className="trace-label">LATEST RECORDED UPDATE</span>
      <p>{item.latestUpdate?.text}</p>
      <span>
        <Icon name="clock" />
        {elapsed(item.latestUpdate?.at ?? new Date().toISOString(), item.status)}
        {rhythm &&
          ` · Typical stage rhythm: ${rhythm.typicalHours} hours · Reminder ${rhythm.reminderCount}`}
      </span>
    </div>
  );
}

function Ownership({ item }: { item: WorkDetail }) {
  const owner = item.owner;
  const letters = owner ? initialsOf(owner.name) : '';

  return (
    <DrawerSection
      number="01"
      title="Ownership"
      description="Who is responsible for the next step."
    >
      <div className="drawer-person">
        <span className={`avatar ${avatarTone(letters)}`}>{letters}</span>
        <div>
          <strong>{owner?.name}</strong>
          <small>{owner?.team}</small>
        </div>
        {owner && (
          <Link className="text-button" to={`/people/${owner.id}`}>
            View role
            <Icon name="arrow-up-right" />
          </Link>
        )}
      </div>
      <dl className="trace-facts" data-component="TraceFacts" data-variant="default">
        <div>
          <dt>Backup</dt>
          <dd>{owner?.backupName ?? 'Workspace admin'}</dd>
        </div>
        <div>
          <dt>Next step</dt>
          <dd>{item.nextStep}</dd>
        </div>
      </dl>
    </DrawerSection>
  );
}

function Timeline({ item }: { item: WorkDetail }) {
  const done = item.status === 'completed';

  return (
    <DrawerSection
      number="02"
      title="Work timeline"
      description="Each change follows the recognized context."
    >
      <div className="timeline drawer-timeline">
        <div className="timeline-item">
          <span className="timeline-dot" />
          <strong>Context identified</strong>
          <p>
            <time dateTime={item.timeline.identifiedAt}>{dayTime(item.timeline.identifiedAt)}</time>{' '}
            · {item.category}
          </p>
        </div>
        <div className="timeline-item">
          <span className="timeline-dot" />
          <strong>Routing rule applied</strong>
          <p>{item.timeline.ruleApplied ?? 'No routing while tentative'}</p>
        </div>
        <div className="timeline-item">
          <span className="timeline-dot" />
          <strong>{done ? 'Work completed' : 'Waiting for the next update'}</strong>
          <p>{item.nextStep}</p>
        </div>
      </div>
    </DrawerSection>
  );
}

export function WorkContents({ item }: { item: WorkDetail }) {
  return (
    <>
      <DrawerIdentity
        icon="package"
        title={item.summary}
        description={`${item.displayId} · ${item.channel.displayName}`}
        tone={item.status === 'stalled' ? 'warm' : ''}
        status={
          <span className={`badge ${statusColor(item.status)}`}>{copy.statuses[item.status]}</span>
        }
      />
      <Summary item={item} />
      <Ownership item={item} />
      <Timeline item={item} />
      {item.closure?.reason && (
        <div className="notice">
          <Icon name="check-circle" />
          <span>
            <strong>Closure reason</strong>
            <br />
            {item.closure.reason}
          </span>
        </div>
      )}
      <div className="trace-evidence-lock">
        <span>
          <Icon name="shield" />
        </span>
        <div>
          <h3>Evidence summaries only</h3>
          <p>{copy.evidence}</p>
        </div>
      </div>
    </>
  );
}
