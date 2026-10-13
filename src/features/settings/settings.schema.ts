import { z as schema } from 'zod';

const time = schema.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const settingsInputSchema = schema
  .strictObject({
    quietStart: time,
    quietEnd: time,
    budgetPerHour: schema.number().int().min(1).max(50),
    digestTime: time,
    contextWindowMinutes: schema.number().int().min(0).max(180),
    contextMaxMessages: schema.number().int().min(1).max(30),
  })
  .refine((input) => input.quietStart !== input.quietEnd, {
    path: ['quietEnd'],
    message: 'Choose different start and end times.',
  });

const settingsSchema = schema.object({
  quietStart: time,
  quietEnd: time,
  budgetPerHour: schema.number().int().min(1).max(50),
  digestTime: time,
  holdSeconds: schema.number().int().nonnegative(),
  timezone: schema.string(),
  contextWindowMinutes: schema.number().int(),
  contextMaxMessages: schema.number().int(),
});

export type Settings = schema.infer<typeof settingsSchema>;

export const responseSchema = schema.object({ data: settingsSchema });

export const workspaceSchema = schema.object({
  data: schema.object({
    workspace: schema.object({ name: schema.string(), timezone: schema.string() }),
  }),
});

export const mailSchema = schema.object({
  data: schema
    .object({
      host: schema.string(),
      port: schema.number(),
      username: schema.string(),
      fromAddress: schema.string(),
      passwordPresent: schema.boolean(),
    })
    .nullable(),
  pendingDigestItems: schema.number().optional(),
});
