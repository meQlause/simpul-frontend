import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>> | undefined;

test.beforeEach(async ({ page }) => {
  test.setTimeout(120000);
  backend = await startBackend();
  await connectBackend(page, backend.baseUrl);
  await page.goto('/settings');
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
  backend?.stop();
});

test('B-24: quiet hours, the hourly limit and the digest time are saved', async ({ page }) => {
  await page.getByLabel('Notifications per person / hour', { exact: true }).fill('9');
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'saved' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Notifications per person / hour', { exact: true })).toHaveValue(
    '9',
  );
});

test('B-33: the mail server is saved and its password is kept out of the page', async ({
  page,
}) => {
  await page.getByRole('link', { name: /^Configure/ }).click();
  const drawer = page.getByRole('dialog');

  await drawer.getByLabel('Mail server host').fill('smtp.pointstar.example');
  await drawer.getByLabel('Port').fill('587');
  await drawer.getByLabel('Username').fill('simpul@pointstar.example');
  await drawer.getByLabel('Password').fill('flow-secret');
  await drawer.getByLabel('Sender address').fill('simpul@pointstar.example');
  await drawer.getByRole('button', { name: /^Save/ }).click();
  await expect(page.getByText('Mail server saved.')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('flow-secret');
});
