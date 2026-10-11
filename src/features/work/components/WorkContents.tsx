import { Link } from 'react-router';
import type { WorkDetail } from '../work.schema';
import { workCopy as copy } from '../work.copy';

export function WorkContents({ item }: { item: WorkDetail }) {
  return (
    <>
      <div className="drawer-identity" data-component="DrawerIdentity" data-variant="work">
        <h3>{item.summary}</h3>
        <p>
          {item.displayId} · {item.channel.displayName}
        </p>
        <span className="badge">{copy.statuses[item.status]}</span>
      </div>
      <div className="drawer-work-summary">
        <span className="trace-label">LATEST RECORDED UPDATE</span>
        <p>{item.latestUpdate?.text}</p>
        {item.rhythm && (
          <p>
            <span>Typical stage rhythm: {item.rhythm.typicalHours} hours</span> ·{' '}
            <span>Reminder {item.rhythm.reminderCount}</span>
          </p>
        )}
      </div>
      <WorkOwnership item={item} />
      <WorkTimeline item={item} />
      {item.closure?.reason && (
        <div className="notice">
          <strong>Closure reason</strong>
          <p>{item.closure.reason}</p>
        </div>
      )}
      <div className="trace-evidence-lock">
        <h3>Evidence summaries only</h3>
        <p>{copy.evidence}</p>
      </div>
    </>
  );
}

function WorkOwnership({ item }: { item: WorkDetail }) {
  return (
    <section className="drawer-section" data-component="DrawerSection" data-variant="ownership">
      <h3>Ownership</h3>
      <p>Who is responsible for the next step.</p>
      <div className="drawer-person">
        <strong>
          {item.owner?.name} · {item.owner?.team}
        </strong>
        {item.owner && (
          <Link className="text-button" to={'/people/' + item.owner.id}>
            View role
          </Link>
        )}
      </div>
      <dl className="trace-facts">
        <div>
          <dt>Backup</dt>
          <dd>{item.owner?.backupName ?? 'Workspace admin'}</dd>
        </div>
        <div>
          <dt>Next step</dt>
          <dd>{item.nextStep}</dd>
        </div>
      </dl>
    </section>
  );
}

function WorkTimeline({ item }: { item: WorkDetail }) {
  return (
    <section className="drawer-section" data-component="DrawerSection" data-variant="timeline">
      <h3>Work timeline</h3>
      <p>Each change follows the recognized context.</p>
      <div className="timeline drawer-timeline">
        <div className="timeline-item">
          <strong>Context identified</strong>
          <p>
            <time dateTime={item.timeline.identifiedAt}>{item.timeline.identifiedAt}</time> ·{' '}
            {item.category}
          </p>
        </div>
        <div className="timeline-item">
          <strong>Routing rule applied</strong>
          <p>{item.timeline.ruleApplied ?? 'No routing while tentative'}</p>
        </div>
        <div className="timeline-item">
          <strong>
            {item.status === 'completed' ? 'Work completed' : 'Waiting for the next update'}
          </strong>
          <p>{item.nextStep}</p>
        </div>
      </div>
    </section>
  );
}
