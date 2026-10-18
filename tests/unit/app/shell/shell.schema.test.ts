import { describe, expect, it } from 'vitest';
import { meSchema } from '../../../../src/app/shell/shell.schema';

const identity = {
  data: {
    person: { name: 'Ardial', roleName: 'Administrator' },
    workspace: {
      name: 'Simpul',
      descriptor: 'Operations workspace',
      timezone: 'Asia/Jakarta',
      counts: { members: 1, channels: 0, activeRules: 0 },
    },
  },
};

describe('the shell accepts the existing nullable identity contract', () => {
  it.each([
    [null, 'Operations workspace'],
    ['Administrator', null],
    [null, null],
    ['Administrator', 'Operations workspace'],
  ])('accepts role %s and descriptor %s', (roleName, descriptor) => {
    expect(
      meSchema.safeParse({
        data: {
          person: { ...identity.data.person, roleName },
          workspace: { ...identity.data.workspace, descriptor },
        },
      }).success,
    ).toBe(true);
  });

  it.each([null, undefined, 42])('still rejects invalid required names: %s', (name) => {
    expect(
      meSchema.safeParse({
        data: { ...identity.data, person: { ...identity.data.person, name } },
      }).success,
    ).toBe(false);
  });

  it('still rejects malformed workspace counts', () => {
    expect(
      meSchema.safeParse({
        data: {
          ...identity.data,
          workspace: { ...identity.data.workspace, counts: { members: -1 } },
        },
      }).success,
    ).toBe(false);
  });
});
