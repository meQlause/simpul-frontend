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
  // The page behind is locked: only the drawer scrolls.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).toBe(
    'hidden',
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/people$/);
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).toBe(
    'visible',
  );

  await opener.click();
  await page.getByRole('button', { name: 'Close', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Drawer: a click outside closes it; a selection dragged out of it does not', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Budi Santoso', exact: true }).click();
  const box = await page.getByRole('dialog').boundingBox();
  const left = box?.x ?? 0;

  await page.mouse.move(left + 60, 120);
  await page.mouse.down();
  await page.mouse.move(left / 2, 120);
  await page.mouse.up();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.mouse.click(left / 2, 120);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/people$/);
});

test('Drawer: body and footer reach the right edge beside the close button', async ({ page }) => {
  await page.getByRole('button', { name: 'Budi Santoso', exact: true }).click();
  // Measured once the drawer has slid in.
  await page
    .getByRole('dialog')
    .evaluate((node) => Promise.all(node.getAnimations().map((animation) => animation.finished)));
  const edge = (selector: string) =>
    page.locator(selector).evaluate((node) => Math.round(node.getBoundingClientRect().right));

  expect(await edge('.drawer-screen-footer')).toBe(await edge('dialog.drawer'));
});

test('Drawer: it is a route, so Back closes it', async ({ page }) => {
  await page.getByRole('button', { name: 'Budi Santoso', exact: true }).click();
  await expect(page).toHaveURL(/\/people\/.+/);
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/people$/);
});
