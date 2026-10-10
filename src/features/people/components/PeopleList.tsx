import { Link, useSearchParams } from 'react-router';
import type { Person } from '../people.schema';
import { peopleCopy as copy } from '../people.copy';
import { PersonRow } from './PersonRow';
import { useOnline } from '../../../shared/useOnline';

export function PeopleList({ people }: { people: Person[] }) {
  const [params, setParams] = useSearchParams();
  const online = useOnline();
  const members = people.filter((person) => person.role);
  const teams = [...new Set(members.map((person) => person.role?.team ?? 'Other'))];
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
      <PeopleHeading />
      <div className="directory-context">
        <span>
          {members.length} {copy.members}
        </span>
        {members.every((person) => person.backup) && (
          <span className="coverage-check">{copy.coverage}</span>
        )}
      </div>
      <section className="panel directory-panel" data-component="Panel" data-variant="directory">
        <div className="directory-toolbar">
          <div className="directory-tabs">
            {['', ...teams].map((value) => (
              <button
                key={value}
                className={`directory-tab ${team === value ? 'active' : ''}`}
                aria-pressed={team === value}
                disabled={!online}
                onClick={() => filter('team', value)}
              >
                {value || copy.all}
                <span>
                  {members.filter((person) => !value || person.role?.team === value).length}
                </span>
              </button>
            ))}
          </div>
          <label className="directory-search">
            <input
              type="search"
              disabled={!online}
              aria-label={copy.search}
              placeholder={copy.search}
              value={params.get('q') ?? ''}
              onChange={(event) => filter('q', event.target.value)}
            />
          </label>
        </div>
        <div className="directory-table-wrap">
          <table className="directory-table">
            <thead>
              <tr>
                {copy.columns.map((name) => (
                  <th key={name} scope="col">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((person) => (
                <PersonRow key={person.id} person={person} />
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && (
          <div className="screen-state">
            <h2>{copy.noMatch}</h2>
            <p>{copy.noMatchHelp}</p>
          </div>
        )}
      </section>
      <div className="directory-callout">
        <div>
          <h3>{copy.calloutTitle}</h3>
          <p>{copy.callout}</p>
        </div>
        <Link className="text-button" to="/settings">
          {copy.notificationSettings}
        </Link>
      </div>
    </>
  );
}

function PeopleHeading() {
  return (
    <header className="page-heading" data-component="PageHeading" data-variant="default">
      <div>
        <div className="eyebrow" data-role="eyebrow">
          {copy.eyebrow}
        </div>
        <h1 className="page-title" data-role="title">
          {copy.title}
        </h1>
        <p className="page-description" data-role="description">
          {copy.description}
        </p>
      </div>
    </header>
  );
}
