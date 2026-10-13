import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../shared/api/query-keys';
import { useState } from 'react';
import { ApiError } from '../../shared/api/error';
import { channelRequest, readChannel, verifyChannel } from './channels.api';
import { channelSchema, type Channel, type Connection } from './channels.schema';
import { channelsCopy as copy } from './channels.copy';

export type GroupInput = {
  displayName: string;
  providerChatId: string;
  class: 'external' | 'internal';
  primaryLanguage: 'auto' | 'en' | 'id';
};

function validate(input: GroupInput) {
  if (!input.displayName.trim()) {
    return 'E-TG-INPUT-INVALID · Give this group a display name.';
  }

  if (/^\d+$/.test(input.providerChatId)) {
    return copy.privateChat;
  }

  if (!/^-\d+$/.test(input.providerChatId)) {
    return 'E-TG-INPUT-INVALID · Enter a negative numeric Chat ID for a group or supergroup.';
  }

  return '';
}

// What a field shows itself (error-handling §5, field level); everything else is a toast.
export function invalidFields(input: GroupInput, error: string) {
  const invalid =
    error.includes('E-TG-INPUT-INVALID') || error.includes('E-TG-CHAT-TYPE-UNSUPPORTED');
  const name = invalid && !input.displayName.trim();
  const chat = invalid && !/^-\d+$/.test(input.providerChatId);

  return { name, chat, sentence: sentenceOf(error) };
}

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

export function useChannelSetup(
  initial: Channel | undefined,
  connection: Connection,
  onSaved: () => void,
) {
  const client = useQueryClient();
  const [channel, setChannel] = useState(initial);
  const [input, setInput] = useState<GroupInput>(() => initialInput(initial));
  const [verification, setVerification] = useState(initial?.verification ?? null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [consent, setConsent] = useState(false);

  async function save() {
    const message = validate(input);

    if (message) {
      throw new Error(message);
    }

    const saved = await saveInput(input, channel, connection.id);

    setChannel(saved);
    void client.invalidateQueries({ queryKey: queryKeys.page('channels') });
    void client.invalidateQueries({ queryKey: ['telegram', 'connections'] });
    setVerification(saved.verification ?? null);
    setConsent(false);

    return saved;
  }

  async function report(failure: unknown) {
    setError(
      failure instanceof Error && failure.message.startsWith('E-TG-')
        ? failure.message
        : setupError(failure),
    );
    setVerification(null);
    setConsent(false);

    if (failure instanceof ApiError && failure.code === 'E-TG-VERSION-CONFLICT' && channel) {
      setChannel(await readChannel(channel.id));
    }
  }

  async function run(action: 'save' | 'verify') {
    if (pending) {
      return;
    }

    setPending(true);
    setError('');

    try {
      const saved = await save();

      if (action === 'save') {
        onSaved();
      } else {
        setVerification(await verifyChannel(saved.id));
        setChannel(await readChannel(saved.id));
      }
    } catch (failure) {
      await report(failure);
    } finally {
      setPending(false);
    }
  }

  async function activate(key: string) {
    if (!channel || !verification || pending) {
      return;
    }

    setPending(true);
    setError('');

    try {
      await channelRequest(
        '/channels/' + channel.id + '/activate',
        channelSchema,
        { method: 'POST', key },
        {
          verificationId: verification.id,
          authorizationAck: true,
          expectedConfigVersion: channel.configVersion,
        },
      );
      onSaved();
    } catch (failure) {
      await report(failure);
    } finally {
      setPending(false);
    }
  }

  return {
    input,
    setInput,
    channel,
    verification,
    error,
    setError,
    pending,
    consent,
    setConsent,
    run,
    activate,
  };
}

function initialInput(channel: Channel | undefined): GroupInput {
  if (!channel) {
    return { displayName: '', providerChatId: '', class: 'external', primaryLanguage: 'auto' };
  }

  return {
    displayName: channel.displayName,
    providerChatId: channel.providerChatId,
    class: channel.class,
    primaryLanguage: channel.primaryLanguage,
  };
}

function saveInput(input: GroupInput, channel: Channel | undefined, connectionId: string) {
  const body = channel
    ? {
        displayName: input.displayName.trim(),
        class: input.class,
        primaryLanguage: input.primaryLanguage,
        expectedConfigVersion: channel.configVersion,
      }
    : { ...input, displayName: input.displayName.trim(), botConnectionId: connectionId };

  return channelRequest(
    channel ? '/channels/' + channel.id : '/channels',
    channelSchema,
    channel ? 'PATCH' : 'POST',
    body,
  );
}
