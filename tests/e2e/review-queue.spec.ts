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

  for (const name of [
    /^All updates\s*7$/,
    /^Routing gaps\s*4$/,
    /^Names\s*2$/,
    /^Categories\s*1$/,
  ]) {
    await expect(page.getByRole('button', { name })).toBeVisible();
  }

  await page.getByRole('button', { name: /^Names\s*2$/ }).click();
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

  await expect(drawer.getByText('DETECTED NAME', { exact: true })).toBeVisible();
  await expect(drawer.getByText('Pak Bud', { exact: true })).toBeVisible();
  await expect(drawer.getByLabel('Team member').locator('option:checked')).toHaveText(
    'Budi Santoso',
  );
  await drawer.getByRole('button', { name: 'Save mapping', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('row')).toHaveCount(7);
  await expect(page.getByRole('link', { name: 'Needs attention 6', exact: true })).toBeVisible();
});

test('Needs review acceptance 5: Create rule on a returns gap opens the rule with Returns chosen', async ({
  page,
}) => {
  const row = page.getByRole('row').filter({ hasText: 'Returns need a routing rule' });

  await row.getByRole('link', { name: 'Create rule', exact: true }).click();

  await expect(page).toHaveURL(/\/rules\/new\?reviewItemId=/);
  await expect(
    page.getByRole('dialog').locator('select[name="categoryId"] option:checked'),
  ).toHaveText('Returns');
});
