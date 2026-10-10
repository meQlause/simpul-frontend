import { expect, test } from '@playwright/test';

test('In the offline state every form control and the export button are disabled (FR-UI-08)', async ({
  page,
  context,
}) => {
  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill({ json: { data: {} } });
  });
  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Search all work' });
  const download = page.getByRole('button', { name: 'Download summary' });
  await expect(search).toBeEnabled();
  await expect(download).toBeEnabled();

  await context.setOffline(true);
  await expect(page.getByRole('status')).toHaveAttribute('data-variant', 'offline');
  const controls = page.locator('input, select, textarea, button[data-action="export"]');
  expect(await controls.count()).toBeGreaterThan(0);
  for (const control of await controls.all()) {
    await expect(control).toBeDisabled();
  }

  await context.setOffline(false);
  await expect(search).toBeEnabled();
  await expect(download).toBeEnabled();
});
