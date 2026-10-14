import { DrawerSection } from '../../../shared/ui/DrawerParts';
import { ErrorToast } from '../../../shared/ui/ErrorToast';
import type { Category } from '../vocabulary.schema';
import { categoryInput } from '../vocabulary.schema';
import { useVocabularyForm } from '../useVocabularyForm';
import { vocabularyCopy as copy } from '../vocabulary.copy';
import { VocabularyField } from './VocabularyField';

export function CategoriesTab({
  categories,
  selected,
  onSelect,
  onSaved,
}: {
  categories: Category[];
  selected?: Category;
  onSelect: (id: string) => void;
  onSaved: () => void;
}) {
  return (
    <>
      <div className="configuration-list">
        {categories.map((category) => (
          <button
            key={category.id}
            aria-label={category.name}
            onClick={() => onSelect(category.id)}
          >
            <strong>{category.name}</strong>
            <small>{category.description ?? 'Workspace vocabulary'}</small>
          </button>
        ))}
      </div>
      <CategoryForm key={selected?.id ?? 'new'} selected={selected} onSaved={onSaved} />
    </>
  );
}

function CategoryForm({ selected, onSaved }: { selected?: Category; onSaved: () => void }) {
  const editingSchema = selected?.prefixInUse
    ? categoryInput.omit({ name: true, idPrefix: true })
    : categoryInput.omit({ name: true });
  const form = useVocabularyForm({
    path: selected ? '/categories/' + selected.id : '/categories',
    method: selected ? 'PATCH' : 'POST',
    schema: selected ? editingSchema : categoryInput,
    message: copy.categoryError,
    onSaved,
  });

  return (
    <DrawerSection
      number="01"
      title={selected ? 'Edit ' + selected.name : 'Add a category'}
      description="Description and examples make the label useful; they never choose a recipient."
    >
      <form id="vocabulary-form" onSubmit={form.submit} noValidate>
        <CategoryFields selected={selected} errors={form.errors} disabled={form.disabled} />
        <ErrorToast
          message={form.failed ? copy.failed : ''}
          onClose={() => form.setFailed(false)}
        />
      </form>
    </DrawerSection>
  );
}

function CategoryFields({
  selected,
  errors,
  disabled,
}: {
  selected?: Category;
  errors: Record<string, string>;
  disabled: boolean;
}) {
  const item = selected ?? {
    name: '',
    idPrefix: '',
    description: '',
    example: '',
    prefixInUse: false,
  };

  return (
    <>
      {[
        {
          name: 'name',
          label: 'Category name',
          value: item.name,
          readOnly: !!selected,
          max: 80,
        },
        {
          name: 'idPrefix',
          label: 'ID prefix',
          value: item.idPrefix ?? '',
          readOnly: item.prefixInUse,
          max: 3,
          hint: copy.prefixError,
        },
        {
          name: 'description',
          label: 'Description',
          value: item.description ?? '',
          readOnly: false,
          max: 300,
        },
        {
          name: 'example',
          label: 'Example message',
          value: item.example ?? '',
          readOnly: false,
          max: 300,
        },
      ].map((field) => (
        <VocabularyField
          key={field.name}
          name={field.name}
          label={field.label}
          error={errors[field.name]}
          hint={field.hint}
        >
          <input
            id={'vocab-' + field.name}
            name={field.name}
            defaultValue={field.value}
            readOnly={field.readOnly}
            maxLength={field.max}
            aria-invalid={!!errors[field.name]}
            aria-describedby={errors[field.name] ? 'vocab-error-' + field.name : undefined}
            disabled={disabled}
          />
        </VocabularyField>
      ))}
    </>
  );
}
