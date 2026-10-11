import { z as schema } from 'zod';

export const databaseSchema = schema.object({
  data: schema.object({
    mode: schema.string(),
    status: schema.enum(['pending', 'connected', 'unreachable', 'migration_failed']),
    host: schema.string().nullable().optional(),
    port: schema.number().nullable().optional(),
    databaseName: schema.string().nullable().optional(),
    schemaVersion: schema.string().nullable().optional(),
    unreachableSince: schema.string().nullable().optional(),
  }),
});

export type Database = schema.infer<typeof databaseSchema>['data'];
