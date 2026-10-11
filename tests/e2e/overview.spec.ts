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
  await page.clock.install({ time: new Date('2026-10-10T04:01:00Z') });
  await connectBackend(page, backend.baseUrl);
  await page.goto('/');
});

test('Home acceptance 1–2: today and seven-day figures come from the real API', async ({
  page,
}) => {
  const stats = page.getByTestId('home-stats');

  for (const count of ['1,284', '48', '156', '7']) {
    await expect(stats.getByText(count, { exact: true })).toBeVisible();
  }

  for (const text of ['↗ 12.8%', '12 completed today', '3 areas you can improve']) {
    await expect(stats.getByText(text, { exact: true })).toBeVisible();
  }

  await page.getByRole('button', { name: 'Last 7 days', exact: true }).click();
  await expect(page).toHaveURL(/period=week/);

  for (const count of ['8,426', '124', '984']) {
    await expect(stats.getByText(count, { exact: true })).toBeVisible();
  }
});

test('Home acceptance 3 and 6: attention counts link to the filtered queue', async ({ page }) => {
  for (const text of [
    '04 No matching rule',
    '02 Names need clarification',
    '01 Suggested category',
  ]) {
    await expect(page.getByRole('link', { name: text, exact: true })).toBeVisible();
  }

  await page.getByRole('link', { name: '02 Names need clarification', exact: true }).click();
  await expect(page).toHaveURL('/queue?kind=alias');
  await expect(page.getByRole('row')).toHaveCount(3);
});

test('Home acceptance 4–5: recent work shows five items and a local stalled filter', async ({
  page,
}) => {
  const recent = page.getByTestId('recent-work');

  await expect(recent.getByRole('row')).toHaveCount(6);
  await expect(recent.getByText('5 of 48 work items', { exact: true })).toBeVisible();
  await recent.getByLabel('Filter work status', { exact: true }).selectOption('stalled');
  await expect(recent.getByRole('row')).toHaveCount(2);
  await expect(recent.getByRole('link', { name: 'ORD-0091', exact: true })).toBeVisible();
  await expect(recent.getByText('No update for 19 hours', { exact: true })).toBeVisible();
});

test('Home acceptance 7: Download summary is disabled offline', async ({ page, context }) => {
  const download = page.getByRole('button', { name: 'Download summary', exact: true });

  await expect(download).toBeEnabled();
  await context.setOffline(true);
  await expect(download).toBeDisabled();
});
