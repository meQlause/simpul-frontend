import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../../shared/ui/Icon';
import { useOnline } from '../../../shared/useOnline';

export function ChannelConfirmation({
  eyebrow,
  title,
  description,
  chatId,
  detail,
  children,
  label,
  onConfirm,
  onClose,
  pending,
}: {
  eyebrow: string;
  title: string;
  description: string;
  chatId?: string;
  detail?: string;
  children?: ReactNode;
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

  // On the body, not inside a drawer's own <dialog>: the drawer's rules must not reach it.
  return createPortal(
    <dialog
      ref={dialog}
      className="confirmation-popup"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      data-component="ConfirmPopup"
      data-variant="confirmation"
    >
      <button className="icon-button dialog-close" aria-label="Close dialog" onClick={onClose}>
        <Icon name="close" />
      </button>
      <div id="dialog-content">
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="detail-title" data-role="drawer-title">
          {title}
        </h2>
        <p className="page-description">{description}</p>
        {chatId && (
          <div className="drawer-policy-preview">
            <Icon name="telegram" />
            <div>
              <strong>{chatId}</strong>
              <p>{detail}</p>
            </div>
          </div>
        )}
        {children}
        <div className="form-actions">
          <button className="button" disabled={pending} onClick={onClose}>
            Cancel
          </button>
          <button
            className="button button-primary"
            disabled={pending || !online}
            onClick={onConfirm}
          >
            {label}
          </button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
