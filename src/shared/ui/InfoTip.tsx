import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { placeTip } from './info-tip.rules';

// An explanatory sentence behind an info icon (FR-UI-17). It opens on pointer hover (mouse only),
// click, or keyboard focus, and closes on pointer leave, blur, Escape or a press outside it.
export function InfoTip({ title, text }: { title: string; text: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const tooltip = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const element = tooltip.current;
    const anchor = button.current;

    if (!element || !anchor) {
      return;
    }

    if (!open) {
      if (element.matches(':popover-open')) {
        element.hidePopover();
      }

      return;
    }

    if (!element.matches(':popover-open')) {
      element.showPopover();
    }

    const dialog = anchor.closest('dialog')?.getBoundingClientRect();
    const viewport = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    const { left, top } = placeTip(
      anchor.getBoundingClientRect(),
      element.getBoundingClientRect(),
      dialog ?? viewport,
    );

    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // The tip closes alone: the drawer around it stays open on this key (D10).
        event.preventDefault();
        setOpen(false);
      }
    };

    const onPress = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPress);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPress);
    };
  }, [open]);

  if (!text) {
    return null;
  }

  return (
    <span
      ref={root}
      className="info-tip"
      data-component="InfoTip"
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') {
          setOpen(true);
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') {
          setOpen(false);
        }
      }}
    >
      <button
        ref={button}
        type="button"
        className="info-tip-button"
        aria-label={`About ${title}`}
        aria-describedby={id}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Icon name="help" />
      </button>
      <span ref={tooltip} id={id} role="tooltip" popover="manual" className="info-tip-text">
        {text}
      </span>
    </span>
  );
}
