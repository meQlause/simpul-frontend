import { useState, type SubmitEvent } from 'react';
import { ErrorToast } from '../../shared/ui/ErrorToast';
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

  return settingsInputSchema.safeParse({
    ...input,
    budgetPerHour: Number(input.budgetPerHour),
    contextWindowMinutes: Number(input.contextWindowMinutes),
    contextMaxMessages: Number(input.contextMaxMessages),
  });
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

  return { online, errors, failed, setFailed, submit };
}

function SettingsNotice({ holdSeconds }: { holdSeconds: number }) {
  return (
    <div className="notice">
      <svg className="icon" aria-hidden="true">
        <use href="#i-clock" />
      </svg>
      <span>
        {copy.noticeStart} {holdSeconds}
        {copy.noticeEnd}
      </span>
    </div>
  );
}

function PanelHeader({ workspace }: { workspace?: { name: string; timezone: string } }) {
  return (
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
  );
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
  const { online, errors, failed, setFailed, submit } = useSettingsForm(save, pending, onSaved);

  return (
    <>
      <form
        id={FORM_ID}
        className="panel"
        onSubmit={submit}
        data-component="NotificationSettingsForm"
        data-variant="default"
      >
        <PanelHeader workspace={workspace} />
        <fieldset className="offline-controls" disabled={!online}>
          <div className="panel-body">
            <SettingsFields
              fields={settingFields}
              settings={settings}
              errors={errors}
              form={FORM_ID}
            />
            <SettingsNotice holdSeconds={settings.holdSeconds} />
            <ErrorToast message={failed ? copy.failed : ''} onClose={() => setFailed(false)} />
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
          </div>
        </fieldset>
      </form>
      <UnderstandingPanel settings={settings} errors={errors} online={online} />
    </>
  );
}

const MAX_BUDGET = 50;
const FORM_ID = 'settings-form';
const settingFields = [
  { name: 'quietStart', label: copy.quietStart, type: 'time' },
  { name: 'quietEnd', label: copy.quietEnd, type: 'time' },
  {
    name: 'budgetPerHour',
    label: copy.budget,
    type: 'number',
    min: 1,
    max: MAX_BUDGET,
    step: 1,
    hint: copy.budgetHint,
  },
  { name: 'digestTime', label: copy.digest, type: 'time' },
] as const;
const understandingFields = [
  {
    name: 'contextWindowMinutes',
    label: copy.contextWindow,
    type: 'number',
    min: 0,
    max: 180,
    step: 1,
    hint: copy.contextHint,
  },
  {
    name: 'contextMaxMessages',
    label: copy.contextMessages,
    type: 'number',
    min: 1,
    max: 30,
    step: 1,
  },
] as const;

function UnderstandingPanel({
  settings,
  errors,
  online,
}: {
  settings: Settings;
  errors: Record<string, string>;
  online: boolean;
}) {
  return (
    <section className="panel" data-component="UnderstandingPanel" data-variant="default">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" data-role="panel-title">
            {copy.understanding}
          </h2>
        </div>
      </div>
      <fieldset className="offline-controls" disabled={!online}>
        <div className="panel-body">
          <SettingsFields
            fields={understandingFields}
            settings={settings}
            errors={errors}
            form={FORM_ID}
          />
        </div>
      </fieldset>
    </section>
  );
}

type SettingField = {
  name: string;
  label: string;
  hint?: string;
} & Record<string, string | number>;

function SettingsFields({
  fields,
  settings,
  errors,
  form,
}: {
  fields: readonly SettingField[];
  settings: Settings;
  errors: Record<string, string>;
  form: string;
}) {
  return (
    <div className="form-grid">
      {fields.map(({ name, label, hint, ...attributes }) => (
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
            form={form}
            {...attributes}
            required
            defaultValue={settings[name as keyof Settings]}
            aria-invalid={Boolean(errors[name])}
            aria-describedby={errors[name] ? `${name}-error` : undefined}
          />
          {hint && (
            <span className="muted text-small" data-role="field-hint">
              {hint}
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
