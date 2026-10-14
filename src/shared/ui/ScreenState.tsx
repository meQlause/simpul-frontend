import { useContext } from 'react';
import { Link } from 'react-router';
import { useUnavailable } from '../useUnavailable';
import { InDrawer } from './Drawer';
import { Skeleton } from './Skeleton';
import { screenStateCopy } from './screen-state.copy';

type State = 'ready' | 'loading' | 'empty' | 'error' | 'offline' | 'not-found';

// The loading state: a skeleton in the shape of its page, or of its drawer inside a drawer.
function Loading({ skeleton = 'table', grid }: { skeleton?: 'table' | 'cards'; grid?: string }) {
  const inDrawer = useContext(InDrawer);

  return (
    <section
      className="screen-loading"
      role="status"
      aria-label={screenStateCopy.loading.description}
      data-component="ScreenState"
      data-variant="loading"
      data-size="page"
    >
      <Skeleton variant={inDrawer ? 'drawer' : skeleton} grid={grid} />
    </section>
  );
}

export function ScreenState({
  state,
  onRetry,
  skeleton,
  grid,
}: {
  state: State;
  onRetry?: () => void;
  skeleton?: 'table' | 'cards';
  grid?: string;
}) {
  const unavailable = useUnavailable();

  if (state === 'ready') {
    return null;
  }

  if (state === 'loading') {
    return <Loading skeleton={skeleton} grid={grid} />;
  }

  const copy = screenStateCopy[state];

  return (
    <section
      className="screen-state"
      role="status"
      data-component="ScreenState"
      data-variant={state}
      data-size="page"
    >
      <svg className="icon" aria-hidden="true">
        <use href={`#i-${copy.icon}`} />
      </svg>
      <h2>{copy.title}</h2>
      <p data-role="body">
        {state === 'error' && unavailable ? screenStateCopy.databaseUnavailable : copy.description}
      </p>
      {state !== 'not-found' && onRetry && (
        <button className="button" type="button" onClick={onRetry}>
          {screenStateCopy.retry}
        </button>
      )}
      {state === 'not-found' && (
        <Link className="button" to="/">
          {screenStateCopy.home}
        </Link>
      )}
    </section>
  );
}

// The offline card over a page that stays on screen (its controls are disabled by the page).
export function OfflineCard({
  state,
  shown,
  onRetry,
}: {
  state: string;
  shown: boolean;
  onRetry: () => void;
}) {
  return shown && state === 'offline' ? <ScreenState state="offline" onRetry={onRetry} /> : null;
}
