import { useEffect, useState } from 'react';
import { issueCode, pollCode } from './channels.api';
import type { CodeSession } from './channels.schema';
import { channelsCopy as copy } from './channels.copy';
import { pollAgain, pollDelay } from './channels.rules';
import { setupError } from './useChannelSetup';

// The connection code of the drawer. It polls while a proof is still awaited (D15); a session
// that expires or gets its proof stops the poll on its own.
export function useCodeSession(connectionId: string, onError: (error: string) => void) {
  const [session, setSession] = useState<CodeSession | null>(null);
  const [issuing, setIssuing] = useState(false);
  const sessionId = session?.id ?? null;
  const polling = pollAgain(session);

  useEffect(() => {
    if (!sessionId || !polling) {
      return;
    }

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let wait = 0;

    async function poll() {
      try {
        const result = await pollCode(sessionId!, controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setSession((current) => (current ? { ...current, ...result.data } : null));

        if (result.data.state === 'expired') {
          onError(copy.expiredCode);

          return;
        }

        wait = pollDelay(wait);
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
  }, [sessionId, polling, onError]);

  async function generate() {
    setIssuing(true);

    try {
      setSession(await issueCode(connectionId, 'identify_group'));
    } catch (error) {
      onError(setupError(error));
    } finally {
      setIssuing(false);
    }
  }

  return { session, issuing, generate };
}
