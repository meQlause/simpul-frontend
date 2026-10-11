import { expect, test, type Page } from '@playwright/test';
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

const SIZE = 25;
const TOTAL = 30;

// The seed holds fewer than 26 rows, so the real first page is cloned up to 30 rows
// and served as 25 + 5 behind a cursor.
async function paged(page: Page, pattern: RegExp) {
  await page.route(pattern, async (route) => {
    const url = new URL(route.request().url());
    const cursor = url.searchParams.get('cursor');

    url.searchParams.delete('cursor');
    const real = await route.fetch({ url: `${backend.baseUrl}${url.pathname}${url.search}` });
    const body = (await real.json()) as { data: { id: string }[]; page: Record<string, unknown> };
    const rows = Array.from({ length: TOTAL }, (_item, index) => ({
      ...body.data[index % body.data.length],
      id: `${body.data[index % body.data.length].id}-${index}`,
    }));
    const slice = cursor ? rows.slice(SIZE) : rows.slice(0, SIZE);

    await route.fulfill({
      json: {
        ...body,
        data: slice,
        page: { ...body.page, total: TOTAL, nextCursor: cursor ? null : 'second' },
      },
    });
  });
}

test('Work: Showing 25 of 125, Load more appends 25 at a time, then the button is gone', async ({
  page,
}) => {
  await page.goto('/work');
  await expect(page.getByText('Showing 25 of 125 work items', { exact: true })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(25);
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(page.getByText('Showing 50 of 125 work items', { exact: true })).toBeVisible();

  for (const shown of [75, 100, 125]) {
    await page.getByRole('button', { name: 'Load more', exact: true }).click();
    await expect(
      page.getByText(`Showing ${shown} of 125 work items`, { exact: true }),
    ).toBeVisible();
  }

  await expect(page.locator('tbody tr')).toHaveCount(125);
  await expect(page.getByRole('button', { name: 'Load more', exact: true })).toHaveCount(0);
});

test('Needs review: Showing 25 of 30, Load more appends the next 5, then the button is gone', async ({
  page,
}) => {
  await paged(page, /\/api\/v1\/review-items(\?|$)/);
  await page.goto('/queue');
  await expect(page.getByText('Showing 25 of 30 updates', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(page.getByText('Showing 30 of 30 updates', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Load more', exact: true })).toHaveCount(0);
});

test('History & audit: Showing 25 of 30, Load more appends the next 5, then the button is gone', async ({
  page,
}) => {
  await paged(page, /\/api\/v1\/decisions(\?|$)/);
  await page.goto('/audit');
  await expect(page.getByText('Showing 25 of 30 decisions', { exact: true })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(25);
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(page.getByText('Showing 30 of 30 decisions', { exact: true })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(30);
  await expect(page.getByRole('button', { name: 'Load more', exact: true })).toHaveCount(0);
});
