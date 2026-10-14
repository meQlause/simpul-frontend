import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

const STYLES = 'src/styles';
const SIZE = /^(0|calc\(\d+(\.\d+)?px \+ var\(--text-step\)\))$/;

function sizes() {
  return readdirSync(STYLES)
    .filter((name) => name.endsWith('.css'))
    .flatMap((name) =>
      [...readFileSync(join(STYLES, name), 'utf8').matchAll(/font-size: ([^;]+);/g)].map(
        (match) => `${name}: ${match[1]}`,
      ),
    );
}

test('T25: every font-size is 0 or the mockup size plus the text step', () => {
  const found = sizes();

  expect(found.length).toBeGreaterThan(0);
  expect(found.filter((entry) => !SIZE.test(entry.split(': ')[1]))).toEqual([]);
});

test('T25: the text step is 2px', () => {
  expect(readFileSync(join(STYLES, 'base.css'), 'utf8')).toMatch(/--text-step:\s*2px;/);
});
