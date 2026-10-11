import { z as schema } from 'zod';

const category = schema.object({
  id: schema.string(),
  name: schema.string(),
  description: schema.string().nullable(),
  example: schema.string().nullable(),
  idPrefix: schema.string().nullable(),
  prefixInUse: schema.boolean(),
});

const template = schema.object({ body: schema.string() });

export const vocabularyResponse = schema.object({
  data: schema.object({
    version: schema.number(),
    categories: schema.array(category),
    aliases: schema.array(
      schema.object({
        id: schema.string(),
        alias: schema.string(),
        person: schema.object({ id: schema.string(), name: schema.string() }),
      }),
    ),
    templates: schema.object({
      internal: template.extend({ allowedFields: schema.array(schema.string()) }),
      external: template,
      sample: schema.record(schema.string(), schema.string()),
    }),
  }),
});

export const categoryInput = schema.object({
  name: schema.string().trim().min(1).max(80),
  description: schema.string().trim().min(1).max(300),
  example: schema.string().trim().min(1).max(300),
  idPrefix: schema.string().regex(/^[A-Z]{3}$/u),
});

export const aliasInput = schema.object({
  alias: schema.string().trim().min(1).max(80),
  personId: schema.guid(),
});

export const templateInput = schema.object({ body: schema.string().trim().min(1).max(300) });

export type Vocabulary = schema.infer<typeof vocabularyResponse>['data'];

export type Category = schema.infer<typeof category>;
