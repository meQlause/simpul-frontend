import { z as schema } from 'zod';

export const responseSchema = schema.object({
  data: schema.object({
    messagesUnderstood: schema.object({
      count: schema.number(),
      trendPercent: schema.string().nullable(),
    }),
    activeWork: schema.object({ count: schema.number(), completedToday: schema.number() }),
    updatesDelivered: schema.object({
      count: schema.number(),
      recipients: schema.number(),
      topRecipients: schema.array(schema.object({ name: schema.string() })),
    }),
    needsReview: schema.object({
      count: schema.number(),
      areas: schema.number(),
      byKind: schema.object({
        unrouted: schema.number(),
        alias: schema.number(),
        category: schema.number(),
      }),
    }),
  }),
});

export const identitySchema = schema.object({
  data: schema.object({
    person: schema.object({ name: schema.string() }),
    workspace: schema.object({
      name: schema.string(),
      timezone: schema.string(),
      onboardingCompletedAt: schema.string().nullable().optional(),
    }),
  }),
});

export const decisionsSchema = schema.object({
  data: schema.array(
    schema.object({ title: schema.string(), occurredAt: schema.string(), kind: schema.string() }),
  ),
});

export type Overview = schema.infer<typeof responseSchema>['data'];
