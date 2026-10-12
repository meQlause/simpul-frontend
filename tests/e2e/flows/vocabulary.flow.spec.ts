import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>> | undefined;

test.beforeEach(async ({ page }) => {
  test.setTimeout(120000);
  backend = await startBackend();
  await connectBackend(page, backend.baseUrl);
  await page.goto('/settings/vocabulary');
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
  backend?.stop();
});

test('B-26: the three tabs open, each keeps its own save action', async ({ page }) => {
  const drawer = page.getByRole('dialog');

  for (const [tab, action] of [
    ['Categories', 'Save category'],
    ['Aliases', 'Save alias'],
    ['Templates', 'Save template'],
  ]) {
    await drawer.getByRole('tab', { name: tab }).click();
    await expect(drawer.getByRole('button', { name: action })).toBeVisible();
  }
});
