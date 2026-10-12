import { useEffect, useRef, type ReactNode } from 'react';

export function Drawer({
  title,
  eyebrow,
  description,
  onClose,
  children,
  footer,
  closeLabel,
  covered = false,
}: {
  title: string;
  eyebrow: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  closeLabel: string;
  // A confirmation is open over this drawer: it is kept mounted but not drawn.
  covered?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className={covered ? 'drawer enhanced-drawer is-covered' : 'drawer enhanced-drawer'}
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
        {/* The mockup's "demo workspace" note occupied this band; the band stays so every drawer
            keeps the proportions it was drawn with. */}
        <div className="drawer-demo-note" aria-hidden="true">
          &nbsp;
        </div>
        <footer className="drawer-screen-footer">{footer}</footer>
      </div>
    </dialog>
  );
}
