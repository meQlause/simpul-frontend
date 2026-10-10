import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { usePeople } from './people.api';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PeopleList } from './components/PeopleList';
import { PersonDrawer } from './components/PersonDrawer';
import { peopleCopy as copy } from './people.copy';

export function PeoplePage() {
  const query = usePeople();
  const state = useScreenState(query, query.data?.data.length === 0);
  const { personId } = useParams();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
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
  const person = people.find((candidate) => candidate.id === personId);
  return (
    <section data-component="PeoplePage" data-variant="default">
      <PeopleList people={people} />
      {saved && (
        <div role="status" className="toast">
          {copy.saved}
        </div>
      )}
      {person && (
        <PersonDrawer
          key={person.id}
          person={person}
          people={people}
          onSaved={() => {
            setSaved(true);
            void navigate('/people');
          }}
        />
      )}
      {personId && !person && <ScreenState state="not-found" />}
    </section>
  );
}
