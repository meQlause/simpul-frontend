import { z as schema } from 'zod';

export const errorEnvelope = schema.object({
  error: schema.object({
    code: schema.string(),
    message: schema.string(),
    details: schema.array(schema.unknown()).default([]),
    requestId: schema.string(),
    retryAfter: schema.number().nonnegative().optional(),
  }),
});

export type ErrorInfo = schema.infer<typeof errorEnvelope>['error'];
