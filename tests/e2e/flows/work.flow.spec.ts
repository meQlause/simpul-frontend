import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { connectBackend, startBackend } from '../helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>> | undefined;

test.beforeEach(async ({ page }) => {
  test.setTimeout(120000);
  backend = await startBackend();
  await connectBackend(page, backend.baseUrl);
  await page.goto('/work');
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
  backend?.stop();
});

test('B-06: the status filter and the search narrow the list', async ({ page }) => {
  await page.getByLabel('Filter status').selectOption('stalled');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody tr').first()).toContainText('ORD-0091');
  await page.getByLabel('Filter status').selectOption('');
  await page.getByLabel('Search work').fill('Berkah');
  await expect(page.locator('tbody tr')).toHaveCount(1);
});

test('B-07: a row opens its detail drawer', async ({ page }) => {
  await page.goto('/work/ORD-0091');
  const drawer = page.getByRole('dialog');

  await expect(drawer.getByText('Goods have been ready since yesterday')).toBeVisible();
  await expect(drawer.getByText('Evidence summaries only')).toBeVisible();
});

test('B-08 and B-09: close with a reason, then undo', async ({ page }) => {
  await page.goto('/work/ORD-0098');
  await page.getByRole('button', { name: 'Close work', exact: true }).click();
  const popup = page.getByRole('dialog', { name: 'Close work', exact: true });

  await popup.getByLabel('Closure reason').fill('Customer received the goods.');
  await popup.getByRole('button', { name: 'Close work', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'ORD-0098 closed' })).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Change undone.' })).toBeVisible();
});

test('B-10: Export summary downloads the six summary columns', async ({ page }) => {
  const download = page.waitForEvent('download');

  await page.getByRole('button', { name: 'Export summary' }).click();
  const path = await (await download).path();
  const csv = await readFile(path, 'utf8');

  expect(csv.replace(/^\uFEFF/, '').split('\r\n')[0]).toBe(
    '"ID","Customer","Work","Owner","Channel","Status"',
  );
});

test('B-34: Load more shows the next 25', async ({ page }) => {
  await expect(page.locator('tbody tr')).toHaveCount(25);
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(50);
});
