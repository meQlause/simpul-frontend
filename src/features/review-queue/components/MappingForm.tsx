import { useState, type SubmitEvent } from 'react';
import { usePeople } from '../../people';
import { useVocabulary } from '../../vocabulary';
import { Drawer } from '../../../shared/ui/Drawer';
import { ScreenState } from '../../../shared/ui/ScreenState';
import { useScreenState } from '../../../shared/useScreenState';
import { useOnline } from '../../../shared/useOnline';
import { ApiError } from '../../../shared/api/error';
import type { ReviewItem } from '../review-queue.schema';
import { useResolveReview } from '../review-queue.api';
import { reviewCopy as copy } from '../review-queue.copy';

const mappingCopy = {
  alias: {
    title: 'Link a name',
    field: 'personId',
    detected: 'DETECTED NAME',
    label: 'Team member',
    note: 'The original name stays intact; this adds a recognizable reference.',
  },
  category: {
    title: 'Choose a category',
    field: 'categoryId',
    detected: 'DETECTED CATEGORY',
    label: 'Category',
    note: 'Categories describe an update. Routing rules still determine its recipients.',
  },
};

function useMappingOptions(item: ReviewItem) {
  const people = usePeople();
  const vocabulary = useVocabulary();

  if (item.kind === 'alias') {
    return {
      query: people,
      options: people.data?.data ?? [],
      suggested: item.detected.suggestedPersonId,
      text: mappingCopy.alias,
    };
  }

  return {
    query: vocabulary,
    options: vocabulary.data?.data.categories ?? [],
    suggested: item.detected.suggestedCategoryId,
    text: mappingCopy.category,
  };
}

function useMapping(item: ReviewItem, onSaved: (kind: string) => void) {
  const data = useMappingOptions(item);
  const mutation = useResolveReview(item.id);
  const online = useOnline();
  const [error, setError] = useState('');
  const disabled = !online || mutation.isPending;

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const value = String(new FormData(form).get('value'));

    if (disabled || !data.options.some((option) => option.id === value)) {
      return;
    }

    setError('');
    mutation.mutate(
      { [data.text.field]: value },
      {
        onSuccess: () => onSaved(item.kind),
        onError: (failure) => {
          setError(mappingError(failure));
          (form.elements.namedItem('value') as HTMLSelectElement).focus();
        },
      },
    );
  }

  return { ...data, disabled, error, submit };
}

function mappingError(failure: Error) {
  return failure instanceof ApiError && failure.code === 'E-VALIDATION'
    ? failure.message
    : copy.failed;
}

export function MappingForm({
  item,
  onClose,
  onSaved,
}: {
  item: ReviewItem;
  onClose: () => void;
  onSaved: (kind: string) => void;
}) {
  const model = useMapping(item, onSaved);
  const state = useScreenState(model.query, false);

  return (
    <Drawer
      title={model.text.title}
      eyebrow="NEEDS REVIEW / VOCABULARY"
      description="One clear mapping makes the next conversation easier to understand."
      closeLabel="Close mapping"
      onClose={onClose}
      footer={
        <>
          <button className="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button button-primary"
            form="resolve-form"
            type="submit"
            disabled={model.disabled || !model.query.data}
          >
            Save mapping
          </button>
        </>
      }
    >
      <p>
        {model.text.detected} · {item.detected.text}
      </p>
      <p>{item.detail}</p>
      {model.query.data ? (
        <MappingFields model={model} />
      ) : (
        <ScreenState
          state={state}
          onRetry={() => {
            void model.query.refetch();
          }}
        />
      )}
    </Drawer>
  );
}

function MappingFields({ model }: { model: ReturnType<typeof useMapping> }) {
  return (
    <form id="resolve-form" onSubmit={model.submit}>
      <label className="field">
        {model.text.label}
        <select
          name="value"
          defaultValue={model.suggested ?? model.options[0]?.id}
          disabled={model.disabled}
          aria-invalid={!!model.error}
        >
          {model.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
      {model.error && <p role="alert">{model.error}</p>}
      <p>{model.text.note}</p>
    </form>
  );
}
