import { z as schema } from 'zod';

export const sessionSchema = schema.object({ data: schema.object({}) });

export const signedInSchema = schema.object({
  data: schema.object({
    person: schema.object({ name: schema.string(), roleName: schema.string() }),
  }),
});
