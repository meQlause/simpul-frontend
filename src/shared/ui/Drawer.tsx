import { useEffect, useRef, type ReactNode } from 'react';

export function Drawer({
  title,
  eyebrow,
  description,
  onClose,
  children,
  footer,
  closeLabel,
}: {
  title: string;
  eyebrow: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  closeLabel: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="drawer enhanced-drawer"
      aria-labelledby="drawer-title"
      data-component="Drawer"
      data-variant="default"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button className="icon-button dialog-close" aria-label={closeLabel} onClick={onClose}>
        <svg className="icon" aria-hidden="true">
          <use href="#i-close" />
        </svg>
      </button>
      <div id="dialog-content" className="drawer-screen">
        <header className="drawer-screen-header">
          <div className="eyebrow" data-role="eyebrow">
            {eyebrow}
          </div>
          <h2 id="drawer-title" className="detail-title" data-role="title">
            {title}
          </h2>
          <p data-role="description">{description}</p>
        </header>
        <div className="drawer-screen-body">{children}</div>
        <footer className="drawer-screen-footer">{footer}</footer>
      </div>
    </dialog>
  );
}
