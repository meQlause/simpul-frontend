import type { Person } from '../people.schema';
import { peopleCopy as copy } from '../people.copy';
import { InfoTip } from '../../../shared/ui/InfoTip';

type Props = {
  person: Person;
  eligible: Person[];
  errors: Record<string, string>;
  onBackup: (id: string) => void;
};

export function PersonFields({ person, eligible, errors, onBackup }: Props) {
  return (
    <>
      <section className="drawer-section">
        <div className="drawer-section-heading">
          <span>01</span>
          <div>
            <h3>{copy.responsibility}</h3>
            <InfoTip title={copy.responsibility} text={copy.responsibilityDescription} />
          </div>
        </div>
        <div className="drawer-section-content">
          <label className="field" htmlFor="person-role">
            <span id="person-role-label">{copy.role}</span>
            <input
              id="person-role"
              name="roleName"
              aria-labelledby="person-role-label"
              defaultValue={person.role?.name}
              maxLength={60}
              aria-invalid={Boolean(errors.roleName)}
              aria-describedby="person-role-help person-role-error"
            />
            <small id="person-role-help">{copy.roleHelp}</small>
            <small id="person-role-error" role="alert">
              {errors.roleName}
            </small>
          </label>
          <PersonSelect
            name="managerId"
            label={copy.supervisor}
            value={person.manager?.id}
            eligible={eligible}
            error={errors.managerId}
          />
          <label className="field" htmlFor="person-availability">
            <span id="person-availability-label">{copy.availability}</span>
            <select
              id="person-availability"
              name="availability"
              aria-labelledby="person-availability-label"
              defaultValue={person.availability}
              aria-invalid={Boolean(errors.availability)}
              aria-describedby="availability-error"
            >
              <option value="available">{copy.available}</option>
              <option value="leave">{copy.leave}</option>
            </select>
            <small id="availability-error" role="alert">
              {errors.availability}
            </small>
          </label>
        </div>
      </section>
      <section className="drawer-section">
        <div className="drawer-section-heading">
          <span>02</span>
          <div>
            <h3>{copy.backupTitle}</h3>
            <InfoTip title={copy.backupTitle} text={copy.backupDescription} />
          </div>
        </div>
        <div className="drawer-section-content">
          <PersonSelect
            name="backupPersonId"
            label={copy.backup}
            value={person.backup?.id}
            eligible={eligible}
            error={errors.backupPersonId}
            onChange={onBackup}
          />
        </div>
      </section>
    </>
  );
}

function PersonSelect({
  name,
  label,
  value,
  eligible,
  error,
  onChange,
}: {
  name: string;
  label: string;
  value?: string;
  eligible: Person[];
  error?: string;
  onChange?: (id: string) => void;
}) {
  return (
    <label className="field" htmlFor={`person-${name}`}>
      <span id={`${name}-label`}>{label}</span>
      <select
        id={`person-${name}`}
        name={name}
        aria-labelledby={`${name}-label`}
        defaultValue={value ?? ''}
        aria-invalid={Boolean(error)}
        aria-describedby={`${name}-error`}
        onChange={(event) => onChange?.(event.target.value)}
      >
        <option value="" />
        {eligible.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </select>
      <small id={`${name}-error`} role="alert">
        {error}
      </small>
    </label>
  );
}
