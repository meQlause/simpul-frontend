import { useEffect, useRef, useState } from 'react';
import { useOnline } from '../../../shared/useOnline';
import { ApiError } from '../../../shared/api/error';
import { useWorkChange } from '../work.api';
import { closureSchema } from '../work.schema';
import { workCopy as copy } from '../work.copy';

export function CloseWorkPopup({
  displayId,
  onClose,
  onSaved,
}: {
  displayId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reasonField = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState('');
  const mutation = useWorkChange(displayId);
  const online = useOnline();

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  function submit(form: HTMLFormElement) {
    const input = closureSchema.safeParse(Object.fromEntries(new FormData(form)));

    if (!input.success) {
      setError(copy.reasonError);
      reasonField.current?.focus();

      return;
    }

    setError('');
    mutation.mutate(input.data, {
      onSuccess: onSaved,
      onError: (failure) => {
        if (failure instanceof ApiError && failure.code === 'E-VALIDATION') {
          setError(failure.message);
          reasonField.current?.focus();
        }
      },
    });
  }

  return (
    <dialog
      ref={dialog}
      className="popup confirmation-popup"
      aria-label="Close work"
      data-component="ConfirmPopup"
      data-variant="work"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(event.currentTarget);
        }}
      >
        <h2>Close work</h2>
        <label className="field">
          Close as
          <select name="closure" disabled={!online || mutation.isPending}>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="outside_chat">Moved outside chat</option>
          </select>
        </label>
        <label className="field">
          Closure reason
          <textarea
            ref={reasonField}
            name="reason"
            aria-invalid={!!error}
            aria-describedby={error ? 'closure-error' : undefined}
            disabled={!online || mutation.isPending}
            maxLength={300}
          />
        </label>
        {error && (
          <p id="closure-error" role="alert">
            {error}
          </p>
        )}
        <CloseFailure error={error} failure={mutation.error} />
        <footer>
          <button type="button" className="button" disabled={mutation.isPending} onClick={onClose}>
            Back
          </button>
          <button className="button button-primary" disabled={!online || mutation.isPending}>
            Close work
          </button>
        </footer>
      </form>
    </dialog>
  );
}

function CloseFailure({ error, failure }: { error: string; failure: Error | null }) {
  if (error || !failure) {
    return null;
  }

  const message =
    failure instanceof ApiError && failure.code === 'E-WORK-NOT-OPEN'
      ? failure.message
      : copy.saveError;

  return <p role="alert">{message}</p>;
}
