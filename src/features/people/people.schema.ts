import { z as schema } from 'zod';
import { peopleCopy as copy } from './people.copy';

// The team tabs the server accepts (people.schema.ts on the server).
export const TEAMS = ['Operations', 'Warehouse', 'Sales', 'Finance', 'Other'] as const;

// Empty means no username (null on the wire). Otherwise 5–32 letters, digits or underscores; a leading @ is dropped and the stored handle keeps one.
const telegramHandleInput = schema
  .string()
  .trim()
  .transform((value) => value.replace(/^@/u, ''))
  .refine((username) => username === '' || /^\w{5,32}$/u.test(username), copy.invalidUsername)
  .transform((username) => (username === '' ? null : `@${username}`));

export const signedInPersonSchema = schema.object({
  data: schema.object({ person: schema.object({ id: schema.guid() }) }),
});

const namedPerson = schema.object({ id: schema.guid(), name: schema.string() });
const personSchema = namedPerson.extend({
  availability: schema.enum(['available', 'leave']),
  identities: schema.array(
    schema.object({ provider: schema.string(), handle: schema.string().nullable() }),
  ),
  role: namedPerson.extend({ team: schema.string() }).nullable(),
  manager: namedPerson.nullable(),
  backup: namedPerson.nullable(),
});

export type Person = schema.infer<typeof personSchema>;

export const responseSchema = schema.object({ data: schema.array(personSchema) });

export const savedPersonSchema = schema.object({ data: personSchema });

export function personInputSchema(personId: string, eligibleIds: string[]) {
  const reference = schema.guid().refine((id) => id !== personId && eligibleIds.includes(id));

  return schema.strictObject({
    roleName: schema
      .string()
      .trim()
      .min(1, 'Enter a role name first.')
      .max(60, 'Enter a role name first.'),
    managerId: reference.optional(),
    availability: schema.enum(['available', 'leave']),
    backupPersonId: reference.optional(),
    telegramHandle: telegramHandleInput.optional(),
  });
}

export const newPersonSchema = schema.strictObject({
  name: schema.string().trim().min(1, copy.invalidName).max(120, copy.invalidName),
  // The server takes a new person without a username; it does not take null.
  telegramHandle: telegramHandleInput.optional().transform((handle) => handle ?? undefined),
  roleName: schema.string().trim().min(1, copy.invalidRole).max(60, copy.invalidRole),
  team: schema.enum(TEAMS),
});
