import { z as schema } from 'zod';

export const sessionSchema = schema.object({ data: schema.object({}) });
