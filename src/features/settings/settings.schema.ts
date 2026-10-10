import { z as schema } from 'zod';

const time = schema.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const settingsInputSchema = schema
  .strictObject({
    quietStart: time,
    quietEnd: time,
    budgetPerHour: schema.number().int().min(1).max(50),
    digestTime: time,
  })
  .refine((input) => input.quietStart !== input.quietEnd, {
    path: ['quietEnd'],
    message: 'Choose different start and end times.',
  });

export const responseSchema = schema.object({ data: schema.object({}) });
