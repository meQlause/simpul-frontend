import { useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '../../../shared/api/error';
import { Drawer } from '../../../shared/ui/Drawer';
import { OfflineControls } from '../../../shared/ui/OfflineControls';
import type { Person } from '../people.schema';
import { personInputSchema } from '../people.schema';
import { useSavePerson } from '../people.api';
import { peopleCopy as copy } from '../people.copy';
import { Icon } from '../../../shared/ui/Icon';
import { initials, personColour } from './PersonRow';
import { PersonFields } from './PersonFields';
import { PersonDelivery } from './PersonDelivery';
import { useOnline } from '../../../shared/useOnline';

function validationFields(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || error.code !== 'E-VALIDATION') {
    return {};
  }

  return Object.fromEntries(
    error.details.flatMap((detail) => {
      if (
        typeof detail !== 'object' ||
        detail === null ||
        !('field' in detail) ||
        typeof detail.field !== 'string'
      ) {
        return [];
      }

      const message =
        'message' in detail && typeof detail.message === 'string' ? detail.message : copy.invalid;

      return [[detail.field, message]];
    }),
  );
}

function focusInvalid(form: HTMLFormElement, errors: Record<string, string>) {
  const control = form.elements.namedItem(Object.keys(errors)[0]);

  if (control instanceof HTMLElement) {
    control.focus();
  }
}

function readPersonForm(form: HTMLFormElement, personId: string, eligible: Person[]) {
  const data = new FormData(form);
  const input = Object.fromEntries(
    [...data.entries()].filter(([key, value]) => key === 'roleName' || value !== ''),
  );

  return personInputSchema(
    personId,
    eligible.map((candidate) => candidate.id),
  ).safeParse(input);
}

function usePersonForm(person: Person, eligible: Person[], onSaved: () => void) {
  const mutation = useSavePerson(
    person.id,
    eligible.map((candidate) => candidate.id),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);

  function showErrors(form: HTMLFormElement, fields: Record<string, string>) {
    setErrors(fields);
    focusInvalid(form, fields);
  }

  function clearErrors() {
    setFailed(false);
    setErrors({});
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mutation.isPending) {
      return;
    }

    const form = event.currentTarget;

    clearErrors();
    const parsed = readPersonForm(form, person.id, eligible);

    if (!parsed.success) {
      const fields = Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path[0],
          issue.path[0] === 'roleName' ? copy.invalidRole : copy.invalid,
        ]),
      );

      showErrors(form, fields);

      return;
    }

    try {
      await mutation.mutateAsync(parsed.data).then(onSaved);
    } catch (error) {
      const fields = validationFields(error);

      setFailed(Object.keys(fields).length === 0);
      showErrors(form, fields);
    }
  }

  return { submit, errors, failed, pending: mutation.isPending };
}

function PersonHero({ person }: { person: Person }) {
  const handle = person.identities.find((identity) => identity.provider === 'telegram')?.handle;
  const available = person.availability === 'available';

  return (
    <div className="drawer-person-hero">
      <span className={`avatar ${personColour(person)}`}>{initials(person.name)}</span>
      <div>
        <strong>{person.name}</strong>
        <p>
          {copy.telegram}
          {handle && ` · ${handle}`}
        </p>
      </div>
      <span className={`badge ${available ? 'green' : 'gray'}`}>
        {available ? copy.available : copy.leave}
      </span>
    </div>
  );
}

export function PersonDrawer({
  person,
  people,
  onSaved,
}: {
  person: Person;
  people: Person[];
  onSaved: () => void;
}) {
  const navigate = useNavigate();
  const online = useOnline();
  const close = () => {
    void navigate('/people');
  };

  const eligible = people.filter((candidate) => candidate.id !== person.id);
  const { submit, errors, failed, pending } = usePersonForm(person, eligible, onSaved);
  const [backupId, setBackupId] = useState(person.backup?.id ?? '');

  return (
    <Drawer
      title={person.name}
      eyebrow={copy.drawerEyebrow}
      description={copy.drawerDescription}
      closeLabel={copy.close}
      onClose={close}
      footer={
        <>
          {failed && (
            <p role="alert" className="channel-error drawer-error">
              {copy.saveFailed}
            </p>
          )}
          <button type="button" className="button" onClick={close}>
            {copy.cancel}
          </button>
          <button
            className="button button-primary"
            type="submit"
            form="person-form"
            disabled={pending || !online}
          >
            <Icon name="check" />
            {copy.save}
          </button>
        </>
      }
    >
      <PersonHero person={person} />
      <form id="person-form" onSubmit={submit} noValidate>
        <OfflineControls>
          <PersonFields
            person={person}
            eligible={eligible}
            errors={errors}
            onBackup={setBackupId}
          />
          <div className="drawer-handoff">
            <span className="drawer-handoff-person">
              <Icon name="users" />
              {person.name.split(' ')[0]}
            </span>
            <Icon name="arrow-right" />
            <span className="drawer-handoff-person">
              {eligible.find((candidate) => candidate.id === backupId)?.name}
            </span>
          </div>
          <div className="drawer-inline-note">
            <Icon name="shield" />
            {copy.backupNote}
          </div>
        </OfflineControls>
      </form>
      <PersonDelivery />
    </Drawer>
  );
}
