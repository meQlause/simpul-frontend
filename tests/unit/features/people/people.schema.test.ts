import { expect, test } from 'vitest';
import {
  inviteSchema,
  newPersonSchema,
  personInputSchema,
  responseSchema,
} from '../../../../src/features/people/people.schema';

const person = '5d0f6a2e-1c47-4b8a-9f21-0e6b7c3d2a11';
const other = '8e2b4c6d-3a1f-4e5b-9c7d-6f5e4d3c2b1a';
const andi = {
  name: 'Andi Pratama',
  telegramHandle: '@andi_sales',
  roleName: 'Sales Admin',
  team: 'Sales',
};

test('AC9: the client accepts the same new-person input the server accepts', () => {
  expect(newPersonSchema.safeParse(andi).success).toBe(true);
  expect(newPersonSchema.safeParse({ ...andi, telegramHandle: 'andi_sales' }).success).toBe(true);
  expect(newPersonSchema.safeParse({ ...andi, telegramHandle: '' }).success).toBe(true);
});

test.each([
  ['name', { ...andi, name: '' }],
  ['roleName', { ...andi, roleName: '   ' }],
  ['team', { ...andi, team: 'Marketing' }],
  ['telegramHandle', { ...andi, telegramHandle: 'abcd' }],
  ['telegramHandle', { ...andi, telegramHandle: 'a'.repeat(33) }],
  ['telegramHandle', { ...andi, telegramHandle: 'andi-sales' }],
])('AC9: the client refuses %s = %j before a request is sent', (field, input) => {
  const parsed = newPersonSchema.safeParse(input);

  expect(parsed.success).toBe(false);
  expect(parsed.error?.issues.map((issue) => issue.path[0])).toContain(field);
});

test('AC9: on edit, an empty username is sent as null and a changed one keeps its @', () => {
  const schema = personInputSchema(person, [other]);

  expect(
    schema.parse({ roleName: 'Sales Admin', availability: 'available', telegramHandle: '' })
      .telegramHandle,
  ).toBeNull();
  expect(
    schema.parse({
      roleName: 'Sales Admin',
      availability: 'available',
      telegramHandle: 'budi_gudang',
    }).telegramHandle,
  ).toBe('@budi_gudang');
  expect(
    schema.safeParse({
      roleName: 'Sales Admin',
      availability: 'available',
      telegramHandle: 'bad-name',
    }).success,
  ).toBe(false);
});

const listed = {
  id: person,
  name: 'Budi Santoso',
  availability: 'available',
  identities: [],
  telegramStatus: 'waiting',
  role: null,
  manager: null,
  backup: null,
};

test('FR-UI-24: the list reads each Telegram status and the bot, or none', () => {
  const ready = responseSchema.parse({ data: [listed], meta: { botUsername: 'salesindo_bot' } });

  expect(ready.data[0].telegramStatus).toBe('waiting');
  expect(ready.meta.botUsername).toBe('salesindo_bot');
  expect(
    responseSchema.parse({ data: [], meta: { botUsername: null } }).meta.botUsername,
  ).toBeNull();
  expect(
    responseSchema.safeParse({
      data: [{ ...listed, telegramStatus: 'online' }],
      meta: { botUsername: null },
    }).success,
  ).toBe(false);
});

test('FR-TG-12: an invite is a t.me link with an ISO expiry; anything else is refused', () => {
  const invite = {
    link: `https://t.me/salesindo_bot?start=${'a'.repeat(32)}`,
    expiresAt: '2026-10-24T09:30:00.000Z',
  };

  expect(inviteSchema.parse({ data: invite }).data).toEqual(invite);
  expect(
    inviteSchema.safeParse({ data: { ...invite, link: 'https://evil.example/x' } }).success,
  ).toBe(false);
  expect(inviteSchema.safeParse({ data: { ...invite, expiresAt: 'next week' } }).success).toBe(
    false,
  );
});
