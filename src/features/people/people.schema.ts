import { z as schema } from 'zod';

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

export const deliverySettingsSchema = schema.object({
  data: schema.object({
    quietStart: schema.string(),
    quietEnd: schema.string(),
    budgetPerHour: schema.number(),
    timezone: schema.string(),
  }),
});

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
  });
}
