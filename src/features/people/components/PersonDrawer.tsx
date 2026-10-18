import { useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router';
import { ChannelConfirmation } from '../../channels';
import { ApiError } from '../../../shared/api/error';
import { Drawer } from '../../../shared/ui/Drawer';
import { ErrorToast } from '../../../shared/ui/ErrorToast';
import { OfflineControls } from '../../../shared/ui/OfflineControls';
import type { Person } from '../people.schema';
import { personInputSchema } from '../people.schema';
import { useDeactivatePerson, useSavePerson, useSignedInPersonId } from '../people.api';
import { peopleCopy as copy } from '../people.copy';
import { Icon } from '../../../shared/ui/Icon';
import { initials, personColour } from './PersonRow';
import { PersonFields } from './PersonFields';
import { PersonDelivery } from './PersonDelivery';
import { InviteLink } from './InviteLink';
import { useOnline } from '../../../shared/useOnline';

// Shared with AddPersonDrawer: the server's field errors, under the field they name (FR-UI-16).
export function validationFields(error: unknown): Record<string, string> {
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
        'message' in detail && typeof detail.message === 'string'
          ? detail.message
          : detailMessage(detail);

      return [[detail.field, message]];
    }),
  );
}

// A username another person holds is the one duplicate the screens name; other details fall back to the generic line.
function detailMessage(detail: object) {
  return 'issue' in detail && detail.issue === 'duplicate' ? copy.duplicateUsername : copy.invalid;
}

export function focusInvalid(form: HTMLFormElement, errors: Record<string, string>) {
  const control = form.elements.namedItem(Object.keys(errors)[0]);

  if (control instanceof HTMLElement) {
    control.focus();
  }
}

function readPersonForm(form: HTMLFormElement, personId: string, eligible: Person[]) {
  const data = new FormData(form);
  const input = Object.fromEntries(
    // An empty username is sent on purpose: it removes the Telegram identity.
    [...data.entries()].filter(
      ([key, value]) => key === 'roleName' || key === 'telegramHandle' || value !== '',
    ),
  );

  return personInputSchema(
    personId,
    eligible.map((candidate) => candidate.id),
  ).safeParse(input);
}

// The client's own rule messages: a role has its line, a username names its rule, the rest are generic.
function clientFields(issues: { path: PropertyKey[]; message: string }[]) {
  return Object.fromEntries(
    issues.map((issue) => {
      const field = String(issue.path[0]);
      const message = {
        roleName: copy.invalidRole,
        telegramHandle: issue.message,
      }[field];

      return [field, message ?? copy.invalid];
    }),
  );
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

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mutation.isPending) {
      return;
    }

    const form = event.currentTarget;

    setFailed(false);
    setErrors({});
    const parsed = readPersonForm(form, person.id, eligible);

    if (!parsed.success) {
      showErrors(form, clientFields(parsed.error.issues));

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

  return { submit, errors, failed, setFailed, pending: mutation.isPending };
}

// FR-UI-23: deactivation waits behind an in-page confirmation. The signed-in admin is never offered it, and the server refuses it too.
function useDeactivation(person: Person, onDeactivated: () => void) {
  const deactivate = useDeactivatePerson(person.id);
  const signedInId = useSignedInPersonId().data;
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);

  async function confirm() {
    setFailed(false);

    try {
      await deactivate.mutateAsync();
      onDeactivated();
    } catch {
      setFailed(true);
    }
  }

  return {
    canDeactivate: signedInId !== undefined && signedInId !== person.id,
    confirming,
    open: () => setConfirming(true),
    dismiss: () => {
      setConfirming(false);
      setFailed(false);
    },
    failed,
    setFailed,
    pending: deactivate.isPending,
    confirm,
  };
}

type Deactivation = ReturnType<typeof useDeactivation>;

function DeactivateConfirmation({
  person,
  deactivation,
}: {
  person: Person;
  deactivation: Deactivation;
}) {
  return (
    <ChannelConfirmation
      eyebrow={copy.deactivateEyebrow}
      title={copy.deactivateTitle(person.name)}
      description={copy.deactivateDescription}
      label={copy.deactivate}
      pending={deactivation.pending}
      onClose={deactivation.dismiss}
      onConfirm={() => {
        void deactivation.confirm();
      }}
    >
      <ErrorToast
        message={deactivation.failed ? copy.saveFailed : ''}
        onClose={() => deactivation.setFailed(false)}
      />
    </ChannelConfirmation>
  );
}

function HandoffStep({ person, note }: { person: Person; note: string }) {
  return (
    <li className="drawer-handoff-person">
      <span className={`avatar ${personColour(person)}`}>{initials(person.name)}</span>
      <span>
        <strong>{person.name}</strong>
        <small>{note}</small>
      </span>
    </li>
  );
}

// Who is contacted, in order: the person, then the backup the select names right now.
function Handoff({ person, backup }: { person: Person; backup?: Person }) {
  return (
    <ol className="drawer-handoff" aria-label={copy.handoffLabel}>
      <HandoffStep person={person} note={copy.handoffFirst} />
      <li className="drawer-handoff-arrow" aria-hidden="true">
        <Icon name="arrow-right" />
      </li>
      {backup ? (
        <HandoffStep person={backup} note={copy.handoffBackup} />
      ) : (
        <li className="drawer-handoff-person is-empty">{copy.noBackup}</li>
      )}
    </ol>
  );
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
  onDeactivated,
  botUsername,
  onInviteCopied,
}: {
  person: Person;
  people: Person[];
  onSaved: () => void;
  onDeactivated: () => void;
  botUsername: string | null;
  onInviteCopied: () => void;
}) {
  const navigate = useNavigate();
  const online = useOnline();
  const close = () => {
    void navigate('/people');
  };

  const eligible = people.filter((candidate) => candidate.id !== person.id);
  const { submit, errors, failed, setFailed, pending } = usePersonForm(person, eligible, onSaved);
  const [backupId, setBackupId] = useState(person.backup?.id ?? '');
  const deactivation = useDeactivation(person, onDeactivated);

  return (
    <Drawer
      title={person.name}
      eyebrow={copy.drawerEyebrow}
      description={copy.drawerDescription}
      closeLabel={copy.close}
      onClose={close}
      footer={
        <>
          <ErrorToast message={failed ? copy.saveFailed : ''} onClose={() => setFailed(false)} />
          {deactivation.canDeactivate && (
            <button type="button" className="button" onClick={deactivation.open}>
              {copy.deactivate}
            </button>
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
      <InviteLink person={person} botUsername={botUsername} onCopied={onInviteCopied} />
      <form id="person-form" onSubmit={submit} noValidate>
        <OfflineControls>
          <PersonFields
            person={person}
            eligible={eligible}
            errors={errors}
            onBackup={setBackupId}
          />
          <Handoff
            person={person}
            backup={eligible.find((candidate) => candidate.id === backupId)}
          />
          <div className="drawer-inline-note">
            <Icon name="shield" />
            {copy.backupNote}
          </div>
        </OfflineControls>
      </form>
      <PersonDelivery />
      {deactivation.confirming && (
        <DeactivateConfirmation person={person} deactivation={deactivation} />
      )}
    </Drawer>
  );
}
