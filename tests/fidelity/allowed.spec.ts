// fidelity §11 is the only place a difference is allowed: every id the harness relies on is an
// open row there, and every view compared more loosely than the rest is named in allowed.ts.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { exceptions, usedIds } from './allowed.ts';
import { appViews } from './pages.ts';

const document = readFileSync(resolve(import.meta.dirname, '../../../docs/FE/fidelity.md'), 'utf8');
const section = document.slice(document.indexOf('## 11. Allowed deviations'));
const rows = [...section.matchAll(/^\| (FD-\d+) \|(.*)$/gm)].map((match) => ({
  id: match[1],
  closed: /\*\*Closed/.test(match[2]),
}));

test('every id the harness uses is an open row of §11', () => {
  for (const id of usedIds) {
    const row = rows.find((candidate) => candidate.id === id);

    expect(row, `${id} is a row of §11`).toBeDefined();
    expect(row?.closed, `${id} is open`).toBe(false);
  }
});

test('every view with its own tolerance or skipped region is listed in allowed.ts', () => {
  const listed = new Set<string>(exceptions.map((entry) => entry.view));

  for (const entry of appViews) {
    if (entry.tolerance !== undefined || entry.ignore !== undefined) {
      expect(listed.has(entry.view), `${entry.view} is in allowed.ts`).toBe(true);
    }
  }
});
