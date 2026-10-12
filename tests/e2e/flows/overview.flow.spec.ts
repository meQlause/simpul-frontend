import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

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
  await page.goto('/');
});

test('B-03: Today and Last 7 days switch the figures and the URL', async ({ page }) => {
  const figures = page.locator('.stat-main strong');

  await expect(figures.first()).toHaveText('1,284');
  await page.getByRole('button', { name: 'Last 7 days', exact: true }).click();
  await expect(figures.first()).toHaveText('8,426');
  await expect(page).toHaveURL(/period=week/);
  await expect(page.getByRole('button', { name: 'Last 7 days', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  await expect(figures.first()).toHaveText('1,284');
});

test('B-04: an attention item opens the queue filtered to its kind', async ({ page }) => {
  await page.getByRole('link', { name: '02 Names need clarification' }).click();
  await expect(page).toHaveURL(/\/queue\?kind=alias$/);
});

test('B-05: See how it works plays the sample and reports it, sending nothing', async ({
  page,
}) => {
  const writes: string[] = [];

  page.on('request', (request) => {
    if (request.method() !== 'GET') {
      writes.push(request.method());
    }
  });
  await page.getByRole('button', { name: /See how it works/ }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Playing the sample' })).toHaveText(
    'Playing the sample information flow…',
  );
  await expect(page.getByRole('status').filter({ hasText: 'Simulation complete' })).toContainText(
    'Budi selected as recipient. No messages were sent.',
  );
  expect(writes).toEqual([]);
});
