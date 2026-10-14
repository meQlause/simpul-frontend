import { useId, useState, type SubmitEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../../shared/api/error';
import { Drawer } from '../../shared/ui/Drawer';
import { ErrorToast } from '../../shared/ui/ErrorToast';
import { useVocabulary } from '../vocabulary';
import { useWork } from '../work';
import { useCorrectMessage } from './audit.api';
import { auditCopy, messagesCopy as copy } from './audit.copy';
import type { MessageRow as Row } from './audit.schema';
import { choicesFor, type Choice } from './messages.rules';

const FORM_FIELDS = ['summary', 'categoryId', 'workDisplayId'];
const OPEN_STATUSES = ['active', 'tentative', 'stalled'];

// A 422's details name the field they belong to. Only a message with a field and text counts.
function pairOf(detail: unknown): [string, string] | null {
  if (
    typeof detail !== 'object' ||
    detail === null ||
    !('field' in detail) ||
    !('message' in detail)
  ) {
    return null;
  }

  return typeof detail.field === 'string' &&
    typeof detail.message === 'string' &&
    detail.message !== ''
    ? [detail.field, detail.message]
    : null;
}

function fieldErrorsOf(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || error.code !== 'E-VALIDATION') {
    return {};
  }

  return Object.fromEntries(
    error.details.flatMap((detail) => {
      const pair = pairOf(detail);

      return pair ? [pair] : [];
    }),
  );
}

function bodyOf(choice: Choice, fields: { categoryId: string; summary: string; workId: string }) {
  if (choice === 'create') {
    const summary = fields.summary.trim();

    return { action: 'create', categoryId: fields.categoryId, ...(summary ? { summary } : {}) };
  }

  return { action: 'attach', workDisplayId: fields.workId };
}

// "This is wrong": the choices of the outcome, and the fields of the chosen one. A 422 is shown
// under its field; any other failure is an error toast inside the drawer.
export function CorrectionDrawer({
  row,
  onClose,
  onApplied,
}: {
  row: Row;
  onClose: () => void;
  onApplied: () => void;
}) {
  const choices = choicesFor(row.outcome);
  const [choice, setChoice] = useState<Choice>(choices[0] ?? 'create');
  const [fields, setFields] = useState({ categoryId: '', summary: '', workId: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const correct = useCorrectMessage();
  const formId = useId();
  const footer =
    choices.length > 0 ? (
      <button
        className="button button-primary"
        type="submit"
        form={formId}
        disabled={correct.isPending}
      >
        {copy.applyCorrection}
      </button>
    ) : null;

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailed(false);

    try {
      await correct.mutateAsync({ unitId: row.unitId, body: bodyOf(choice, fields) });
      onApplied();
    } catch (error) {
      const found = fieldErrorsOf(error);

      setErrors(found);
      setFailed(
        Object.keys(found).length === 0 ||
          Object.keys(found).some((key) => !FORM_FIELDS.includes(key)),
      );
    }
  }

  return (
    <Drawer
      title={copy.drawer[1]}
      eyebrow={copy.drawer[0]}
      description={copy.drawer[2]}
      closeLabel={copy.drawer[3]}
      onClose={onClose}
      footer={footer}
    >
      {choices.length === 0 ? (
        <p>
          <Link to={`/work/${row.work?.displayId ?? ''}`}>{copy.cancelWork}</Link>
        </p>
      ) : (
        <form id={formId} onSubmit={(event) => void submit(event)}>
          <fieldset className="correction-choices">
            {choices.map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="choice"
                  value={value}
                  checked={choice === value}
                  onChange={() => setChoice(value)}
                />
                {copy.choices[value]}
              </label>
            ))}
          </fieldset>
          {choice === 'create' ? (
            <CreateFields
              fields={fields}
              errors={errors}
              onChange={(next) => setFields({ ...fields, ...next })}
            />
          ) : (
            <AttachFields
              workId={fields.workId}
              error={errors.workDisplayId}
              onChange={(workId) => setFields({ ...fields, workId })}
            />
          )}
        </form>
      )}
      <ErrorToast
        message={failed ? auditCopy.trace.saveFailed : ''}
        onClose={() => setFailed(false)}
      />
    </Drawer>
  );
}

function CreateFields({
  fields,
  errors,
  onChange,
}: {
  fields: { categoryId: string; summary: string };
  errors: Record<string, string>;
  onChange: (next: { categoryId?: string; summary?: string }) => void;
}) {
  const vocabulary = useVocabulary();
  const categories = vocabulary.data?.data.categories ?? [];
  const categoryId = useId();
  const summaryId = useId();

  return (
    <>
      <div className="field">
        <label htmlFor={categoryId}>{copy.category}</label>
        <select
          id={categoryId}
          required
          value={fields.categoryId}
          onChange={(event) => onChange({ categoryId: event.target.value })}
        >
          <option value="" />
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <span className="field-error" role="alert">
            {errors.categoryId}
          </span>
        )}
      </div>
      <div className="field">
        <label htmlFor={summaryId}>{copy.summary}</label>
        <input
          id={summaryId}
          maxLength={200}
          required={Boolean(errors.summary)}
          value={fields.summary}
          onChange={(event) => onChange({ summary: event.target.value })}
        />
        {errors.summary && (
          <span className="field-error" role="alert">
            {errors.summary}
          </span>
        )}
      </div>
    </>
  );
}

function AttachFields({
  workId,
  error,
  onChange,
}: {
  workId: string;
  error?: string;
  onChange: (workId: string) => void;
}) {
  const [term, setTerm] = useState('');
  const work = useWork(term ? `q=${encodeURIComponent(term)}` : '');
  const items = (work.data?.pages.flatMap((page) => page.data) ?? []).filter((item) =>
    OPEN_STATUSES.includes(item.status),
  );
  const selectId = useId();

  return (
    <>
      <div className="field">
        <input
          type="search"
          aria-label={copy.work.search}
          placeholder={copy.work.search}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={selectId}>{copy.work.field}</label>
        <select
          id={selectId}
          required
          value={workId}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="" />
          {items.map((item) => (
            <option key={item.displayId} value={item.displayId}>
              {item.displayId} · {item.summary}
            </option>
          ))}
        </select>
        {error && (
          <span className="field-error" role="alert">
            {error}
          </span>
        )}
      </div>
    </>
  );
}
