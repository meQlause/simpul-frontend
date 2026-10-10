import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { shellCopy } from './shell.copy';

export function GlobalSearch() {
  const field = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (event.ctrlKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        field.current?.focus();
      }
    }
    window.addEventListener('keydown', shortcut);
    return () => {
      window.removeEventListener('keydown', shortcut);
    };
  }, []);
  return (
    <label className="global-search" data-component="GlobalSearch">
      <svg className="icon" aria-hidden="true">
        <use href="#i-search" />
      </svg>
      <input
        ref={field}
        type="search"
        id="global-search"
        placeholder={shellCopy.searchPlaceholder}
        aria-label={shellCopy.search}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            void navigate(`/work?q=${encodeURIComponent(event.currentTarget.value)}`);
          }
        }}
      />
      <kbd>{shellCopy.shortcut}</kbd>
    </label>
  );
}
