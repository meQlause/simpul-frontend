import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>> | undefined;

test.beforeEach(async ({ page }) => {
  test.setTimeout(120000);
  backend = await startBackend();
  await connectBackend(page, backend.baseUrl);
  await page.goto('/settings/onboarding');
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
  backend?.stop();
});

test('B-25: the four steps are walked forward and back', async ({ page }) => {
  const drawer = page.getByRole('dialog');

  await expect(drawer.getByRole('heading', { name: /Step 1 of 4/ })).toBeVisible();
  await drawer.locator('select').evaluateAll((selects) => {
    selects.forEach((select) => {
      const field = select.closest('label')?.textContent ?? '';
      const option = [...(select as HTMLSelectElement).options].find(
        (entry) => entry.value && !field.startsWith(entry.textContent ?? '#'),
      );

      (select as HTMLSelectElement).value = option?.value ?? '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  for (const step of [2, 3, 4]) {
    await drawer.getByRole('button', { name: 'Continue' }).click();
    await expect(
      drawer.getByRole('heading', { name: new RegExp(`Step ${step} of 4`) }),
    ).toBeVisible();
  }

  await drawer.getByRole('button', { name: 'Back' }).click();
  await expect(drawer.getByRole('heading', { name: /Step 3 of 4/ })).toBeVisible();
});
