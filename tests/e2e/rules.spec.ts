import { expect, test, type Page } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

function tab(page: Page, label: string) {
  return page.locator('.directory-tab', { hasText: label });
}

test.describe('reading the rules', () => {
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
    await connectBackend(page, backend.baseUrl);
  });

  test('Rules acceptance 1: eight rules, the tab counts, and the first row', async ({ page }) => {
    await page.goto('/rules');

    await expect(tab(page, 'All rules')).toContainText('8');
    await expect(tab(page, 'Active')).toContainText('3');
    await expect(tab(page, 'Paused')).toContainText('5');

    const first = page.getByRole('row').nth(1);

    await expect(
      first.getByRole('link', { name: 'New orders reach the warehouse', exact: true }),
    ).toBeVisible();
    await expect(first).toContainText('Order');
    await expect(first).toContainText('Budi Santoso');
    await expect(first).toContainText('Warehouse');
    await expect(first).toContainText('matches / 30 days');
    await expect(first).toContainText('0%');
  });

  test('Rules acceptance 4: a cleared name is refused with the sentence under the field', async ({
    page,
  }) => {
    await page.goto('/rules/new');

    const drawer = page.getByRole('dialog');

    await drawer.getByLabel('Rule name', { exact: true }).fill('');
    await drawer.getByRole('button', { name: 'Save rule', exact: true }).click();

    await expect(
      drawer.getByText('Enter a rule name and condition.', { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/rules\/new$/);
  });

  test('Rules acceptance 5: the impact preview for rule 1 reads 64', async ({ page }) => {
    await page.goto('/rules');
    await page.getByRole('link', { name: 'New orders reach the warehouse', exact: true }).click();

    const drawer = page.getByRole('dialog');

    await expect(drawer.locator('.drawer-impact-value strong')).toHaveText('64');
    await expect(
      drawer.getByText('matching updates from the last 30 days', { exact: false }),
    ).toBeVisible();
  });
});

test.describe('changing a rule', () => {
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

  test('Rules acceptance 2: the toggle shows Active at once and moves the counts', async ({
    page,
  }) => {
    await page.goto('/rules');

    await page.getByRole('switch', { name: 'Activate Low stock, prepare the next step' }).click();

    await expect(
      page.getByRole('switch', { name: 'Pause Low stock, prepare the next step' }),
    ).toHaveAttribute('aria-checked', 'true');
    await expect(tab(page, 'Active')).toContainText('4');
    await expect(tab(page, 'Paused')).toContainText('4');
  });

  test('Rules acceptance 3: a server failure flips the toggle back and says so', async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/rules\/[^/]+$/, (route) =>
      route.fulfill({
        status: 500,
        json: {
          error: {
            code: 'E-INTERNAL',
            message: 'Something went wrong',
            requestId: 'browser-test',
            details: [],
          },
        },
      }),
    );
    await page.goto('/rules');

    await page.getByRole('switch', { name: 'Activate Low stock, prepare the next step' }).click();

    await expect(page.getByRole('status')).toHaveText('Your changes were not saved. Try again.');
    await expect(
      page.getByRole('switch', { name: 'Activate Low stock, prepare the next step' }),
    ).toHaveAttribute('aria-checked', 'false');
    await expect(tab(page, 'Active')).toContainText('3');
    await expect(tab(page, 'Paused')).toContainText('5');
  });

  test('Rules acceptance 6: a new rule in Returns is saved and listed', async ({ page }) => {
    await page.goto('/rules/new');

    const drawer = page.getByRole('dialog');

    await drawer.locator('select[name="categoryId"]').selectOption({ label: 'Returns' });
    await drawer.getByRole('button', { name: 'Save rule', exact: true }).click();

    await expect(page.getByRole('status')).toHaveText('Rule saved.');
    await expect(page).toHaveURL(/\/rules$/);
    await expect(page.locator('.directory-table tbody tr')).toHaveCount(9);
    await expect(tab(page, 'Paused')).toContainText('5');
  });

  test('The rule drawer has an Event select under Category and saves eventType', async ({
    page,
  }) => {
    await page.goto('/rules/new');

    const drawer = page.getByRole('dialog');
    const category = drawer.locator('select[name="categoryId"]');
    const event = drawer.locator('select[name="eventType"]');

    const under = await category.evaluate(
      (node, other) => (node.compareDocumentPosition(other) & 4) !== 0,
      await event.elementHandle(),
    );

    expect(under).toBe(true);
    await event.selectOption({ label: 'Blocked' });
    await drawer.getByRole('button', { name: 'Save rule', exact: true }).click();
    await expect(page.getByText('Rule saved.', { exact: true })).toBeVisible();

    const response = await page.request.get(`${backend?.baseUrl}/api/v1/rules`);
    const body = (await response.json()) as { data: { name: string; eventType: string }[] };

    expect(body.data.find((rule) => rule.name === 'Order, notify the owner')?.eventType).toBe(
      'blocker',
    );
  });
});
