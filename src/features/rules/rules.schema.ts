import { z as schema } from 'zod';

export const eventTypes = {
  new: 'New',
  progress: 'Progress',
  resolution: 'Resolved',
  blocker: 'Blocked',
} as const;

export const historyModes = {
  digest: 'Combine into one digest (recommended)',
  future: 'Apply only to new events',
} as const;

const namedCategory = schema.object({ id: schema.string(), name: schema.string() });

const rule = schema.object({
  id: schema.string(),
  name: schema.string(),
  category: namedCategory,
  eventType: schema.enum(Object.keys(eventTypes) as [keyof typeof eventTypes]),
  conditionText: schema.string(),
  recipient: schema.object({
    roleId: schema.string(),
    team: schema.string(),
    holderName: schema.string().nullable(),
  }),
  historyMode: schema.enum(Object.keys(historyModes) as [keyof typeof historyModes]),
  active: schema.boolean(),
  matches30d: schema.number(),
  corrections30d: schema.number(),
  correctionRate: schema.string(),
  weeklyEstimate: schema.number(),
});

export type Rule = schema.infer<typeof rule>;

export const responseSchema = schema.object({ data: schema.array(rule) });

export const savedRuleSchema = schema.object({ data: rule });

export const ruleFormSchema = schema.object({
  name: schema.string().trim().min(1).max(100),
  categoryId: schema.string().min(1),
  eventType: schema.enum(Object.keys(eventTypes) as [keyof typeof eventTypes]),
  conditionText: schema.string().trim().min(1).max(300),
  recipientRoleId: schema.string().min(1),
  historyMode: schema.enum(Object.keys(historyModes) as [keyof typeof historyModes]),
});

export const estimateSchema = schema.object({
  data: schema.object({
    matches30d: schema.number(),
    peakPerHour: schema.number(),
    budgetPerHour: schema.number(),
    exceedsBudget: schema.boolean(),
    recipient: schema.object({ holderName: schema.string().nullable() }),
  }),
});

export const reviewItemSchema = schema.object({
  data: schema.object({
    detail: schema.string(),
    detected: schema.object({ suggestedCategoryId: schema.string().nullable() }),
  }),
});
