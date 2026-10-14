import { z as schema } from 'zod';

const kind = schema.enum(['routing', 'work', 'queue', 'digest']);

const entry = schema.object({
  id: schema.string(),
  kind,
  title: schema.string(),
  detail: schema.string(),
  occurredAt: schema.string(),
  recipient: schema.object({ id: schema.string(), name: schema.string() }).nullable(),
});

export const listResponse = schema.object({
  data: schema.array(entry),
  page: schema.object({ total: schema.number(), nextCursor: schema.string().nullable() }),
  counts: schema.object({
    routing: schema.number(),
    work: schema.number(),
    queue: schema.number(),
    digest: schema.number(),
  }),
});

const trace = schema.object({
  id: schema.string(),
  kind,
  title: schema.string(),
  occurredAt: schema.string(),
  work: schema
    .object({
      displayId: schema.string(),
      customer: schema.string().nullable(),
      summary: schema.string().nullable(),
      channelName: schema.string().nullable(),
    })
    .nullable(),
  rule: schema
    .object({
      id: schema.string(),
      name: schema.string(),
      conditionText: schema.string(),
      category: schema.string().nullable(),
      recipientLabel: schema.string().nullable(),
      active: schema.boolean(),
    })
    .nullable(),
  recipient: schema
    .object({
      id: schema.string(),
      name: schema.string(),
      roleName: schema.string().nullable(),
      selection: schema.enum(['digest', 'role']),
      backupName: schema.string().nullable(),
    })
    .nullable(),
  neighbours: schema.object({
    previousId: schema.string().nullable(),
    nextId: schema.string().nullable(),
    position: schema.number(),
    total: schema.number(),
  }),
});

export const traceResponse = schema.object({ data: trace });

export type Trace = schema.infer<typeof trace>;

export type Entry = schema.infer<typeof entry>;

const messageStep = schema.discriminatedUnion('key', [
  schema.object({ key: schema.literal('read'), triageClass: schema.string() }),
  schema.object({
    key: schema.literal('matched'),
    verdict: schema.string(),
    decidedBy: schema.string(),
    contextMessages: schema.number(),
    candidates: schema.array(
      schema.object({
        displayId: schema.string(),
        summary: schema.string(),
        score: schema.string(),
      }),
    ),
  }),
  schema.object({
    key: schema.literal('outcome'),
    status: schema.enum(['done', 'held', 'failed', 'pending']),
    reason: schema.string().nullable(),
    expiresAt: schema.string().nullable(),
  }),
  schema.object({ key: schema.literal('notified'), decisionId: schema.string() }),
]);

const messageRow = schema.object({
  unitId: schema.string(),
  occurredAt: schema.string(),
  channel: schema.object({ id: schema.string(), name: schema.string() }),
  senderName: schema.string().nullable(),
  text: schema.string().nullable(),
  outcome: schema.enum(['created', 'attached', 'held', 'rejected', 'ignored', 'pending']),
  reason: schema.string().nullable(),
  work: schema.object({ displayId: schema.string() }).nullable(),
  correction: schema
    .object({
      workDisplayId: schema.string(),
      action: schema.enum(['create', 'attach']),
      correctedBy: schema.object({ name: schema.string().nullable() }),
      correctedAt: schema.string(),
    })
    .nullable(),
  steps: schema.array(messageStep),
});

export const messagesResponse = schema.object({
  data: schema.array(messageRow),
  page: schema.object({ total: schema.number(), nextCursor: schema.string().nullable() }),
  counts: schema.object({
    created: schema.number(),
    attached: schema.number(),
    held: schema.number(),
    rejected: schema.number(),
    ignored: schema.number(),
    pending: schema.number(),
  }),
  textAccess: schema.boolean(),
});

export const correctionResponse = schema.object({ data: messageRow });

export type MessageRow = schema.infer<typeof messageRow>;

export type MessagesPage = schema.infer<typeof messagesResponse>;
