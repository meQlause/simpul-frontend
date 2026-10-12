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
  await page.goto('/people');
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});

test('Drawer: opens modally, Escape and the close button close it, focus returns', async ({
  page,
}) => {
  const opener = page.getByRole('button', { name: 'Budi Santoso', exact: true });

  await opener.focus();
  await page.keyboard.press('Enter');
  const drawer = page.getByRole('dialog');

  await expect(drawer).toBeVisible();
  expect(await drawer.evaluate((node) => node.matches(':modal'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/people$/);
  await expect(opener).toBeFocused();

  await opener.click();
  await page.getByRole('button', { name: 'Close', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Drawer: it is a route, so Back closes it', async ({ page }) => {
  await page.getByRole('button', { name: 'Budi Santoso', exact: true }).click();
  await expect(page).toHaveURL(/\/people\/.+/);
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/people$/);
});
