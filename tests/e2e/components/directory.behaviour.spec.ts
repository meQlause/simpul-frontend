import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  test.setTimeout(120000);
  backend = await startBackend();
});
test.afterAll(() => backend?.stop());
test.beforeEach(async ({ page }) => {
  await connectBackend(page, backend.baseUrl);
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});

test('Directory: a tab filters and is pressed, the search narrows, nothing found says so', async ({
  page,
}) => {
  await page.goto('/rules');
  const active = page.getByRole('button', { name: /^Active/ });

  await active.click();
  await expect(active).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('tbody tr[data-directory-row]')).toHaveCount(3);
  await page.getByRole('searchbox', { name: /^Search rules/ }).fill('zzzz');
  await expect(page.getByText('No matches found')).toBeVisible();
});

test('Directory: at 375px the rows become stacked cards with their labels', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/people');
  const cell = page.locator('tbody tr').first().locator('td[data-label]').nth(1);

  expect(await cell.evaluate((node) => getComputedStyle(node).display)).not.toBe('table-cell');
  expect(await cell.evaluate((node) => getComputedStyle(node, '::before').content)).toContain(
    'Role',
  );
});
