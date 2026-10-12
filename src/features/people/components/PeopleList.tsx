import { useSearchParams } from 'react-router';
import {
  DirectoryCallout,
  DirectoryContext,
  DirectoryEmpty,
  DirectoryFooter,
  DirectoryToolbar,
  PageHeading,
} from '../../../shared/ui/Directory';
import { Icon } from '../../../shared/ui/Icon';
import { useOnline } from '../../../shared/useOnline';
import type { Person } from '../people.schema';
import { peopleCopy as copy } from '../people.copy';
import { PersonRow } from './PersonRow';

// The mockup's order of the team tabs; a team it does not know follows, alphabetically.
const TEAM_ORDER = ['Operations', 'Warehouse', 'Sales', 'Finance'];

const rank = (team: string) => {
  const index = TEAM_ORDER.indexOf(team);

  return index === -1 ? TEAM_ORDER.length : index;
};

function PeopleTable({ people }: { people: Person[] }) {
  return (
    <div className="table-wrap directory-table-wrap">
      <table className="directory-table">
        <thead>
          <tr>
            {copy.columns.slice(0, -1).map((name) => (
              <th key={name} scope="col">
                {name}
              </th>
            ))}
            <th scope="col">
              <span className="sr-only">{copy.columns[copy.columns.length - 1]}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <PersonRow key={person.id} person={person} />
          ))}
          {people.length === 0 && <DirectoryEmpty columns={copy.columns.length} />}
        </tbody>
      </table>
    </div>
  );
}

export function PeopleList({ people }: { people: Person[] }) {
  const [params, setParams] = useSearchParams();
  const online = useOnline();
  const members = people.filter((person) => person.role);
  const teams = [...new Set(members.map((person) => person.role?.team ?? 'Other'))].sort(
    (left, right) => rank(left) - rank(right) || left.localeCompare(right),
  );
  const search = (params.get('q') ?? '').toLowerCase();
  const team = params.get('team') ?? '';
  const visible = members.filter(
    (person) =>
      (!team || person.role?.team === team) &&
      `${person.name} ${person.role?.name} ${person.backup?.name}`.toLowerCase().includes(search),
  );

  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    void setParams(next);
  }

  return (
    <>
      <PageHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />
      <DirectoryContext
        icon="users"
        headline={
          <>
            <strong>{members.length} team members</strong> with defined roles.
          </>
        }
        note={
          members.every((person) => person.backup) ? (
            <span className="coverage-check">
              <Icon name="check-circle" />
              {copy.coverage}
            </span>
          ) : null
        }
      />
      <section className="panel directory-panel" data-component="Panel" data-variant="directory">
        <DirectoryToolbar
          tabs={[
            { key: '', label: copy.all, count: members.length },
            ...teams.map((value) => ({
              key: value,
              label: value,
              count: members.filter((person) => person.role?.team === value).length,
            })),
          ]}
          active={team}
          onTab={(value) => filter('team', value)}
          search={params.get('q') ?? ''}
          onSearch={(value) => filter('q', value)}
          placeholder={copy.search}
          disabled={!online}
        />
        <PeopleTable people={visible} />
        <DirectoryFooter status={`Showing ${visible.length} of ${members.length} members`} />
      </section>
      <DirectoryCallout
        icon="shield"
        title={copy.calloutTitle}
        description={copy.callout}
        to="/settings"
        action={copy.notificationSettings}
      />
    </>
  );
}
