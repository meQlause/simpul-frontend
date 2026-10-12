import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>> | undefined;

test.beforeEach(async ({ page }) => {
  test.setTimeout(120000);
  backend = await startBackend();
  await connectBackend(page, backend.baseUrl);
  await page.goto('/channels');
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
  backend?.stop();
});

test('B-16: a group is saved as a draft and listed without being monitored', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Telegram channel' }).click();
  const drawer = page.getByRole('dialog');

  await drawer.getByLabel('Display name').fill('Flow draft');
  await drawer.getByLabel('Telegram Chat ID').fill('-1009100000001');
  await drawer.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('row').filter({ hasText: 'Flow draft' })).toContainText('Draft');
});

test('B-20: a group is paused after its confirmation and the others keep running', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Pause Warehouse & Shipping', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Pause Warehouse & Shipping?' })
    .getByRole('button', { name: 'Pause group', exact: true })
    .click();
  await expect(page.getByRole('row').filter({ hasText: 'Warehouse & Shipping' })).toContainText(
    'Paused',
  );
  await expect(page.getByRole('row').filter({ hasText: 'Operations' })).toContainText('Active');
});
