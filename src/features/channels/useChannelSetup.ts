import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../shared/api/query-keys';
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { ApiError } from '../../shared/api/error';
import { channelRequest, readChannel, verifyChannel } from './channels.api';
import {
  channelSchema,
  type Channel,
  type CodeSession,
  type Connection,
  type Verification,
} from './channels.schema';
import { channelsCopy as copy } from './channels.copy';
import { canRetry, dueCall, draftBody, setupFacts, setupSteps } from './channels.rules';
import { useCodeSession } from './useCodeSession';

export type GroupInput = {
  class: 'external' | 'internal';
  primaryLanguage: 'auto' | 'en' | 'id';
};

type Done = { savedFor: string; provedFor: string; opened: boolean };
type Candidate = NonNullable<CodeSession['candidate']>;
type SetupState = {
  channel: Channel | undefined;
  input: GroupInput;
  verification: Verification | null;
  error: string;
  failed: boolean;
  pending: boolean;
  consent: boolean;
  done: Done;
};

// The sentence a person reads: the code is for support and logs, never shown.
export function sentenceOf(error: string) {
  return error.replace(/^E-[A-Z0-9-]+ · /, '');
}

export function setupError(error: unknown) {
  if (!(error instanceof ApiError)) {
    return copy.saveFailed;
  }

  const wait = error.retryAfter === undefined ? '' : ' · ' + error.retryAfter + 's';

  return error.code + ' · ' + error.message + wait;
}

// A failure is retried by a button unless its code says the remedy is a new code (D6).
function retryable(error: string) {
  return canRetry(error.split(' · ')[0] ?? '');
}

async function saveDraft(
  client: QueryClient,
  candidate: Candidate,
  input: GroupInput,
  connectionId: string,
) {
  const saved = await channelRequest(
    '/channels',
    channelSchema,
    'POST',
    draftBody(candidate, input, connectionId),
  );

  void client.invalidateQueries({ queryKey: queryKeys.page('channels') });
  void client.invalidateQueries({ queryKey: ['telegram', 'connections'] });

  return saved;
}

// A due call is marked as done in the same render that starts it, so it never starts twice.
function markDone(done: Done, due: 'save' | 'verify', sessionId: string, received: boolean) {
  if (due === 'save') {
    return { ...done, opened: true, savedFor: sessionId };
  }

  return { ...done, opened: true, provedFor: received ? sessionId : done.provedFor };
}

function initialInput(channel: Channel | undefined): GroupInput {
  if (!channel) {
    return { class: 'external', primaryLanguage: 'auto' };
  }

  return { class: channel.class, primaryLanguage: channel.primaryLanguage };
}

function initialState(initial: Channel | undefined): SetupState {
  return {
    channel: initial,
    input: initialInput(initial),
    verification: initial?.verification ?? null,
    error: '',
    failed: false,
    pending: false,
    consent: false,
    done: { savedFor: '', provedFor: '', opened: false },
  };
}

function patchGroup(channel: Channel, input: GroupInput) {
  return channelRequest('/channels/' + channel.id, channelSchema, 'PATCH', {
    class: input.class,
    primaryLanguage: input.primaryLanguage,
    expectedConfigVersion: channel.configVersion,
  });
}

function activateGroup(channel: Channel, verification: Verification, key: string) {
  return channelRequest(
    '/channels/' + channel.id + '/activate',
    channelSchema,
    { method: 'POST', key },
    {
      verificationId: verification.id,
      authorizationAck: true,
      expectedConfigVersion: channel.configVersion,
    },
  );
}

export function useChannelSetup(
  initial: Channel | undefined,
  connection: Connection,
  onSaved: () => void,
) {
  const client = useQueryClient();
  const [state, update] = useState<SetupState>(() => initialState(initial));
  const setError = useCallback((error: string) => update((current) => ({ ...current, error })), []);
  const code = useCodeSession(connection.id, setError);
  const facts = setupFacts(state.channel, code.session, state.verification);
  const due = dueCall(facts, state.done);
  const sessionId = code.session?.id ?? '';
  const candidate = code.session?.candidate ?? null;

  // Every save and check goes through here: one busy flag, one error sentence, one reread.
  const attempt = useCallback(async (work: () => Promise<Channel>) => {
    update((current) => ({ ...current, pending: true, error: '', failed: false }));

    try {
      const saved = await work();

      // The saved group is kept even if the check fails, so Try again checks it and does not save it again.
      update((current) => ({ ...current, channel: saved }));

      const verification = await verifyChannel(saved.id);
      const channel = await readChannel(saved.id);

      update((current) => ({ ...current, channel, verification }));
    } catch (failure) {
      update((current) => ({
        ...current,
        error: setupError(failure),
        failed: retryable(setupError(failure)),
        verification: null,
        consent: false,
      }));
    } finally {
      update((current) => ({ ...current, pending: false }));
    }
  }, []);

  // setDone makes the next render's dueCall null, so each due call starts once.
  const start = useCallback(
    (kind: 'save' | 'verify') => {
      update((current) => ({
        ...current,
        done: markDone(current.done, kind, sessionId, facts.received),
      }));

      if (kind === 'save' && candidate) {
        void attempt(() => saveDraft(client, candidate, state.input, connection.id));
      } else if (state.channel) {
        const saved = state.channel;

        void attempt(() => Promise.resolve(saved));
      }
    },
    [
      attempt,
      client,
      candidate,
      connection.id,
      facts.received,
      sessionId,
      state.channel,
      state.input,
    ],
  );

  useEffect(() => {
    if (due) {
      start(due);
    }
  }, [due, start]);

  const actions = setupActions({
    state,
    update,
    attempt,
    client,
    connectionId: connection.id,
    candidate,
    onSaved,
  });

  return {
    input: state.input,
    setInput: (input: GroupInput) => update((current) => ({ ...current, input })),
    channel: state.channel,
    verification: state.verification,
    steps: setupSteps(facts),
    code,
    error: state.error,
    setError,
    failed: state.failed,
    pending: state.pending,
    consent: state.consent,
    setConsent: (consent: boolean) => update((current) => ({ ...current, consent })),
    ...actions,
  };
}

type Attempt = (work: () => Promise<Channel>) => Promise<void>;

// What a person does from the drawer after the checks: retry, save the audience, activate.
function setupActions({
  state,
  update,
  attempt,
  client,
  connectionId,
  candidate,
  onSaved,
}: {
  state: SetupState;
  update: Dispatch<SetStateAction<SetupState>>;
  attempt: Attempt;
  client: QueryClient;
  connectionId: string;
  candidate: Candidate | null;
  onSaved: () => void;
}) {
  function retry() {
    if (state.channel) {
      const saved = state.channel;

      void attempt(() => Promise.resolve(saved));
    } else if (candidate) {
      void attempt(() => saveDraft(client, candidate, state.input, connectionId));
    }
  }

  async function saveChanges() {
    const saved = state.channel;

    if (saved) {
      await attempt(() => patchGroup(saved, state.input));
      onSaved();
    }
  }

  async function activate(key: string) {
    const { channel, verification } = state;

    if (!channel || !verification || state.pending) {
      return;
    }

    update((current) => ({ ...current, pending: true, error: '', failed: false }));

    try {
      await activateGroup(channel, verification, key);
      onSaved();
    } catch (failure) {
      update((current) => ({ ...current, error: setupError(failure) }));
    } finally {
      update((current) => ({ ...current, pending: false }));
    }
  }

  function recheck() {
    if (state.channel) {
      const saved = state.channel;

      void attempt(() => Promise.resolve(saved));
    }
  }

  return { retry, saveChanges, activate, recheck };
}
