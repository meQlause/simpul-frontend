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
  await page.goto('/channels');
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});

test('ConfirmPopup: opens centred and Cancel leaves everything as it was', async ({ page }) => {
  await page.getByRole('button', { name: 'Pause Operations', exact: true }).click();
  const popup = page.getByRole('dialog', { name: 'Pause Operations?' });

  await expect(popup).toBeVisible();
  const box = await popup.boundingBox();
  const viewport = page.viewportSize();
  const centre = (box?.x ?? 0) + (box?.width ?? 0) / 2;

  expect(Math.abs(centre - (viewport?.width ?? 0) / 2)).toBeLessThan(40);
  await popup.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(popup).toHaveCount(0);
  await expect(page.getByRole('row').filter({ hasText: 'Operations' })).toContainText('Active');
});
