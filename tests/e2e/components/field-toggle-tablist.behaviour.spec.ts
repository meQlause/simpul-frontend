import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  test.setTimeout(120000);
  backend = await startBackend();
});
test.afterAll(() => backend?.stop());
test.beforeEach(async ({ page }) => {
  await connectBackend(page, backend.baseUrl);
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});

test('Field: invalid is announced on the field; a saved identity is read-only', async ({
  page,
}) => {
  await page.goto('/rules/new');
  const name = page.getByRole('dialog').locator('input[name="name"]');

  await name.fill('');
  await page.getByRole('dialog').getByRole('button', { name: 'Save rule' }).click();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await page.goto('/channels');
  await page.getByRole('button', { name: 'Configure Operations' }).click();
  await expect(page.getByLabel('Telegram Chat ID', { exact: true })).toHaveAttribute(
    'readonly',
    '',
  );
});

test('Toggle: Space flips it, its state is aria-checked', async ({ page }) => {
  await page.goto('/rules');
  const toggle = page.getByRole('switch').first();
  const before = (await toggle.getAttribute('aria-checked')) ?? '';

  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('switch').first()).not.toHaveAttribute('aria-checked', before);
});

test('TabList: one tab is selected and a click moves the selection', async ({ page }) => {
  await page.goto('/settings/vocabulary');
  const drawer = page.getByRole('dialog');

  await expect(drawer.getByRole('tab', { selected: true })).toHaveCount(1);
  await drawer.getByRole('tab', { name: 'Aliases' }).click();
  await expect(drawer.getByRole('tab', { name: 'Aliases' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});
