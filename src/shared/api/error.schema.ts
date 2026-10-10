import { z as schema } from 'zod';

export const errorEnvelope = schema.object({
  error: schema.object({
    code: schema.string(),
    message: schema.string(),
    details: schema.array(schema.unknown()),
    requestId: schema.string(),
  }),
});

export type ErrorInfo = schema.infer<typeof errorEnvelope>['error'];
