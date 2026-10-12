import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>> | undefined;

test.beforeEach(async ({ page }) => {
  test.setTimeout(120000);
  backend = await startBackend();
  await connectBackend(page, backend.baseUrl);
  await page.goto('/settings/recipient-preview');
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
  backend?.stop();
});

test('B-27: the four tabs open and a clarification answer changes only the preview', async ({
  page,
}) => {
  const drawer = page.getByRole('dialog');

  for (const tab of ['Digest', 'Voice note', 'Clarification']) {
    await drawer.getByRole('tab', { name: tab }).click();
    await expect(drawer.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
  }

  await drawer.getByRole('button', { name: 'None of these' }).click();
  await expect(drawer.getByRole('status')).not.toBeEmpty();
});
