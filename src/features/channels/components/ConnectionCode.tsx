import { useEffect, useState } from 'react';
import { issueCode, pollCode } from '../channels.api';
import type { CodeSession } from '../channels.schema';
import { channelsCopy as copy } from '../channels.copy';
import { setupError } from '../useChannelSetup';

const INITIAL_POLL_MS = 750;
const MAX_POLL_MS = 10000;

export function ConnectionCode({
  connectionId,
  purpose,
  onCandidate,
  onError,
}: {
  connectionId: string;
  purpose: 'identify_group' | 'receive_check';
  onCandidate: (candidate: NonNullable<CodeSession['candidate']>) => void;
  onError: (error: string) => void;
}) {
  const [session, setSession] = useState<CodeSession | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!session || session.state !== 'pending') {
      return;
    }

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let wait = INITIAL_POLL_MS;

    async function poll() {
      try {
        const result = await pollCode(session!.id, controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        if (result.data.state !== 'pending') {
          setSession((current) => (current ? { ...current, ...result.data } : null));
          finishSession(result.data, { purpose, onError, onCandidate });

          return;
        }

        wait = Math.min(wait * 2, MAX_POLL_MS);
        timer = setTimeout(() => {
          void poll();
        }, wait);
      } catch (error) {
        if (!controller.signal.aborted) {
          onError(setupError(error));
        }
      }
    }

    void poll();

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [session, onCandidate, onError, purpose]);

  async function generate() {
    setPending(true);

    try {
      setSession(await issueCode(connectionId, purpose));
    } catch (error) {
      onError(setupError(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="setup-alternative" data-component="ConnectionCode" data-variant={purpose}>
      <p>The command identifies a candidate group. It never starts monitoring.</p>
      <button
        type="button"
        className="button"
        data-component="Button"
        data-variant="default"
        data-size="drawer"
        disabled={pending || session?.state === 'pending'}
        onClick={() => {
          void generate();
        }}
      >
        Get connection code
      </button>
      {session && (
        <label className="field" data-component="Field" data-variant="default" data-size="drawer">
          Command · expires in 15 minutes
          <input
            readOnly
            aria-label={
              purpose === 'identify_group' ? 'Connection command' : 'Inbound proof command'
            }
            value={session.command ?? ''}
          />
        </label>
      )}
    </div>
  );
}

function finishSession(
  session: CodeSession,
  handlers: {
    purpose: string;
    onError: (error: string) => void;
    onCandidate: (candidate: NonNullable<CodeSession['candidate']>) => void;
  },
) {
  if (session.state === 'expired') {
    handlers.onError(copy.expiredCode);

    return;
  }

  if (session.candidate && handlers.purpose === 'identify_group') {
    handlers.onCandidate(session.candidate);
  }
}
