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

for (const width of [1440, 900, 375]) {
  test(`A 90-character customer is cut with an ellipsis at ${width}px and the last column stays`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await connectBackend(page, backend.baseUrl);
    await page.route(/\/api\/v1\/work(\?|$)/, async (route) => {
      const url = new URL(route.request().url());
      const real = await route.fetch({ url: `${backend.baseUrl}${url.pathname}${url.search}` });
      const body = (await real.json()) as { data: { customer: string | null }[] };

      body.data[0].customer = LONG;
      await route.fulfill({ json: body });
    });
    await page.goto('/work');
    await expectCut(page, width);
  });
}

async function expectCut(page: Page, width: number) {
  const name = page.locator('tbody tr').first().locator('strong');

  expect(LONG).toHaveLength(90);
  await expect(name).toHaveAttribute('title', LONG);
  await expect(name).toHaveCSS('text-overflow', 'ellipsis');
  await expect(name).toHaveCSS('white-space', 'nowrap');
  const cut = await name.evaluate((node) => node.scrollWidth > node.clientWidth);

  expect(cut).toBe(true);
  const last = page
    .locator('tbody tr')
    .first()
    .getByRole('link', { name: /^View / });
  const box = await last.boundingBox();

  expect(box).not.toBeNull();
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  expect(overflow).toBeLessThanOrEqual(0);
}
