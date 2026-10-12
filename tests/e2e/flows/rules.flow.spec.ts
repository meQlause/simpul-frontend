import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>> | undefined;

test.beforeEach(async ({ page }) => {
  test.setTimeout(120000);
  backend = await startBackend();
  await connectBackend(page, backend.baseUrl);
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
  backend?.stop();
});

const LOW_STOCK = 'Low stock, prepare the next step';

test('B-13: a rule is paused and resumed at once, and a refused change rolls back', async ({
  page,
}) => {
  await page.goto('/rules');
  const resume = page.getByRole('switch', { name: `Activate ${LOW_STOCK}` });

  await resume.click();
  const pause = page.getByRole('switch', { name: `Pause ${LOW_STOCK}` });

  await expect(pause).toHaveAttribute('aria-checked', 'true');
  await page.route(/\/api\/v1\/rules\/[^/]+$/, (route) =>
    route.fulfill({
      status: 500,
      json: { error: { code: 'E-INTERNAL', message: 'x', requestId: 'flow', details: [] } },
    }),
  );
  await pause.click();
  await expect(page.getByRole('switch', { name: `Pause ${LOW_STOCK}` })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByText('Your changes were not saved. Try again.')).toBeVisible();
});

test('B-14: an edited rule shows its impact, saves, and a new rule is listed', async ({ page }) => {
  await page.goto('/rules');
  await page.getByRole('link', { name: 'New orders reach the warehouse', exact: true }).click();
  const drawer = page.getByRole('dialog');

  await expect(drawer.locator('.drawer-impact-value strong')).toHaveText('64');
  await drawer.getByLabel('Rule name', { exact: true }).fill('Warehouse gets every new order');
  await drawer.getByRole('button', { name: 'Save rule', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Warehouse gets every new order', exact: true }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Create rule' }).click();
  await drawer.getByLabel('Rule name', { exact: true }).fill('A brand new rule');
  await drawer.getByRole('button', { name: 'Save rule', exact: true }).click();
  await expect(page.getByRole('link', { name: 'A brand new rule', exact: true })).toBeVisible();
});
