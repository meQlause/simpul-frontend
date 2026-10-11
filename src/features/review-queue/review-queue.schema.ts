import { z as schema } from 'zod';

const item = schema.object({
  id: schema.string(),
  kind: schema.enum(['unrouted', 'alias', 'category']),
  title: schema.string(),
  detail: schema.string(),
  channel: schema.object({ id: schema.string(), displayName: schema.string() }),
  detectedAt: schema.string(),
  detected: schema.object({
    text: schema.string().nullable(),
    suggestedPersonId: schema.string().nullable(),
    suggestedCategoryId: schema.string().nullable(),
  }),
});

const counts = schema.object({
  unrouted: schema.number(),
  alias: schema.number(),
  category: schema.number(),
});

export const responseSchema = schema.object({
  data: schema.array(item),
  counts,
  page: schema.object({ total: schema.number(), nextCursor: schema.string().nullable() }),
});

export const detailSchema = schema.object({ data: item });

export const resolvedSchema = schema.object({ data: schema.object({ remaining: counts }) });

export type ReviewItem = schema.infer<typeof item>;
