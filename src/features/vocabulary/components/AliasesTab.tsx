import { DrawerSection } from '../../../shared/ui/DrawerParts';
import { ErrorToast } from '../../../shared/ui/ErrorToast';
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
      <DrawerSection
        number="01"
        title="Link an everyday name"
        description="Aliases resolve a person; routing still follows their role."
      >
        {people.data ? (
          <form id="vocabulary-form" onSubmit={form.submit} noValidate>
            <VocabularyField name="alias" label="Name or alias" error={form.errors.alias}>
              <input
                id="vocab-alias"
                name="alias"
                maxLength={80}
                disabled={form.disabled}
                aria-invalid={!!form.errors.alias}
                aria-describedby={form.errors.alias ? 'vocab-error-alias' : undefined}
              />
            </VocabularyField>
            <VocabularyField name="personId" label="Person" error={form.errors.personId}>
              <select
                id="vocab-personId"
                name="personId"
                disabled={form.disabled}
                aria-invalid={!!form.errors.personId}
                aria-describedby={form.errors.personId ? 'vocab-error-personId' : undefined}
              >
                {people.data.data.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </VocabularyField>
            <ErrorToast
              message={form.failed ? copy.failed : ''}
              onClose={() => form.setFailed(false)}
            />
          </form>
        ) : (
          <ScreenState
            state={state}
            onRetry={() => {
              void people.refetch();
            }}
          />
        )}
      </DrawerSection>
    </>
  );
}
