import { useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router';
import { Drawer } from '../../../shared/ui/Drawer';
import { ErrorToast } from '../../../shared/ui/ErrorToast';
import { OfflineControls } from '../../../shared/ui/OfflineControls';
import { Icon } from '../../../shared/ui/Icon';
import { useOnline } from '../../../shared/useOnline';
import { useCreatePerson } from '../people.api';
import { newPersonSchema, TEAMS } from '../people.schema';
import { peopleCopy as copy } from '../people.copy';
import { focusInvalid, validationFields } from './PersonDrawer';

type Errors = Record<string, string>;

// The schema's own messages are the copy, so each field shows the line its rule has.
function readNewPerson(form: HTMLFormElement) {
  return newPersonSchema.safeParse(Object.fromEntries(new FormData(form)));
}

function fieldMessages(issues: { path: PropertyKey[]; message: string }[]): Errors {
  return Object.fromEntries(issues.map((issue) => [String(issue.path[0]), issue.message]));
}

// FR-UI-23: the new person gets a role of their own and no sign-in; their Telegram account links on their first message.
function useNewPerson(onSaved: () => void) {
  const create = useCreatePerson();
  const [errors, setErrors] = useState<Errors>({});
  const [failed, setFailed] = useState(false);

  function reset() {
    setFailed(false);
    setErrors({});
  }

  function showErrors(form: HTMLFormElement, fields: Errors) {
    setErrors(fields);
    focusInvalid(form, fields);
  }

  function showFailure(form: HTMLFormElement, error: unknown) {
    const fields = validationFields(error);

    setFailed(Object.keys(fields).length === 0);
    showErrors(form, fields);
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (create.isPending) {
      return;
    }

    const form = event.currentTarget;
    const parsed = readNewPerson(form);

    reset();

    if (!parsed.success) {
      showErrors(form, fieldMessages(parsed.error.issues));

      return;
    }

    try {
      await create.mutateAsync(parsed.data);
      onSaved();
    } catch (error) {
      showFailure(form, error);
    }
  }

  return { submit, errors, failed, setFailed, pending: create.isPending };
}

function NewPersonFields({ errors }: { errors: Errors }) {
  return (
    <section className="drawer-section">
      <div className="drawer-section-content">
        <label className="field" htmlFor="new-person-name">
          <span id="new-person-name-label">{copy.name}</span>
          <input
            id="new-person-name"
            name="name"
            aria-labelledby="new-person-name-label"
            maxLength={120}
            aria-invalid={Boolean(errors.name)}
            aria-describedby="new-person-name-error"
          />
          <small id="new-person-name-error" role="alert">
            {errors.name}
          </small>
        </label>
        <label className="field" htmlFor="new-person-telegram">
          <span id="new-person-telegram-label">{copy.telegramUsername}</span>
          <input
            id="new-person-telegram"
            name="telegramHandle"
            aria-labelledby="new-person-telegram-label"
            maxLength={33}
            aria-invalid={Boolean(errors.telegramHandle)}
            aria-describedby="new-person-telegram-help new-person-telegram-error"
          />
          <small id="new-person-telegram-help">{copy.usernameHelp}</small>
          <small id="new-person-telegram-error" role="alert">
            {errors.telegramHandle}
          </small>
        </label>
        <label className="field" htmlFor="new-person-role">
          <span id="new-person-role-label">{copy.role}</span>
          <input
            id="new-person-role"
            name="roleName"
            aria-labelledby="new-person-role-label"
            maxLength={60}
            aria-invalid={Boolean(errors.roleName)}
            aria-describedby="new-person-role-help new-person-role-error"
          />
          <small id="new-person-role-help">{copy.roleHelp}</small>
          <small id="new-person-role-error" role="alert">
            {errors.roleName}
          </small>
        </label>
        <label className="field" htmlFor="new-person-team">
          <span id="new-person-team-label">{copy.team}</span>
          <select
            id="new-person-team"
            name="team"
            aria-labelledby="new-person-team-label"
            defaultValue="Other"
            aria-invalid={Boolean(errors.team)}
          >
            {TEAMS.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

export function AddPersonDrawer({ onSaved }: { onSaved: () => void }) {
  const navigate = useNavigate();
  const online = useOnline();
  const { submit, errors, failed, setFailed, pending } = useNewPerson(onSaved);
  const close = () => {
    void navigate('/people');
  };

  return (
    <Drawer
      title={copy.addTitle}
      eyebrow={copy.addEyebrow}
      description={copy.addDescription}
      closeLabel={copy.close}
      onClose={close}
      footer={
        <>
          <ErrorToast message={failed ? copy.saveFailed : ''} onClose={() => setFailed(false)} />
          <button type="button" className="button" onClick={close}>
            {copy.cancel}
          </button>
          <button
            className="button button-primary"
            type="submit"
            form="add-person-form"
            disabled={pending || !online}
          >
            <Icon name="check" />
            {copy.savePerson}
          </button>
        </>
      }
    >
      <form id="add-person-form" onSubmit={submit} noValidate>
        <OfflineControls>
          <NewPersonFields errors={errors} />
        </OfflineControls>
      </form>
    </Drawer>
  );
}
