import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { ErrorToast } from '../../../shared/ui/ErrorToast';
import { usePeople } from '../../people';
import { useVocabulary } from '../../vocabulary';
import { Drawer } from '../../../shared/ui/Drawer';
import { DrawerIdentity, DrawerSection } from '../../../shared/ui/DrawerParts';
import { Icon } from '../../../shared/ui/Icon';
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
    heading: 'Make this name recognizable',
    section: 'Link to the right person',
    field: 'personId',
    detected: 'DETECTED NAME',
    label: 'Team member',
    note: 'The original name stays intact; this adds a recognizable reference.',
  },
  category: {
    title: 'Choose a category',
    heading: 'Give this update a category',
    section: 'Choose the right category',
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
  const [error, setError] = useState({ field: '', failure: '' });
  const disabled = !online || mutation.isPending;

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const value = String(new FormData(form).get('value'));

    if (disabled || !data.options.some((option) => option.id === value)) {
      return;
    }

    setError({ field: '', failure: '' });
    mutation.mutate(
      { [data.text.field]: value },
      {
        onSuccess: () => onSaved(item.kind),
        onError: (failure) => {
          setError(mappingError(failure));
        },
      },
    );
  }

  return { ...data, disabled, error, setError, submit };
}

// A rejected value is the select's own; any other failure is a toast (error-handling §5).
function mappingError(failure: Error) {
  return failure instanceof ApiError && failure.code === 'E-VALIDATION'
    ? { field: failure.message, failure: '' }
    : { field: '', failure: copy.failed };
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
            <Icon name="check" />
            Save mapping
          </button>
        </>
      }
    >
      <DrawerIdentity
        icon={item.kind === 'alias' ? 'users' : 'layers'}
        title={model.text.heading}
        description={item.channel.displayName}
        tone="warm"
        status={<span className="badge amber">Needs review</span>}
      />
      <div className="drawer-mapping-source">
        <span className="trace-label">{model.text.detected}</span>
        <strong>{item.detected.text}</strong>
        <p>{item.detail}</p>
      </div>
      <div className="drawer-mapping-arrow">
        <Icon name="arrow-right" />
      </div>
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
  const select = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (model.error) {
      select.current?.focus();
    }
  }, [model.error]);

  return (
    <form id="resolve-form" onSubmit={model.submit}>
      <DrawerSection
        number="01"
        title={model.text.section}
        description="Your decision applies to similar future updates."
      >
        <label className="field">
          {model.text.label}
          <select
            ref={select}
            name="value"
            defaultValue={model.suggested ?? model.options[0]?.id}
            disabled={model.disabled}
            aria-invalid={!!model.error.field}
            aria-describedby={model.error.field ? 'mapping-error' : undefined}
          >
            {model.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          {model.error.field && (
            <small role="alert" id="mapping-error" className="field-error">
              {model.error.field}
            </small>
          )}
        </label>
        <ErrorToast
          message={model.error.failure}
          onClose={() => model.setError({ field: '', failure: '' })}
        />
        <div className="drawer-inline-note">
          <Icon name="link" />
          {model.text.note}
        </div>
      </DrawerSection>
    </form>
  );
}
