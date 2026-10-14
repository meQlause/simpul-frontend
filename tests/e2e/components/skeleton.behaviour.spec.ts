import { expect, test, type Page } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

const LISTS = ['/work', '/queue', '/rules', '/people', '/channels', '/audit'];
const LINE = 'rgb(230, 234, 228)';
const SURFACE = 'rgb(255, 255, 255)';

let backend: Awaited<ReturnType<typeof startBackend>>;

// A request that never answers: the page stays in its loading state.
const hold = (page: Page) => page.route('**/api/v1/**', () => undefined);
const loading = (page: Page) =>
  page.getByRole('status', { name: 'Your workspace data is loading.' });
const skeleton = (page: Page, variant: string) =>
  page.locator(`[data-component="Skeleton"][data-variant="${variant}"]`);

test.beforeAll(async () => {
  test.setTimeout(60000);
  backend = await startBackend();
});
test.afterAll(() => {
  backend?.stop();
});
test.beforeEach(async ({ page }) => {
  await connectBackend(page, backend.baseUrl);
});

for (const path of LISTS) {
  test(`${path} shows a table skeleton of heading, toolbar and six rows while held`, async ({
    page,
  }) => {
    await hold(page);
    await page.goto(path);

    const table = skeleton(page, 'table');

    await expect(table).toBeVisible();
    await expect(table.locator('.skeleton-heading')).toHaveCount(1);
    await expect(table.locator('.skeleton-toolbar')).toHaveCount(1);
    await expect(table.locator('.skeleton-row')).toHaveCount(6);
    await expect(loading(page).getByRole('heading')).toHaveCount(0);
    await expect(page.getByText('Your workspace data is loading.')).toHaveCount(0);
  });
}

test('/ shows a cards skeleton of four blocks laid out by the stats grid', async ({ page }) => {
  await hold(page);
  await page.goto('/');

  const cards = skeleton(page, 'cards');

  await expect(cards).toBeVisible();
  await expect(cards).toHaveClass(/stats-grid/);
  await expect(cards.locator('.skeleton-card')).toHaveCount(4);
});

test('/settings shows a cards skeleton of four stacked blocks', async ({ page }) => {
  await hold(page);
  await page.goto('/settings');

  const cards = skeleton(page, 'cards');

  await expect(cards).toBeVisible();
  await expect(cards).not.toHaveClass(/stats-grid/);
  await expect(cards.locator('.skeleton-card')).toHaveCount(4);
});

test('the work drawer shows a drawer skeleton while its detail is held, and the list stays', async ({
  page,
}) => {
  await page.route(/\/api\/v1\/work\/[^/?]+(\?|$)/, () => undefined);
  await page.goto('/work/ORD-0091');

  const drawer = page
    .getByRole('dialog')
    .locator('[data-component="Skeleton"][data-variant="drawer"]');

  await expect(drawer).toBeVisible();
  await expect(drawer.locator('.skeleton-identity')).toHaveCount(1);
  await expect(drawer.locator('.skeleton-section')).toHaveCount(3);
  await expect(page.locator('table.work-table')).toBeVisible();
});

test('the loading container is a named status, and every block is hidden from assistive tech', async ({
  page,
}) => {
  await hold(page);
  await page.goto('/work');

  const container = loading(page);

  await expect(container).toBeVisible();

  const blocks = container.locator('.skeleton-block');

  expect(
    await blocks.evaluateAll((items) =>
      items.every((item) => item.closest('[aria-hidden="true"]') !== null),
    ),
  ).toBe(true);
  expect(await blocks.first().evaluate((item) => getComputedStyle(item).backgroundColor)).toBe(
    LINE,
  );
  expect(await container.evaluate((item) => getComputedStyle(item).backgroundColor)).toBe(SURFACE);
});

test('the skeleton shows while its request is pending, and is gone once it answers', async ({
  page,
}) => {
  let answer: (() => void) | undefined;

  await page.route(
    /\/api\/v1\/work(\?|$)/,
    (route) =>
      new Promise<void>((resolve) => {
        answer = () => {
          void route
            .fulfill({ json: { data: [], page: { nextCursor: null, total: 0 } } })
            .then(resolve);
        };
      }),
  );
  await page.goto('/work');
  await expect(skeleton(page, 'table')).toBeVisible();

  await expect.poll(() => answer !== undefined).toBe(true);
  answer?.();
  await expect(skeleton(page, 'table')).toHaveCount(0);
});

test('the blocks run no animation under reduced motion, and shimmer otherwise', async ({
  page,
}) => {
  await hold(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/work');

  const block = page.locator('.skeleton-block').first();

  await expect(block).toBeVisible();
  expect(await block.evaluate((item) => getComputedStyle(item).animationName)).toBe('none');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(await block.evaluate((item) => getComputedStyle(item).animationName)).toBe(
    'skeleton-shimmer',
  );
});

test('/setup/database shows a table skeleton while its database request is held', async ({
  page,
}) => {
  await hold(page);
  await page.goto('/setup/database');

  const table = skeleton(page, 'table');

  await expect(table).toBeVisible();
  await expect(table.locator('.skeleton-heading')).toHaveCount(1);
  await expect(table.locator('.skeleton-toolbar')).toHaveCount(1);
  await expect(table.locator('.skeleton-row')).toHaveCount(6);
  await expect(loading(page)).toBeVisible();
});
