import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>> | undefined;

test.beforeEach(async ({ page }) => {
  test.setTimeout(120000);
  backend = await startBackend();
  await connectBackend(page, backend.baseUrl);
  await page.goto('/people');
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
  backend?.stop();
});

test('B-15: a role is edited, its backup preview follows, and the list shows the result', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Budi Santoso', exact: true }).click();
  const drawer = page.getByRole('dialog');

  await drawer.getByLabel('Role', { exact: true }).fill('Warehouse Manager');
  await drawer.getByLabel('Backup person', { exact: true }).selectOption({ label: 'Mr. Hendra' });
  await expect(drawer.locator('.drawer-handoff')).toContainText('Mr. Hendra');
  await drawer.getByRole('button', { name: 'Save role', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('row').filter({ hasText: 'Budi Santoso' }).getByText('Warehouse Manager'),
  ).toBeVisible();
});
