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

type Props = { firstConnect: boolean; onConnected: () => void };

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
  const save = useConnectDatabase();
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

  return { problem, pending: save.isPending, submit, field };
}

export function DatabaseConnectionForm(props: Props) {
  const { problem, pending, submit, field } = useConnect(props);

  return (
    <form id="database-form" onSubmit={submit} noValidate data-component="DatabaseConnectionForm">
      <OfflineControls>
        {props.firstConnect && (
          <>
            <label className="channel-consent">
              <input type="checkbox" name="availabilityAck" aria-describedby="database-ack-error" />
              <span>{copy.acknowledge}</span>
            </label>
            <p id="database-ack-error" role="alert" className="channel-error">
              {problem.ack}
            </p>
          </>
        )}
        <label className="field" htmlFor="database-string">
          {copy.field}
        </label>
        <input
          id="database-string"
          ref={field}
          name="connectionString"
          type="password"
          autoComplete="off"
          aria-invalid={Boolean(problem.string)}
          aria-describedby="database-string-hint database-string-error"
        />
        <small id="database-string-hint">{copy.hint}</small>
        <p id="database-string-error" role="alert" className="channel-error">
          {problem.string}
        </p>
        <p role="alert" className="channel-error">
          {problem.failure}
        </p>
        <button className="button button-primary auth-submit" type="submit" disabled={pending}>
          {copy.connect}
        </button>
        {pending && <p role="status">{copy.connecting}</p>}
      </OfflineControls>
    </form>
  );
}
