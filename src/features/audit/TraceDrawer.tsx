import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../../shared/api/error';
import { Drawer } from '../../shared/ui/Drawer';
import { ScreenState } from '../../shared/ui/ScreenState';
import { auditCopy as copy } from './audit.copy';
import { usePauseRule, useTrace } from './audit.api';
import type { Trace } from './audit.schema';
import { Icon } from '../../shared/ui/Icon';
import { TraceBody, TraceHeader } from './TraceBody';

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
  const dialog = useRef<HTMLDialogElement>(null);
  const [toast, setToast] = useState('');
  const pause = usePauseRule();

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

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
    <dialog
      ref={dialog}
      className="drawer trace-drawer"
      aria-labelledby="drawer-title"
      data-component="Drawer"
      data-variant="trace"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button className="icon-button dialog-close" aria-label={copy.trace.close} onClick={onClose}>
        <Icon name="close" />
      </button>
      <div id="dialog-content">
        <div className="audit-trace">
          <TraceHeader trace={trace} />
          <TraceBody trace={trace} pending={pause.isPending} onPause={togglePause} />
          <footer className="trace-drawer-footer">
            <button className="button" onClick={onClose}>
              {copy.trace.close}
            </button>
            <Neighbours trace={trace} />
            <TraceAction trace={trace} />
          </footer>
        </div>
      </div>
      {toast && (
        <p role="status" className="toast visible">
          {toast}
        </p>
      )}
    </dialog>
  );
}

function TraceAction({ trace }: { trace: Trace }) {
  if (trace.rule) {
    return (
      <Link className="button button-primary" to={`/rules/${trace.rule.id}`}>
        Edit rule
        <Icon name="arrow-up-right" />
      </Link>
    );
  }

  return trace.kind === 'queue' ? (
    <Link className="button button-primary" to="/queue">
      {copy.trace.review}
    </Link>
  ) : null;
}

function Neighbours({ trace }: { trace: Trace }) {
  const { previousId, nextId, position, total } = trace.neighbours;

  return (
    <span className="trace-record-navigation">
      {previousId ? (
        <Link className="icon-button" to={`/audit/${previousId}`} aria-label={copy.trace.previous}>
          <Icon name="chevron-left" />
        </Link>
      ) : (
        <button className="icon-button" disabled aria-label={copy.trace.previous}>
          <Icon name="chevron-left" />
        </button>
      )}
      <span>{`${position} / ${total}`}</span>
      {nextId ? (
        <Link className="icon-button" to={`/audit/${nextId}`} aria-label={copy.trace.next}>
          <Icon name="chevron-right" />
        </Link>
      ) : (
        <button className="icon-button" disabled aria-label={copy.trace.next}>
          <Icon name="chevron-right" />
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
