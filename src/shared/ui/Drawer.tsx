import { createContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { InfoTip } from './InfoTip';

// True inside a drawer's body: a loading state there takes the drawer's skeleton (ScreenState).
export const InDrawer = createContext(false);

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

  // What had focus when the drawer was first drawn: the control that opened it.
  const [opener] = useState(() => document.activeElement);

  useEffect(() => {
    dialog.current?.showModal();

    // The drawer is unmounted when its route closes: hand focus back to what opened it.
    return () => {
      setTimeout(() => {
        if (opener instanceof HTMLElement && opener.isConnected) {
          opener.focus({ preventScroll: true });
        }
      }, 0);
    };
  }, [opener]);

  // A click on the backdrop lands on the dialog itself, left of its box: it closes like Escape.
  // Both press and release must be outside, so a selection dragged out of the drawer keeps it.
  useEffect(() => {
    const element = dialog.current;

    if (!element) {
      return;
    }

    const outside = (event: MouseEvent) =>
      event.target === element && event.clientX < element.getBoundingClientRect().left;
    let pressedOutside = false;
    const press = (event: PointerEvent) => {
      pressedOutside = outside(event);
    };

    const release = (event: MouseEvent) => {
      if (pressedOutside && outside(event)) {
        onClose();
      }
    };

    element.addEventListener('pointerdown', press);
    element.addEventListener('click', release);

    return () => {
      element.removeEventListener('pointerdown', press);
      element.removeEventListener('click', release);
    };
  }, [onClose]);

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
      <div id="dialog-content">
        <div className="drawer-screen">
          <header className="drawer-screen-header">
            <div className="eyebrow" data-role="eyebrow">
              {eyebrow}
            </div>
            <h2 id="drawer-title" className="detail-title" data-role="title">
              {title}
            </h2>
            <InfoTip title={title} text={description} />
          </header>
          <div className="drawer-screen-body">
            <InDrawer.Provider value={true}>{children}</InDrawer.Provider>
          </div>
          {/* The mockup's "demo workspace" note occupied this band; the band stays so every drawer
            keeps the proportions it was drawn with. */}
          <div className="drawer-demo-note" aria-hidden="true">
            &nbsp;
          </div>
          <footer className="drawer-screen-footer">{footer}</footer>
        </div>
      </div>
    </dialog>
  );
}
