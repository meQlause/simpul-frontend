import { usePeople } from '../../people';
import { useScreenState } from '../../../shared/useScreenState';
import { ScreenState } from '../../../shared/ui/ScreenState';
import type { Vocabulary } from '../vocabulary.schema';
import { aliasInput } from '../vocabulary.schema';
import { useVocabularyForm } from '../useVocabularyForm';
import { vocabularyCopy as copy } from '../vocabulary.copy';
import { VocabularyField } from './VocabularyField';

export function AliasesTab({
  vocabulary,
  onSaved,
}: {
  vocabulary: Vocabulary;
  onSaved: () => void;
}) {
  const people = usePeople();
  const state = useScreenState(people, false);
  const form = useVocabularyForm({
    path: '/aliases',
    method: 'POST',
    schema: aliasInput,
    message: copy.aliasError,
    onSaved,
  });

  return (
    <>
      <div className="configuration-list">
        {vocabulary.aliases.map((alias) => (
          <div key={alias.id} className="drawer-check-row" data-testid="alias-row">
            <strong>{alias.alias}</strong>
            <small>Linked to {alias.person.name}</small>
          </div>
        ))}
      </div>
      <h3>Link an everyday name</h3>
      <p>Aliases resolve a person; routing still follows their role.</p>
      {people.data ? (
        <form id="vocabulary-form" onSubmit={form.submit} noValidate>
          <VocabularyField name="alias" label="Name or alias" error={form.errors.alias}>
            <input
              id="vocab-alias"
              name="alias"
              maxLength={80}
              disabled={form.disabled}
              aria-invalid={!!form.errors.alias}
            />
          </VocabularyField>
          <VocabularyField name="personId" label="Person" error={form.errors.personId}>
            <select
              id="vocab-personId"
              name="personId"
              disabled={form.disabled}
              aria-invalid={!!form.errors.personId}
            >
              {people.data.data.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </VocabularyField>
          {form.failed && <p role="alert">{copy.failed}</p>}
        </form>
      ) : (
        <ScreenState
          state={state}
          onRetry={() => {
            void people.refetch();
          }}
        />
      )}
    </>
  );
}
