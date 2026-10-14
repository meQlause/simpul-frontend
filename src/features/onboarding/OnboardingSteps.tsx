import { Link } from 'react-router';
import { InfoTip } from '../../shared/ui/InfoTip';
import { onboardingCopy as copy } from './onboarding.copy';
import { isReady, type Channel, type PersonRow, type Rule } from './onboarding.rules';
import { channelName } from '../channels';

export function PeopleStep({
  rows,
  backups,
  onBackup,
}: {
  rows: PersonRow[];
  backups: Record<string, string>;
  onBackup: (roleId: string, personId: string) => void;
}) {
  return (
    <section className="drawer-section">
      <Heading number="01" title={copy.people.title} description={copy.people.description} />
      <div className="drawer-section-content">
        {rows.map((row) => (
          <label className="field" key={row.roleId}>
            <span>
              {row.name} · {row.role}
            </span>
            <select
              value={backups[row.roleId] ?? ''}
              onChange={(event) => onBackup(row.roleId, event.target.value)}
            >
              <option value="">{copy.people.choose}</option>
              {rows.map((option) => (
                <option key={option.personId} value={option.personId}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </section>
  );
}

export function GroupsStep({ channels }: { channels: Channel[] }) {
  return (
    <section className="drawer-section">
      <Heading number="02" title={copy.groups.title} description={copy.groups.description} />
      <div className="drawer-section-content">
        {channels.map((channel) => (
          <div className="drawer-check-row" key={channel.id}>
            <div>
              <strong>{channelName(channel)}</strong>
              <small>
                {channel.class} · {channel.connectionStatus}
              </small>
            </div>
            <span className={`badge ${isReady(channel) ? 'green' : 'gray'}`}>
              {isReady(channel) ? copy.groups.ready : copy.groups.needsSetup}
            </span>
            <Link className="text-button" to={`/channels/${channel.id}`}>
              {copy.groups.configure}
            </Link>
          </div>
        ))}
        <div className="drawer-inline-note">{copy.groups.history}</div>
      </div>
    </section>
  );
}

export function RulesStep({
  rules,
  active,
  onToggle,
}: {
  rules: Rule[];
  active: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <section className="drawer-section">
      <Heading number="03" title={copy.rules.title} description={copy.rules.description} />
      <div className="drawer-section-content">
        {rules.map((rule) => (
          <label className="onboard-rule" key={rule.id}>
            <input
              type="checkbox"
              checked={active.includes(rule.id)}
              onChange={() => onToggle(rule.id)}
            />
            <strong>{rule.name}</strong>
            <small>{copy.rules.estimate(rule.weeklyEstimate)}</small>
          </label>
        ))}
      </div>
    </section>
  );
}

export function FirstWeekStep({
  people,
  groups,
  budget,
  quietStart,
  quietEnd,
}: {
  people: number;
  groups: number;
  budget: number;
  quietStart: string;
  quietEnd: string;
}) {
  return (
    <section className="drawer-section">
      <Heading number="04" title={copy.first.title} description={copy.first.description} />
      <div className="drawer-section-content">
        <div className="drawer-policy-preview">
          <svg className="icon" aria-hidden="true">
            <use href="#i-leaf" />
          </svg>
          <div>
            <strong>{copy.first.noticeTitle}</strong>
            <InfoTip title={copy.first.noticeTitle} text={copy.first.noticeBody} />
          </div>
        </div>
        <dl className="trace-facts">
          <div>
            <dt>People</dt>
            <dd>{copy.first.people(people)}</dd>
          </div>
          <div>
            <dt>Groups</dt>
            <dd>{copy.first.groups(groups)}</dd>
          </div>
          <div>
            <dt>History</dt>
            <dd>{copy.first.history}</dd>
          </div>
          <div>
            <dt>Safeguards</dt>
            <dd>{copy.first.safeguards(budget, quietStart, quietEnd)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

function Heading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="drawer-section-heading">
      <span>{number}</span>
      <div>
        <h3>{title}</h3>
        <InfoTip title={title} text={description} />
      </div>
    </div>
  );
}
