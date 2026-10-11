import { expect, test, type Page } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

function tab(page: Page, label: string) {
  return page.locator('.directory-tab', { hasText: label });
}

test.describe('reading the decisions', () => {
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

  test('Audit acceptance 1: five rows at their times, with the tab counts', async ({ page }) => {
    await page.goto('/audit');

    await expect(page.getByRole('row')).toHaveCount(6);

    for (const time of ['10:50', '10:24', '10:01', '09:43', '08:30']) {
      await expect(page.locator('.audit-time', { hasText: time })).toBeVisible();
    }

    await expect(tab(page, 'All decisions')).toContainText('5');
    await expect(tab(page, 'Routed')).toContainText('2');
    await expect(tab(page, 'Held')).toContainText('1');
    await expect(tab(page, 'Work updates')).toContainText('1');
    await expect(tab(page, 'Digests')).toContainText('1');
  });

  test('Audit acceptance 2: Held lists the returns gap with no delivery', async ({ page }) => {
    await page.goto('/audit');

    await tab(page, 'Held').click();

    await expect(page.getByRole('row')).toHaveCount(2);
    const row = page.getByRole('row').filter({ hasText: 'Return request queued' });

    await expect(row).toContainText('No delivery');
  });

  test('Audit acceptance 3: the trace of the Budi routing shows its headline, rule and recipient', async ({
    page,
  }) => {
    await page.goto('/audit');
    await page.getByRole('link', { name: 'ORD-0098 routed to Budi Santoso', exact: true }).click();

    const drawer = page.getByRole('dialog');

    await expect(
      drawer.getByText('The right update reached the right person.', { exact: true }),
    ).toBeVisible();
    await expect(drawer.getByText('New orders reach the warehouse', { exact: true })).toBeVisible();
    await expect(drawer.getByText('Currently active', { exact: true })).toBeVisible();
    await expect(drawer.getByText('Budi Santoso', { exact: true }).first()).toBeVisible();
  });

  test('Audit acceptance 5: on the first trace the previous arrow is disabled and the counter reads 1 / 5', async ({
    page,
  }) => {
    await page.goto('/audit');
    await page.getByRole('link', { name: 'ORD-0098 routed to Budi Santoso', exact: true }).click();

    const drawer = page.getByRole('dialog');

    await expect(
      drawer.getByRole('button', { name: 'Previous decision', exact: true }),
    ).toBeDisabled();
    await expect(drawer.getByText('1 / 5', { exact: true })).toBeVisible();
  });

  test('Audit acceptance 6: a returns trace offers Review gap and shows no rule block', async ({
    page,
  }) => {
    await page.goto('/audit');
    await page.getByRole('link', { name: 'Return request queued', exact: true }).click();

    const drawer = page.getByRole('dialog');

    await expect(drawer.getByRole('link', { name: 'Review gap', exact: true })).toBeVisible();
    await expect(drawer.locator('.trace-policy-box')).toHaveCount(0);
  });
});

test.describe('pausing from a trace', () => {
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

  test('Audit acceptance 4: pausing the rule from its trace shows Currently paused and lists it as paused', async ({
    page,
  }) => {
    await page.goto('/audit');
    await page.getByRole('link', { name: 'ORD-0098 routed to Budi Santoso', exact: true }).click();

    const drawer = page.getByRole('dialog');

    await drawer.getByRole('button', { name: 'Pause this rule', exact: true }).click();

    await expect(drawer.getByText('Currently paused', { exact: true })).toBeVisible();

    await page.goto('/rules');

    await expect(
      page.getByRole('switch', { name: 'Activate New orders reach the warehouse' }),
    ).toHaveAttribute('aria-checked', 'false');
  });
});
