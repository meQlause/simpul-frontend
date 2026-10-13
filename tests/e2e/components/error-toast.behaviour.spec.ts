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

test('ErrorToast: a failed save is a toast inside the drawer, without a code, until dismissed', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/people');
  await page.getByRole('button', { name: 'Budi Santoso', exact: true }).click();
  await page.route('**/api/v1/people/*', (route) =>
    route.request().method() === 'PATCH'
      ? route.fulfill({
          status: 500,
          json: { error: { code: 'E-INTERNAL', message: '', details: [], requestId: 'toast' } },
        })
      : route.fallback(),
  );
  const drawer = page.getByRole('dialog');

  await drawer.getByRole('button', { name: 'Save role', exact: true }).click();
  const toast = drawer.getByRole('alert').filter({ hasText: 'Your changes were not saved.' });

  await expect(toast).toBeVisible();
  await expect(toast).not.toContainText('E-');
  // An ordinary toast would be gone after 4.8 s; this one waits for the admin.
  await page.clock.fastForward(5000);
  await expect(toast).toBeVisible();
  await toast.getByRole('button', { name: 'Dismiss' }).click();
  await expect(toast).toHaveCount(0);
  await expect(drawer).toBeVisible();
});

test("ErrorToast: a field's own error stays on the field and sends nothing", async ({ page }) => {
  let sent = 0;

  await page.route('**/api/v1/telegram/connections/verify', (route) => {
    sent += 1;

    return route.fallback();
  });
  await page.goto('/channels/connection');
  const drawer = page.getByRole('dialog');

  await drawer.getByRole('button', { name: 'Verify', exact: true }).click();
  const token = drawer.getByLabel('Replacement bot token');

  await expect(token).toHaveAttribute('aria-invalid', 'true');
  await expect(token).toBeFocused();
  await expect(drawer.getByText('Enter the bot token.')).toBeVisible();
  await expect(page.locator('[data-component="ErrorToast"]')).toHaveCount(0);
  expect(sent).toBe(0);
});

test('ErrorToast: a failure inside a popup shows in that popup and can be dismissed', async ({
  page,
}) => {
  await page.goto('/channels');
  await page.route(/\/channels\/[^/]+\/pause$/, (route) =>
    route.fulfill({
      status: 409,
      json: {
        error: {
          code: 'E-TG-VERSION-CONFLICT',
          message: 'This configuration was changed. Reload before saving.',
          details: [],
          requestId: 'toast',
        },
      },
    }),
  );
  await page.getByRole('button', { name: 'Pause Operations', exact: true }).click();
  const popup = page.getByRole('dialog', { name: 'Pause Operations?' });

  await popup.getByRole('button', { name: 'Pause group', exact: true }).click();
  const toast = popup.getByRole('alert');

  await expect(toast).toHaveText('This configuration was changed. Reload before saving.');
  await toast.getByRole('button', { name: 'Dismiss' }).click();
  await expect(toast).toHaveCount(0);
  await expect(popup).toBeVisible();
});
