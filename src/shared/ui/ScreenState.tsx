import { Link } from 'react-router';
import { useUnavailable } from '../useUnavailable';
import { screenStateCopy } from './screen-state.copy';

type State = 'ready' | 'loading' | 'empty' | 'error' | 'offline' | 'not-found';

export function ScreenState({ state, onRetry }: { state: State; onRetry?: () => void }) {
  const unavailable = useUnavailable();

  if (state === 'ready') {
    return null;
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
      {state === 'error' && (
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
