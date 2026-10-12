import { expect, test, type Page } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>>;
const LONG =
  'PT Sumber Makmur Sentosa Abadi Jaya Perkasa Nusantara Distribusi Logistik Terpadu Indonesia'.slice(
    0,
    90,
  );

test.beforeAll(async () => {
  test.setTimeout(120000);
  backend = await startBackend();
});
test.afterAll(() => backend?.stop());
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});

// The cap is what keeps one long name from pushing the table (and its last column) away: with it
// the table grows by at most the room between an ordinary name and the cap.
const GROWTH = 80;

async function tableWidth(page: Page) {
  return page
    .locator('.table-wrap')
    .first()
    .evaluate((node) => node.scrollWidth);
}

for (const width of [1440, 900, 375]) {
  test(`A 90-character customer is cut with an ellipsis at ${width}px and the table stays`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await connectBackend(page, backend.baseUrl);
    await page.goto('/work');
    await expect(page.locator('tbody tr').first()).toBeVisible();
    const ordinary = await tableWidth(page);

    await page.route(/\/api\/v1\/work(\?|$)/, async (route) => {
      const url = new URL(route.request().url());
      const real = await route.fetch({ url: `${backend.baseUrl}${url.pathname}${url.search}` });
      const body = (await real.json()) as { data: { customer: string | null }[] };

      body.data[0].customer = LONG;
      await route.fulfill({ json: body });
    });
    await page.goto('/work');
    await expectCut(page, ordinary);
  });
}

async function expectCut(page: Page, ordinary: number) {
  const name = page.locator('tbody tr').first().locator('strong');

  expect(LONG).toHaveLength(90);
  await expect(name).toHaveAttribute('title', LONG);
  await expect(name).toHaveCSS('text-overflow', 'ellipsis');
  await expect(name).toHaveCSS('white-space', 'nowrap');
  const cut = await name.evaluate((node) => node.scrollWidth > node.clientWidth);

  expect(cut).toBe(true);
  expect(await tableWidth(page)).toBeLessThanOrEqual(ordinary + GROWTH);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  expect(overflow).toBeLessThanOrEqual(0);
}
