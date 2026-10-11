import { expect, test, type Locator, type Page } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  test.setTimeout(120000);
  backend = await startBackend();
});
test.afterAll(() => backend?.stop());
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});
test.beforeEach(async ({ page }) => {
  await connectBackend(page, backend.baseUrl);
});

type Drawer = {
  name: string;
  data: RegExp;
  open: (page: Page) => Promise<void>;
  behind: (page: Page) => Locator;
};

const rows = (page: Page) => page.getByRole('row').nth(1);
const heading = (page: Page) => page.getByRole('heading', { level: 1 }).first();

const drawers: Drawer[] = [
  {
    name: 'Work detail',
    data: /\/api\/v1\/work\/ORD-0098$/,
    open: async (page) => {
      await page.goto('/work/ORD-0098');
    },
    behind: rows,
  },
  {
    name: 'Audit trace',
    data: /\/api\/v1\/decisions\/[^/?]+$/,
    open: async (page) => {
      await page.goto('/audit');
      await page
        .getByRole('link', { name: 'ORD-0098 routed to Budi Santoso', exact: true })
        .click();
    },
    behind: rows,
  },
  {
    name: 'Review item',
    data: /\/api\/v1\/review-items\/[^/?]+$/,
    open: async (page) => {
      await page.goto('/queue');
      await page
        .getByRole('row')
        .filter({ hasText: 'Who does “Pak Bud” refer to?' })
        .getByRole('link', { name: 'Link name', exact: true })
        .click();
    },
    behind: rows,
  },
  {
    name: 'Channel',
    data: /\/api\/v1\/channels\/[^/?]+$/,
    open: async (page) => {
      await page.goto('/channels');
      await page.getByRole('button', { name: 'Operations', exact: true }).click();
    },
    behind: rows,
  },
  {
    name: 'Vocabulary',
    data: /\/api\/v1\/vocabulary$/,
    open: async (page) => {
      await page.goto('/settings/vocabulary');
    },
    behind: heading,
  },
  {
    name: 'Mail server',
    data: /\/api\/v1\/settings\/mail$/,
    open: async (page) => {
      await page.goto('/settings/mail');
    },
    behind: heading,
  },
  {
    name: 'Recipient preview',
    data: /\/api\/v1\/previews\/recipient$/,
    open: async (page) => {
      await page.goto('/settings/recipient-preview');
    },
    behind: heading,
  },
];

for (const drawer of drawers) {
  for (const [state, status] of [
    ['not-found', 404],
    ['error', 500],
  ] as const) {
    test(`${drawer.name}: ${state} shows inside the drawer and the list stays`, async ({
      page,
    }) => {
      const code = state === 'error' ? 'E-INTERNAL' : 'E-NOT-FOUND';

      // The page behind loads its own data before the drawer's request is held back.
      await page.route(drawer.data, async (route) => {
        await route.fulfill({
          status,
          json: { error: { code, message: '', details: [], requestId: 'drawers' } },
        });
      });
      await drawer.open(page);

      await expect(
        page.getByRole('dialog').locator(`[data-component="ScreenState"][data-variant="${state}"]`),
      ).toBeVisible();
      await expect(drawer.behind(page)).toBeVisible();
    });
  }

  test(`${drawer.name}: loading shows inside the drawer and the list stays`, async ({ page }) => {
    await page.route(drawer.data, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await route.fallback();
    });
    await drawer.open(page);

    await expect(
      page.getByRole('dialog').locator('[data-component="ScreenState"][data-variant="loading"]'),
    ).toBeVisible();
    await expect(drawer.behind(page)).toBeVisible();
  });
}
