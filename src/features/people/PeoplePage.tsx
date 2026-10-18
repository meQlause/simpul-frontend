import { OfflineCard, ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { usePeople } from './people.api';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PeopleList } from './components/PeopleList';
import { PersonDrawer } from './components/PersonDrawer';
import { AddPersonDrawer } from './components/AddPersonDrawer';
import type { Person } from './people.schema';
import { peopleCopy as copy } from './people.copy';

export function PeoplePage() {
  const query = usePeople();
  const state = useScreenState(query, query.data?.data.length === 0);
  const { personId } = useParams();
  const navigate = useNavigate();
  const [toast, setToast] = useState('');

  if (!query.data || ['loading', 'error', 'not-found', 'empty'].includes(state)) {
    return (
      <ScreenState
        state={state}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  }

  const people = query.data.data;

  // Every drawer closes to the list and says what happened there.
  const close = (message: string) => {
    setToast(message);
    void navigate('/people');
  };

  return (
    <section data-component="PeoplePage" data-variant="default">
      <OfflineCard
        state={state}
        shown
        onRetry={() => {
          void query.refetch();
        }}
      />
      <PeopleList people={people} />
      {toast && (
        <div role="status" className="toast">
          {toast}
        </div>
      )}
      <PeopleDrawers
        personId={personId}
        people={people}
        botUsername={query.data.meta.botUsername}
        onClose={close}
        onToast={setToast}
      />
    </section>
  );
}

function PeopleDrawers({
  personId,
  people,
  botUsername,
  onClose,
  onToast,
}: {
  personId?: string;
  people: Person[];
  botUsername: string | null;
  onClose: (message: string) => void;
  onToast: (message: string) => void;
}) {
  const inviteCopied = () => onToast(copy.inviteCopied);
  const person = people.find((candidate) => candidate.id === personId);

  if (personId === 'new') {
    return (
      <AddPersonDrawer
        botUsername={botUsername}
        onInviteCopied={inviteCopied}
        onSaved={() => onClose('')}
      />
    );
  }

  if (!personId) {
    return null;
  }

  if (!person) {
    return <ScreenState state="not-found" />;
  }

  return (
    <PersonDrawer
      key={person.id}
      person={person}
      people={people}
      onSaved={() => onClose(copy.saved)}
      onDeactivated={() => onClose(copy.deactivated)}
      botUsername={botUsername}
      onInviteCopied={inviteCopied}
    />
  );
}
