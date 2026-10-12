import { readFile } from 'node:fs/promises';
import { expect, test, type Locator } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  test.setTimeout(120000);
  backend = await startBackend();
});
test.afterAll(() => backend?.stop());
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});
test.beforeEach(async ({ page }) => {
  await connectBackend(page, backend.baseUrl);
  await page.goto('/work');
});

test('Work acceptance 1–2: first 25 items and each status filter use the real API', async ({
  page,
}) => {
  await expect(page.getByRole('row')).toHaveCount(26);

  for (const [status, id] of [
    ['tentative', 'ORD-0100'],
    ['cancelled', 'ORD-0083'],
    ['archived', 'ORD-0070'],
    ['stalled', 'ORD-0091'],
  ]) {
    await page.getByLabel('Filter status').selectOption(status);
    await expect(page.getByRole('link', { name: id, exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp('status=' + status));
  }

  await expect(page.getByRole('row')).toHaveCount(2);
});

test('Work acceptance 3: stalled detail shows the recorded summary, rhythm and ownership', async ({
  page,
}) => {
  await page.goto('/work/ORD-0091');
  const drawer = page.getByRole('dialog');

  // The mockup writes the rhythm in the update line and the owner as a name over a team.
  for (const text of [
    'Mrs. Sri',
    'Aqua 600 ml · 3 cases',
    'Stalled',
    'Budi Santoso',
    'Siti Aminah',
  ]) {
    await expect(drawer.getByText(text, { exact: true })).toBeVisible();
  }

  await expect(drawer).toContainText('Typical stage rhythm: 12 hours');
  await expect(drawer).toContainText('Reminder 1');
  await expect(drawer.locator('.drawer-person')).toContainText('Warehouse');
});

test('Work acceptance 4–6: short reasons do not submit; close and Undo persist', async ({
  page,
}) => {
  await page.goto('/work/ORD-0098');
  await page.getByRole('button', { name: 'Close work', exact: true }).click();
  const popup = page.getByRole('dialog', { name: 'Close work', exact: true });

  await rejectShortReason(popup);
  await popup.getByLabel('Close as').selectOption('cancelled');
  await popup.getByLabel('Closure reason').fill('Customer cancelled the sample order.');
  await popup.getByRole('button', { name: 'Close work', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('status').filter({ hasText: 'ORD-0098 closed. Reminders stopped.' }),
  ).toBeVisible();
  await page.getByLabel('Filter status').selectOption('cancelled');
  await expect(page.getByRole('row').filter({ hasText: 'ORD-0098' })).toContainText('Cancelled');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Change undone.' })).toBeVisible();
  await page.getByLabel('Filter status').selectOption('active');
  await expect(page.getByRole('row').filter({ hasText: 'ORD-0098' })).toContainText('Active');
});

test('Work acceptance 7 and 9: tentative work cannot close; missing details keep the list', async ({
  page,
}) => {
  await page.goto('/work/ORD-0100');
  await expect(
    page.getByRole('dialog').getByText('Silent observation', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close work', exact: true })).toHaveCount(0);
  await page.goto('/work/ORD-9999');
  await expect(page.getByRole('dialog').locator('[data-variant="not-found"]')).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(26);
});

test('Work acceptance 8: export downloads only the six summary columns', async ({ page }) => {
  const download = page.waitForEvent('download');

  await page.getByRole('button', { name: 'Export summary', exact: true }).click();
  const file = await download;
  const path = await file.path();
  const csv = await readFile(path!, 'utf8');

  expect(csv.replace(/^\uFEFF/, '').split('\r\n')[0]).toBe(
    '"ID","Customer","Work","Owner","Channel","Status"',
  );
  expect(csv).not.toMatch(/token|margin|cost|internal/i);
});

async function rejectShortReason(popup: Locator) {
  await popup.getByLabel('Closure reason').fill('ok');
  await popup.getByRole('button', { name: 'Close work', exact: true }).click();
  await expect(popup.getByRole('alert')).toContainText('5 characters');
  await expect(popup.getByLabel('Closure reason')).toBeFocused();
}
