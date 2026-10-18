import { expect, test, type Locator, type Page } from '@playwright/test';
import { pendingWorkspace } from './helpers/database';

// The authentication footer: its two texts as two left-aligned rows, readable at every width
// (ticket ui-empty-layout, AC9). The dashboard footer is not touched.
const IDENTITY = {
  person: { name: 'Budi Santoso', roleName: 'Warehouse Lead' },
  workspace: {
    name: 'Point Star',
    descriptor: 'Operations',
    timezone: 'Asia/Jakarta',
    counts: { members: 1, channels: 1, activeRules: 1 },
  },
};
const FORBIDDEN = {
  error: { code: 'E-FORBIDDEN', message: '', details: [], requestId: 'not-admin' },
};

const VARIANTS: [string, (page: Page) => Promise<unknown>][] = [
  ['Sign in', (page) => page.goto('/sign-in')],
  ['Set password', (page) => page.goto('/set-password?token=one-time')],
  ['No access', noAccess],
  [
    'Database setup',
    async (page) => {
      await pendingWorkspace(page);
      await page.goto('/setup/database');
    },
  ],
];

for (const [name, open] of VARIANTS) {
  for (const width of [375, 768, 1440]) {
    test(`AC9: the ${name} footer is two left-aligned rows at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page);
      const footer = page.locator('.auth-form .page-footer');
      const rows = footer.locator(':scope > span');

      await expect(rows).toHaveText([
        'Stay informed. Important updates are accounted for.',
        /^Simpul\s*·\s*Made for work that flows\.$/,
      ]);
      await expect(rows.nth(1)).toBeVisible();
      await expectTwoRows(footer, rows);
    });
  }
}

async function noAccess(page: Page) {
  await page.route('**/api/v1/**', (route) =>
    route.request().url().endsWith('/me')
      ? route.fulfill({ json: { data: IDENTITY } })
      : route.fulfill({ status: 403, json: FORBIDDEN }),
  );
  await page.goto('/work');
  await expect(page.getByRole('heading', { name: 'No access.' })).toBeVisible();
}

// The product row sits below the reassurance, both start at the same left edge, each flows as
// ordinary text (so the separator never becomes a column of its own) and nothing overflows.
async function expectTwoRows(footer: Locator, rows: Locator) {
  const [first, second] = [(await rows.nth(0).boundingBox())!, (await rows.nth(1).boundingBox())!];
  const layout = await footer.evaluate((node) => ({
    overflow: node.scrollWidth > node.clientWidth,
    displays: [...node.children].map((child) => getComputedStyle(child).display),
    right: node.getBoundingClientRect().right,
    form: node.closest('.auth-form')!.getBoundingClientRect().right,
  }));

  expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
  expect(Math.abs(first.x - second.x)).toBeLessThanOrEqual(1);
  expect(layout.displays.some((display) => /flex|grid/.test(display))).toBe(false);
  expect(layout.overflow).toBe(false);
  expect(layout.right).toBeLessThanOrEqual(layout.form);
}
