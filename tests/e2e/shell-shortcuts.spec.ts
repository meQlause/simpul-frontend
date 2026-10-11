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

for (const path of [
  '/',
  '/work',
  '/queue',
  '/rules',
  '/people',
  '/channels',
  '/audit',
  '/settings',
]) {
  test(`Shell acceptance 3: Ctrl K focuses the search field on ${path}`, async ({ page }) => {
    await connectBackend(page, backend.baseUrl);
    await page.goto(path);
    const search = page.getByRole('searchbox', { name: 'Search all work', exact: true });

    await expect(search).toBeEnabled();
    await page.keyboard.press('Control+k');
    await expect(search).toBeFocused();
  });
}
