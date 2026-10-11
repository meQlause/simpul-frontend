import { useQuery } from '@tanstack/react-query';
import { z as schema, type ZodType } from 'zod';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import {
  responseSchema,
  connectionsSchema,
  channelSchema,
  verificationSchema,
  sessionSchema,
} from './channels.schema';

export function useChannels() {
  return useQuery({
    queryKey: queryKeys.page('channels'),
    queryFn: () => getResponse('/channels', responseSchema),
  });
}

export function useConnections() {
  return useQuery({
    queryKey: ['telegram', 'connections'],
    queryFn: () => getResponse('/telegram/connections', connectionsSchema),
  });
}

export async function channelRequest<Result>(
  path: string,
  contract: ZodType<Result>,
  request: string | { method: string; key: string } = 'GET',
  input?: unknown,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (typeof request !== 'string') {
    headers['Idempotency-Key'] = request.key;
  }

  const response = await getResponse(path, schema.object({ data: contract }), {
    method: typeof request === 'string' ? request : request.method,
    headers,
    body: input === undefined ? undefined : JSON.stringify(input),
  });

  return response.data;
}

export function readChannel(id: string) {
  return channelRequest('/channels/' + id, channelSchema);
}

export function verifyChannel(id: string) {
  return channelRequest('/channels/' + id + '/verify', verificationSchema, 'POST', {});
}

export function issueCode(connectionId: string, purpose: string) {
  return channelRequest(
    '/telegram/connections/' + connectionId + '/sessions',
    sessionSchema,
    'POST',
    { purpose },
  );
}

export function pollCode(id: string, signal: AbortSignal) {
  return getResponse(
    '/telegram/connection-sessions/' + id,
    schema.object({ data: sessionSchema }),
    { signal },
  );
}
