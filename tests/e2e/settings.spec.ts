import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  backend = await startBackend();
});
test.afterAll(() => {
  backend?.stop();
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});
test.beforeEach(async ({ page }) => {
  await connectBackend(page, backend.baseUrl);
  await page.goto('/settings');
});

test('Settings acceptance 1: the seeded form shows 21:00, 07:00, 6 and 08:30', async ({ page }) => {
  for (const [label, value] of [
    ['Quiet hours start', '21:00'],
    ['Quiet hours end', '07:00'],
    ['Notifications per person / hour', '6'],
    ['Daily digest', '08:30'],
  ]) {
    await expect(page.getByLabel(label, { exact: true })).toHaveValue(value);
  }

  await expect(
    page.getByText('Applies to Point Star · WIB (UTC+7)', { exact: true }),
  ).toBeVisible();
});

test('Settings acceptance 2 and 4: equal hours and a zero limit submit nothing', async ({
  page,
}) => {
  let writes = 0;

  page.on('request', (request) => {
    if (request.method() === 'PUT') {
      writes += 1;
    }
  });
  const end = page.getByLabel('Quiet hours end', { exact: true });

  await end.fill('21:00');
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(
    page.getByText('Choose different start and end times.', { exact: true }),
  ).toBeVisible();
  await expect(end).toHaveAttribute('aria-invalid', 'true');
  await expect(end).toBeFocused();
  await end.fill('07:00');
  const budget = page.getByLabel('Notifications per person / hour', { exact: true });

  await budget.fill('0');
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(budget).toBeFocused();
  expect(writes).toBe(0);
});

test('Settings acceptance 3: a saved limit survives reload and appears in Budi’s delivery', async ({
  page,
}) => {
  await page.getByLabel('Notifications per person / hour', { exact: true }).fill('8');
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Workspace settings saved.');
  await page.reload();
  await expect(page.getByLabel('Notifications per person / hour', { exact: true })).toHaveValue(
    '8',
  );
  await page.getByRole('link', { name: 'People & structure', exact: true }).click();
  await page.getByRole('button', { name: 'Budi Santoso', exact: true }).click();
  await expect(
    page.getByRole('dialog').getByText('8 notifications per person / hour', { exact: true }),
  ).toBeVisible();
});

test('Settings acceptance 5: offline disables every field and Save settings', async ({
  page,
  context,
}) => {
  await expect(page.getByLabel('Daily digest', { exact: true })).toBeVisible();
  await context.setOffline(true);

  for (const label of [
    'Quiet hours start',
    'Quiet hours end',
    'Notifications per person / hour',
    'Daily digest',
  ]) {
    await expect(page.getByLabel(label, { exact: true })).toBeDisabled();
  }

  await expect(page.getByRole('button', { name: 'Save settings', exact: true })).toBeDisabled();
});
