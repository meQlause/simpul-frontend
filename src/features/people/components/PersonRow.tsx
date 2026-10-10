import { useNavigate } from 'react-router';
import type { Person } from '../people.schema';
import { peopleCopy as copy } from '../people.copy';

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
        <div className="backup-person">{person.backup?.name}</div>
      </td>
      <td data-label={copy.columns[3]}>
        <span className="directory-recipient">{copy.telegram}</span>
        <small>{copy.according}</small>
      </td>
      <td data-label={copy.availability}>
        <span className={`badge ${badge}`} data-component="Badge" data-variant={badge}>
          {availability}
        </span>
      </td>
      <td className="directory-actions">
        <button className="button button-small" onClick={open}>
          {copy.edit}
        </button>
      </td>
    </tr>
  );
}

function PersonIdentity({ person, onOpen }: { person: Person; onOpen: () => void }) {
  const handle = person.identities.find((identity) => identity.provider === 'telegram')?.handle;
  const colours: Record<string, string> = { Warehouse: 'sand', Sales: 'lavender' };
  const colour = colours[person.role?.team ?? ''] ?? 'mint';
  return (
    <div className="directory-identity">
      <span className={`avatar ${colour}`} data-component="Avatar" data-variant={colour}>
        {person.name
          .split(' ')
          .map((part) => part[0])
          .slice(0, 2)
          .join('')}
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
