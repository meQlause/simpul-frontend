import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../../shared/ui/Icon';
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

  useEffect(() => {
    dialog.current?.showModal();
    reasonField.current?.focus();
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

  // Rendered on the body, not inside the drawer's own <dialog>: the drawer's rules must not reach it.
  return createPortal(
    <dialog
      ref={dialog}
      className="confirmation-popup"
      aria-label="Close work"
      data-component="ConfirmPopup"
      data-variant="work"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button className="icon-button dialog-close" aria-label="Close dialog" onClick={onClose}>
        <Icon name="close" />
      </button>
      <div id="dialog-content">
        <div className="eyebrow">CONFIRM COMPLETION</div>
        <h2 className="detail-title">Close work item {displayId}</h2>
        <p className="page-description">
          Reminders will stop. Add a reason so the decision can be traced.
        </p>
        <CloseForm
          error={error}
          failure={mutation.error}
          pending={mutation.isPending}
          reasonField={reasonField}
          onSubmit={submit}
          onBack={onClose}
        />
      </div>
    </dialog>,
    document.body,
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

function CloseForm({
  error,
  failure,
  pending,
  reasonField,
  onSubmit,
  onBack,
}: {
  error: string;
  failure: Error | null;
  pending: boolean;
  reasonField: React.RefObject<HTMLTextAreaElement | null>;
  onSubmit: (form: HTMLFormElement) => void;
  onBack: () => void;
}) {
  const online = useOnline();

  return (
    <form
      id="complete-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(event.currentTarget);
      }}
    >
      <label className="field">
        Close as
        <select name="closure" disabled={!online || pending}>
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
          rows={3}
          placeholder="Example: the customer received and confirmed the goods."
          aria-invalid={!!error}
          aria-describedby={error ? 'closure-error' : undefined}
          disabled={!online || pending}
          maxLength={300}
        />
      </label>
      {error && (
        <p id="closure-error" role="alert">
          {error}
        </p>
      )}
      <CloseFailure error={error} failure={failure} />
      <div className="form-actions">
        <button type="button" className="button" disabled={pending} onClick={onBack}>
          Back
        </button>
        <button className="button button-primary" disabled={!online || pending}>
          Close work
        </button>
      </div>
    </form>
  );
}
