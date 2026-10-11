import { z as schema } from 'zod';

const workItem = schema.object({
  displayId: schema.string(),
  customer: schema.string().nullable(),
  summary: schema.string(),
  status: schema.enum(['active', 'stalled', 'completed', 'tentative', 'cancelled', 'archived']),
  category: schema.string().nullable(),
  owner: schema
    .object({ id: schema.string(), name: schema.string(), team: schema.string().nullable() })
    .nullable(),
  channel: schema.object({ id: schema.string(), displayName: schema.string() }),
  lastActivityAt: schema.string(),
});

export const responseSchema = schema.object({
  data: schema.array(workItem),
  page: schema.object({ nextCursor: schema.string().nullable(), total: schema.number() }),
});

export const detailSchema = schema.object({
  data: workItem.omit({ lastActivityAt: true, owner: true }).extend({
    owner: schema
      .object({
        id: schema.string(),
        name: schema.string(),
        team: schema.string().nullable(),
        backupName: schema.string().nullable(),
      })
      .nullable(),
    latestUpdate: schema.object({ text: schema.string(), at: schema.string() }).nullable(),
    rhythm: schema
      .object({ typicalHours: schema.number(), reminderCount: schema.number() })
      .nullable(),
    nextStep: schema.string().nullable(),
    timeline: schema.object({
      identifiedAt: schema.string(),
      ruleApplied: schema.string().nullable(),
    }),
    closure: schema
      .object({
        kind: schema.string(),
        reason: schema.string().nullable(),
        closedAt: schema.string(),
        closedByName: schema.string().nullable(),
      })
      .nullable(),
    canClose: schema.boolean(),
    canUndoClose: schema.boolean(),
  }),
});

export const closureSchema = schema.object({
  closure: schema.enum(['completed', 'cancelled', 'outside_chat']),
  reason: schema.string().trim().min(5).max(300),
});

export type WorkItem = schema.infer<typeof workItem>;

export type WorkDetail = schema.infer<typeof detailSchema>['data'];
