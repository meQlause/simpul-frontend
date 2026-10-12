import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>> | undefined;

test.beforeEach(async ({ page }) => {
  test.setTimeout(120000);
  backend = await startBackend();
  await connectBackend(page, backend.baseUrl);
  await page.goto('/queue');
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
  backend?.stop();
});

test('B-11: a tab and the search narrow the list, and both are in the URL', async ({ page }) => {
  await page.getByRole('button', { name: /^Names/ }).click();
  await expect(page).toHaveURL(/kind=alias/);
  await expect(page.locator('tbody tr[data-directory-row]')).toHaveCount(2);
  await page.getByLabel('Search updates or channels…').fill('Rin');
  await expect(page).toHaveURL(/q=Rin/);
  await expect(page.locator('tbody tr[data-directory-row]')).toHaveCount(1);
});

test('B-12: a name is linked from its review, and a routing gap opens a new rule', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Who does “Pak Bud” refer to?' }).click();
  const drawer = page.getByRole('dialog');

  await expect(drawer.getByText('One missing connection.')).toBeVisible();
  await drawer.getByRole('link', { name: /Link name/ }).click();
  await expect(drawer.getByLabel('Team member')).toBeVisible();
  await drawer.getByRole('button', { name: 'Save mapping' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '“Bu Rin” is not recognized' })).toBeVisible();
  await page
    .getByRole('row')
    .filter({ hasText: 'Returns need a routing rule' })
    .getByRole('link', { name: /Create rule/ })
    .click();
  await expect(page).toHaveURL(/\/rules\/new\?reviewItemId=/);
});
