import { z as schema } from 'zod';

export const responseSchema = schema.object({ data: schema.array(schema.object({})) });
