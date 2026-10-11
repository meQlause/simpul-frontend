import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../../shared/api/error';
import { Drawer } from '../../shared/ui/Drawer';
import { ScreenState } from '../../shared/ui/ScreenState';
import { auditCopy as copy, kindCopy, type Kind } from './audit.copy';
import { usePauseRule, useTrace } from './audit.api';
import type { Trace } from './audit.schema';
import { TraceBody } from './TraceBody';

export function TraceDrawer({ id }: { id: string }) {
  const navigate = useNavigate();
  const query = useTrace(id);
  const close = () => {
    void navigate('/audit');
  };

  if (!query.data) {
    return (
      <TraceFallback
        error={query.error}
        isError={query.isError}
        onClose={close}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return <TraceView trace={query.data.data} onClose={close} />;
}

function TraceFallback({
  error,
  isError,
  onClose,
  onRetry,
}: {
  error: unknown;
  isError: boolean;
  onClose: () => void;
  onRetry: () => void;
}) {
  const notFound = error instanceof ApiError && error.code === 'E-NOT-FOUND';
  const state = stateOf(notFound, isError);

  return (
    <Drawer
      title={copy.trace.eyebrow}
      eyebrow={copy.trace.eyebrow}
      description=""
      closeLabel={copy.trace.close}
      onClose={onClose}
      footer={
        <button className="button" onClick={onClose}>
          {copy.trace.close}
        </button>
      }
    >
      <ScreenState state={state} onRetry={onRetry} />
    </Drawer>
  );
}

function TraceView({ trace, onClose }: { trace: Trace; onClose: () => void }) {
  const meta = kindCopy[trace.kind as Kind];
  const [toast, setToast] = useState('');
  const pause = usePauseRule();

  function togglePause() {
    if (!trace.rule) {
      return;
    }

    pause.mutate(
      { ruleId: trace.rule.id, active: !trace.rule.active },
      {
        onSuccess: () => setToast(copy.trace.saved),
        onError: () => setToast(copy.trace.saveFailed),
      },
    );
  }

  return (
    <Drawer
      title={trace.title}
      eyebrow={copy.trace.eyebrow}
      description={meta.subline}
      closeLabel={copy.trace.close}
      onClose={onClose}
      footer={
        <>
          <Neighbours trace={trace} />
          {trace.kind === 'queue' && (
            <Link className="button" to="/queue">
              {copy.trace.review}
            </Link>
          )}
          <button className="button" onClick={onClose}>
            {copy.trace.close}
          </button>
        </>
      }
    >
      <TraceBody trace={trace} pending={pause.isPending} onPause={togglePause} />
      {toast && (
        <p role="status" className="toast visible">
          {toast}
        </p>
      )}
    </Drawer>
  );
}

function Neighbours({ trace }: { trace: Trace }) {
  const { previousId, nextId, position, total } = trace.neighbours;

  return (
    <span className="trace-neighbours">
      {previousId ? (
        <Link className="icon-button" to={`/audit/${previousId}`} aria-label={copy.trace.previous}>
          {'<'}
        </Link>
      ) : (
        <button className="icon-button" disabled aria-label={copy.trace.previous}>
          {'<'}
        </button>
      )}
      <span>{`${position} / ${total}`}</span>
      {nextId ? (
        <Link className="icon-button" to={`/audit/${nextId}`} aria-label={copy.trace.next}>
          {'>'}
        </Link>
      ) : (
        <button className="icon-button" disabled aria-label={copy.trace.next}>
          {'>'}
        </button>
      )}
    </span>
  );
}

function stateOf(notFound: boolean, isError: boolean): 'not-found' | 'error' | 'loading' {
  if (notFound) {
    return 'not-found';
  }

  return isError ? 'error' : 'loading';
}
