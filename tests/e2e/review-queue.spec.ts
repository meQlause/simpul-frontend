import { expect, test } from '@playwright/test';
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
  await page.goto('/queue');
});

test('Needs review acceptance 1–2 and 6: seven rows, counted tabs, names filter and no matches', async ({
  page,
}) => {
  await expect(page.getByRole('row')).toHaveCount(8);

  for (const name of ['All updates 7', 'Routing gaps 4', 'Names 2', 'Categories 1']) {
    await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
  }

  await page.getByRole('tab', { name: 'Names 2', exact: true }).click();
  await expect(page).toHaveURL(/kind=alias/);
  await expect(page.getByRole('row')).toHaveCount(3);
  await expect(
    page.getByRole('link', { name: 'Who does “Pak Bud” refer to?', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: '“Bu Rin” is not recognized', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Search updates or channels…', { exact: true }).fill('zzz');
  await expect(page.getByText('No matches found', { exact: true })).toBeVisible();
});

test('Needs review acceptance 3–4: mapping Pak Bud preselects Budi and refreshes the queue and sidebar', async ({
  page,
}) => {
  const row = page.getByRole('row').filter({ hasText: 'Who does “Pak Bud” refer to?' });

  await row.getByRole('link', { name: 'Link name', exact: true }).click();
  const drawer = page.getByRole('dialog');

  await expect(drawer.getByText('DETECTED NAME · Pak Bud', { exact: true })).toBeVisible();
  await expect(drawer.getByLabel('Team member').locator('option:checked')).toHaveText(
    'Budi Santoso',
  );
  await drawer.getByRole('button', { name: 'Save mapping', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('row')).toHaveCount(7);
  await expect(page.getByRole('link', { name: 'Needs attention 6', exact: true })).toBeVisible();
});
