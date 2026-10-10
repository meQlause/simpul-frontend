import { z as schema } from 'zod';

export const meSchema = schema.object({
  data: schema.object({
    person: schema.object({ name: schema.string(), roleName: schema.string() }),
    workspace: schema.object({
      name: schema.string(),
      descriptor: schema.string(),
      timezone: schema.string(),
      counts: schema.object({
        members: schema.number().int().nonnegative(),
        channels: schema.number().int().nonnegative(),
        activeRules: schema.number().int().nonnegative(),
      }),
    }),
  }),
});
export const overviewSchema = schema.object({
  data: schema.object({
    activeWork: schema.object({ count: schema.number().int().nonnegative() }),
  }),
});
export const attentionSchema = schema.object({
  page: schema.object({ total: schema.number().int().nonnegative() }),
});
