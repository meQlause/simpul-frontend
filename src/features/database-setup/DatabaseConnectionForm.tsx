import { Icon } from '../../shared/ui/Icon';
import { ErrorToast } from '../../shared/ui/ErrorToast';
import { useRef, useState } from 'react';
import type { SubmitEvent } from 'react';
import { ApiError } from '../../shared/api/error';
import { OfflineControls } from '../../shared/ui/OfflineControls';
import { useConnectDatabase } from './database.api';
import { databaseCopy as copy } from './database.copy';

const SCHEME = /^postgres(ql)?:\/\//;
const NONE = { ack: '', string: '', failure: '' };

function failureOf(error: unknown) {
  return error instanceof ApiError && error.code in copy.failures
    ? copy.failures[error.code]
    : copy.failed;
}

type Props = {
  firstConnect: boolean;
  onConnected: () => void;
  placeholder?: string;
  submitLabel?: string;
  // The submit button lives elsewhere (a drawer footer) and targets this form by its id.
  externalSubmit?: boolean;
};

function refusal(values: FormData, firstConnect: boolean) {
  if (firstConnect && values.get('availabilityAck') !== 'on') {
    return { ...NONE, ack: copy.needAck };
  }

  if (!SCHEME.test(String(values.get('connectionString')).trim())) {
    return { ...NONE, string: copy.needString };
  }

  return null;
}

function payload(values: FormData, firstConnect: boolean) {
  const connectionString = String(values.get('connectionString')).trim();

  return firstConnect ? { connectionString, availabilityAck: true as const } : { connectionString };
}

function useConnect({ firstConnect, onConnected }: Props) {
  const save = useConnectDatabase(firstConnect);
  const field = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState(NONE);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const refused = refusal(values, firstConnect);

    if (refused) {
      setProblem(refused);
      field.current?.focus();

      return;
    }

    setProblem(NONE);

    try {
      await save.mutateAsync(payload(values, firstConnect));
      onConnected();
    } catch (error) {
      setProblem({ ...NONE, failure: failureOf(error) });
    } finally {
      if (field.current) {
        field.current.value = '';
        field.current.focus();
      }
    }
  }

  return { problem, setProblem, pending: save.isPending, submit, field };
}

export function DatabaseConnectionForm(props: Props) {
  const { problem, setProblem, pending, submit, field } = useConnect(props);

  return (
    <form id="database-form" onSubmit={submit} noValidate data-component="DatabaseConnectionForm">
      <OfflineControls>
        {props.firstConnect && (
          <>
            <div className="field">
              <label className="channel-consent">
                <input
                  type="checkbox"
                  name="availabilityAck"
                  aria-describedby="database-ack-error"
                />
                <span>{copy.acknowledge}</span>
              </label>
            </div>
            <p id="database-ack-error" role="alert" className="channel-error">
              {problem.ack}
            </p>
          </>
        )}
        <div className="field">
          <label htmlFor="database-string">{copy.field}</label>
          <input
            id="database-string"
            ref={field}
            name="connectionString"
            type="password"
            autoComplete="off"
            placeholder={props.placeholder}
            aria-invalid={Boolean(problem.string)}
            aria-describedby="database-string-hint database-string-error"
          />
          <span id="database-string-hint" className="muted text-small">
            {copy.hint}
          </span>
        </div>
        <p id="database-string-error" role="alert" className="channel-error">
          {problem.string}
        </p>
        <ErrorToast
          message={problem.failure}
          onClose={() => setProblem({ ...problem, failure: '' })}
        />
        {!props.externalSubmit && (
          <button className="button button-primary auth-submit" type="submit" disabled={pending}>
            {props.submitLabel ?? copy.connect}
            <Icon name="arrow-right" />
          </button>
        )}
        {pending && (
          <p role="status" className="drawer-inline-note">
            <Icon name="clock" />
            {copy.connecting}
          </p>
        )}
      </OfflineControls>
    </form>
  );
}
