import { expect, test } from 'vitest';
import { settingsInputSchema } from '../../../../src/features/settings/settings.schema';

const valid = {
  quietStart: '21:00',
  quietEnd: '07:00',
  budgetPerHour: 6,
  digestTime: '08:30',
  contextWindowMinutes: 30,
  contextMaxMessages: 10,
};

test.each([
  { ...valid, quietEnd: '21:00' },
  { ...valid, budgetPerHour: 0 },
  { ...valid, budgetPerHour: 51 },
  { ...valid, budgetPerHour: 1.5 },
  { ...valid, quietStart: '24:00' },
  { ...valid, digestTime: '08:60' },
])('client rejects invalid settings before submission: %j', (input) => {
  expect(settingsInputSchema.safeParse(input).success).toBe(false);
});

test('client accepts quiet hours crossing midnight', () => {
  expect(settingsInputSchema.parse(valid)).toEqual(valid);
});

test.each(['id', 'workspaceId', 'level'])('client refuses server-owned %s in settings', (field) => {
  const parsed = settingsInputSchema.safeParse({ ...valid, [field]: 'client-owned-value' });

  expect(parsed.success).toBe(false);
  expect(parsed.error?.issues).toEqual([
    expect.objectContaining({ code: 'unrecognized_keys', keys: [field] }),
  ]);
});

test.each([
  { contextWindowMinutes: 0, contextMaxMessages: 1 },
  { contextWindowMinutes: 180, contextMaxMessages: 30 },
])('SRS §6.7 (FR-UI-21): the client accepts a context window of %j', (values) => {
  expect(settingsInputSchema.parse({ ...valid, ...values })).toEqual({ ...valid, ...values });
});

test.each([
  { contextWindowMinutes: 181 },
  { contextWindowMinutes: -1 },
  { contextWindowMinutes: 1.5 },
  { contextMaxMessages: 0 },
  { contextMaxMessages: 31 },
])('SRS §6.7 (FR-UI-21): the client rejects %j before submission', (values) => {
  expect(settingsInputSchema.safeParse({ ...valid, ...values }).success).toBe(false);
});

test('SRS §6.7 (FR-UI-21): the client rejects a body without the two context fields', () => {
  const without = Object.fromEntries(
    Object.entries(valid).filter(([key]) => !key.startsWith('context')),
  );

  expect(settingsInputSchema.safeParse(without).success).toBe(false);
});

test.each([true, false])(
  'SRS §11.4: the client accepts messageTextAccess %s',
  (messageTextAccess) => {
    expect(settingsInputSchema.parse({ ...valid, messageTextAccess })).toEqual({
      ...valid,
      messageTextAccess,
    });
  },
);

test('SRS §11.4: the client rejects messageTextAccess "on" before submission', () => {
  expect(settingsInputSchema.safeParse({ ...valid, messageTextAccess: 'on' }).success).toBe(false);
});
