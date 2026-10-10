import { useState, type SubmitEvent } from 'react';
import { ApiError } from '../../shared/api/error';
import { useOnline } from '../../shared/useOnline';
import { settingsCopy as copy } from './settings.copy';
import { settingsInputSchema, type Settings } from './settings.schema';

function serverFields(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) {
    return {};
  }
  if (error.code === 'E-SETTINGS-QUIET-HOURS-EQUAL') {
    return { quietEnd: copy.equalHours };
  }
  if (error.code !== 'E-VALIDATION') {
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
      return [[detail.field, copy.invalid]];
    }),
  );
}

function focusField(form: HTMLFormElement, fields: Record<string, string>) {
  const control = form.elements.namedItem(Object.keys(fields)[0]);
  if (control instanceof HTMLElement) {
    control.focus();
  }
}

function readSettingsForm(form: HTMLFormElement) {
  const input = Object.fromEntries(new FormData(form));
  return settingsInputSchema.safeParse({ ...input, budgetPerHour: Number(input.budgetPerHour) });
}

function useSettingsForm(
  save: (input: unknown) => Promise<unknown>,
  pending: boolean,
  onSaved: () => void,
) {
  const online = useOnline();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  function showErrors(form: HTMLFormElement, fields: Record<string, string>) {
    setErrors(fields);
    focusField(form, fields);
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !online) {
      return;
    }
    const form = event.currentTarget;
    const parsed = readSettingsForm(form);
    setFailed(false);
    if (!parsed.success) {
      showErrors(
        form,
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path[0],
            issue.path[0] === 'quietEnd' ? copy.equalHours : copy.invalid,
          ]),
        ),
      );
      return;
    }
    setErrors({});
    try {
      await save(parsed.data);
      onSaved();
    } catch (error) {
      showFailure(form, error);
    }
  }
  function showFailure(form: HTMLFormElement, error: unknown) {
    const fields = serverFields(error);
    setFailed(Object.keys(fields).length === 0);
    showErrors(form, fields);
  }
  return { online, errors, failed, submit };
}

export function NotificationSettingsForm({
  settings,
  workspace,
  save,
  pending,
  onSaved,
}: {
  settings: Settings;
  workspace?: { name: string; timezone: string };
  save: (input: unknown) => Promise<unknown>;
  pending: boolean;
  onSaved: () => void;
}) {
  const { online, errors, failed, submit } = useSettingsForm(save, pending, onSaved);
  return (
    <form
      className="panel"
      onSubmit={submit}
      data-component="NotificationSettingsForm"
      data-variant="default"
    >
      <div className="panel-header">
        <div>
          <h2 className="panel-title" data-role="panel-title">
            {copy.panel}
          </h2>
          {workspace && (
            <p className="panel-subtitle" data-role="panel-subtitle">
              {copy.applies} {workspace.name} ·{' '}
              {workspace.timezone === 'Asia/Jakarta' ? copy.jakarta : workspace.timezone}
            </p>
          )}
        </div>
        <svg className="icon" aria-hidden="true">
          <use href="#i-shield" />
        </svg>
      </div>
      <fieldset className="offline-controls panel-body" disabled={!online}>
        <SettingsFields settings={settings} errors={errors} />
        <div className="notice">
          <svg className="icon" aria-hidden="true">
            <use href="#i-clock" />
          </svg>
          <span>
            {copy.noticeStart} {settings.holdSeconds}
            {copy.noticeEnd}
          </span>
        </div>
        {failed && (
          <p role="alert" className="channel-error">
            {copy.failed}
          </p>
        )}
        <div className="form-actions">
          <button
            className="button button-primary"
            type="submit"
            disabled={pending || !online}
            data-component="Button"
            data-variant="primary"
            data-role="button-label"
          >
            {copy.save}
          </button>
        </div>
      </fieldset>
    </form>
  );
}

const MAX_BUDGET = 50;
const settingFields = [
  { name: 'quietStart', label: copy.quietStart, type: 'time' },
  { name: 'quietEnd', label: copy.quietEnd, type: 'time' },
  { name: 'budgetPerHour', label: copy.budget, type: 'number', min: 1, max: MAX_BUDGET, step: 1 },
  { name: 'digestTime', label: copy.digest, type: 'time' },
] as const;

function SettingsFields({
  settings,
  errors,
}: {
  settings: Settings;
  errors: Record<string, string>;
}) {
  return (
    <div className="form-grid">
      {settingFields.map(({ name, label, ...attributes }) => (
        <div
          className="field"
          key={name}
          data-component="Field"
          data-variant={errors[name] ? 'error' : 'default'}
        >
          <label htmlFor={`settings-${name}`} data-role="field-label">
            {label}
          </label>
          <input
            id={`settings-${name}`}
            name={name}
            {...attributes}
            required
            defaultValue={settings[name]}
            aria-invalid={Boolean(errors[name])}
            aria-describedby={errors[name] ? `${name}-error` : undefined}
          />
          {name === 'budgetPerHour' && (
            <span className="muted text-small" data-role="field-hint">
              {copy.budgetHint}
            </span>
          )}
          {errors[name] && (
            <span id={`${name}-error`} role="alert" className="field-error">
              {errors[name]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
