import { z as schema } from 'zod';

const notification = schema.object({
  recipientLabel: schema.string(),
  work: schema.object({ displayId: schema.string(), customer: schema.string().nullable() }),
  body: schema.string(),
  reminderCount: schema.number(),
  holdSeconds: schema.number(),
  opId: schema.string(),
  actions: schema.array(schema.string()),
});

const clarification = schema.object({
  candidates: schema.array(schema.object({ displayId: schema.string(), label: schema.string() })),
  expiresAfterMinutes: schema.number(),
  perWorkPerDay: schema.number(),
  perChannelPerDay: schema.number(),
});

const digest = schema.object({
  recipientName: schema.string().nullable(),
  time: schema.string(),
  items: schema.array(schema.string()),
});

const voiceNote = schema.object({
  transcriptSample: schema.string(),
  failureMessage: schema.string(),
});

export const responseSchema = schema.object({
  data: schema.object({
    notification: notification.nullable(),
    clarification: clarification.nullable(),
    digest,
    voiceNote,
  }),
});

export type Preview = schema.infer<typeof responseSchema>['data'];
