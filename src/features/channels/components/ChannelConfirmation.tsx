import { useEffect, useRef, type ReactNode } from 'react';
import { useOnline } from '../../../shared/useOnline';
export function ChannelConfirmation({
  title,
  children,
  label,
  onConfirm,
  onClose,
  pending,
}: {
  title: string;
  children: ReactNode;
  label: string;
  onConfirm: () => void;
  onClose: () => void;
  pending: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const online = useOnline();
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="popup"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      data-component="ConfirmPopup"
      data-variant="confirmation"
    >
      <h2 data-role="drawer-title">{title}</h2>
      {children}
      <footer>
        <button
          className="button"
          data-component="Button"
          data-variant="default"
          data-size="drawer"
          disabled={pending}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="button button-primary"
          data-component="Button"
          data-variant="primary"
          data-size="drawer"
          disabled={pending || !online}
          onClick={onConfirm}
        >
          {label}
        </button>
      </footer>
    </dialog>
  );
}
