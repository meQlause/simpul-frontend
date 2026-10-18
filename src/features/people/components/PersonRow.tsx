import { useNavigate } from 'react-router';
import { Icon } from '../../../shared/ui/Icon';
import type { Person } from '../people.schema';
import { peopleCopy as copy } from '../people.copy';

// "Mr. Hendra" is "H": the mockup drops the title before taking the first letters.
export const initials = (name: string) =>
  name
    .replace('Mr. ', '')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');

const COLOURS: Record<string, string> = { Warehouse: 'sand', Sales: 'lavender' };

export const personColour = (person: Person) => COLOURS[person.role?.team ?? ''] ?? 'mint';

// FR-UI-24: the badge says what the admin must do next for this person's Telegram.
const TELEGRAM_BADGE = {
  connected: { tone: 'green', label: copy.connected },
  waiting: { tone: 'amber', label: copy.waitingForStart },
  not_connected: { tone: 'gray', label: copy.notConnected },
} as const;

export function PersonRow({ person }: { person: Person }) {
  const navigate = useNavigate();
  const open = () => {
    void navigate(`/people/${person.id}`);
  };

  const available = person.availability === 'available';
  const badge = available ? 'green' : 'gray';
  const availability = available ? copy.available : copy.leave;

  return (
    <tr data-directory-row data-component="PersonRow" data-variant="default">
      <td data-label={copy.columns[0]}>
        <PersonIdentity person={person} onOpen={open} />
      </td>
      <td data-label={copy.role}>
        <span className="directory-role">{person.role?.name}</span>
        {person.manager && (
          <small>
            {copy.reports} {person.manager.name}
          </small>
        )}
      </td>
      <td data-label={copy.backup}>
        <div className="backup-person">
          <span className="backup-avatar">{initials(person.backup?.name ?? '')}</span>
          {person.backup?.name}
        </div>
      </td>
      <td data-label={copy.columns[3]}>
        <span className="directory-recipient">
          <Icon name="telegram" />
          {copy.telegram}
        </span>
        <small>{copy.according}</small>
        <TelegramBadge status={person.telegramStatus} />
      </td>
      <td data-label={copy.availability}>
        <span className={`badge ${badge}`} data-component="Badge" data-variant={badge}>
          {availability}
        </span>
      </td>
      <td className="directory-actions">
        <button className="button button-small" onClick={open}>
          {copy.edit}
          <Icon name="chevron-right" />
        </button>
      </td>
    </tr>
  );
}

function PersonIdentity({ person, onOpen }: { person: Person; onOpen: () => void }) {
  const handle = person.identities.find((identity) => identity.provider === 'telegram')?.handle;
  const colour = personColour(person);

  return (
    <div className="directory-identity">
      <span className={`avatar ${colour}`} data-component="Avatar" data-variant={colour}>
        {initials(person.name)}
      </span>
      <div>
        <button className="directory-title" onClick={onOpen} title={person.name}>
          {person.name}
        </button>
        <p>{handle}</p>
      </div>
    </div>
  );
}

function TelegramBadge({ status }: { status: Person['telegramStatus'] }) {
  const { tone, label } = TELEGRAM_BADGE[status];

  return (
    <span className={`badge ${tone}`} data-component="Badge" data-variant={tone}>
      {label}
    </span>
  );
}
