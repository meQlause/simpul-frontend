import { expect, test } from 'vitest';
import { settingsInputSchema } from '../../../../src/features/settings/settings.schema';

const valid = { quietStart: '21:00', quietEnd: '07:00', budgetPerHour: 6, digestTime: '08:30' };

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
