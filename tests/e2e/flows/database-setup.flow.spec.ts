import { expect, test } from '@playwright/test';
import { connectedWorkspace, pendingWorkspace, STRING } from '../helpers/database';

const ACK = 'I understand that data availability is our responsibility.';

test('B-35: accept the notice and connect the own database', async ({ page }) => {
  const writes = await pendingWorkspace(page);

  await page.goto('/work');
  await expect(page).toHaveURL(/\/setup\/database$/);
  await page.getByLabel(ACK).check();
  await page.getByLabel('Connection string', { exact: true }).fill(STRING);
  await page.getByRole('button', { name: 'Connect database', exact: true }).click();

  await expect(page).toHaveURL(/\/$/);
  expect(writes).toEqual([{ connectionString: STRING, availabilityAck: true }]);
});

test('B-36: see where the data is stored and replace the connection', async ({ page }) => {
  await connectedWorkspace(page);
  await page.goto('/settings');
  await page
    .locator('[data-component="Callout"]')
    .filter({ hasText: 'Where this workspace’s data is stored.' })
    .getByRole('link')
    .click();
  const drawer = page.getByRole('dialog');

  await expect(drawer.getByText('db.pointstar.example', { exact: true }).first()).toBeVisible();
  await drawer.getByLabel('Connection string', { exact: true }).fill(STRING);
  await drawer.getByRole('button', { name: 'Update connection', exact: true }).click();
  await expect(drawer.getByText('Database connection updated.')).toBeVisible();
});
