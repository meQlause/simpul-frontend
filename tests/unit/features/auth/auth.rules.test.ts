import { expect, test } from 'vitest';
import { returnPath } from '../../../../src/features/auth/auth.rules';

test.each([undefined, '//outside.example', '/\\outside.example', 'https://outside.example'])(
  'sign-in rejects an external return location: %s',
  (path) => {
    expect(returnPath(path)).toBe('/');
  },
);

test('sign-in preserves the internal path, search and fragment', () => {
  expect(returnPath('/work?q=sri#results')).toBe('/work?q=sri#results');
});
