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
  await page.goto('/rules');
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});

test('Toast: appears as a status after a change and hides after 4.8 s', async ({ page }) => {
  await page.clock.install();
  await page
    .getByRole('switch', { name: /^(Activate|Pause) / })
    .first()
    .click();
  const toast = page.locator('.toast');

  await expect(toast).toBeVisible();
  await expect(toast).toHaveAttribute('role', 'status');
  await page.clock.fastForward(4700);
  await expect(toast).toBeVisible();
  await page.clock.fastForward(300);
  await expect(page.locator('.toast')).toHaveCount(0);
});
