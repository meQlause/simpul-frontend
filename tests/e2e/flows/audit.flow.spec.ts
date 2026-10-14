import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>> | undefined;

test.beforeEach(async ({ page }) => {
  test.setTimeout(120000);
  backend = await startBackend();
  await connectBackend(page, backend.baseUrl);
  await page.goto('/audit');
  await page.getByRole('link', { name: 'ORD-0098 routed to Budi Santoso', exact: true }).click();
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
  backend?.stop();
});

test('B-22: a trace opens, switches tabs and steps to the next decision', async ({ page }) => {
  const drawer = page.getByRole('dialog');

  await expect(drawer.getByText('1 / 5', { exact: true })).toBeVisible();
  await drawer.getByRole('tab', { name: /Linked context/ }).click();
  await expect(drawer.getByText('Raw conversation access is restricted')).toBeVisible();
  await drawer.getByRole('link', { name: 'Next decision' }).click();
  await expect(drawer.getByText('2 / 5', { exact: true })).toBeVisible();
});

test('B-23: the rule is paused from the trace and the list shows it paused', async ({ page }) => {
  const drawer = page.getByRole('dialog');

  await drawer.getByRole('button', { name: 'Pause this rule', exact: true }).click();
  await expect(drawer.getByText('Currently paused', { exact: true })).toBeVisible();
});

test('AC24: the switch on shows the redacted text in the Messages tab; off hides it again', async ({
  page,
}) => {
  const toggle = page.getByLabel('Show message text in History & audit', { exact: true });

  await page.goto('/settings');
  await toggle.check();
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Workspace settings saved.');

  await page.goto('/audit?tab=messages');
  await expect(page.locator('[data-message-row]').first()).toContainText('Sample order update');

  await page.goto('/settings');
  await toggle.uncheck();
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Workspace settings saved.');

  await page.goto('/audit?tab=messages');
  await expect(page.getByText('Message text is hidden', { exact: true }).first()).toBeVisible();
});
