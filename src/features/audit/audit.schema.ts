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
