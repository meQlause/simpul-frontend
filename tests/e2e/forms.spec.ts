import { expect, test, type Locator, type Page } from '@playwright/test';
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
  await connectBackend(page, backend.baseUrl);
});

// FR-UI-16: the sentence sits under its field, the field is invalid and focused, no toast.
async function expectFieldError(page: Page, field: Locator, sentence: RegExp | string) {
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(field).toBeFocused();
  const described = await field.getAttribute('aria-describedby');
  const error = page.locator(
    (described ?? '')
      .split(' ')
      .map((id) => `#${id}`)
      .join(', ') || '#none',
  );

  await expect(error.filter({ hasText: sentence }).first()).toBeVisible();
  await expect(page.locator('.toast.visible, [role="status"].toast')).toHaveCount(0);
}

test('Rule form: a missing name shows under Rule name', async ({ page }) => {
  await page.goto('/rules/new');
  const drawer = page.getByRole('dialog');

  await drawer.locator('[name="name"]').fill('');
  await drawer.getByRole('button', { name: 'Save rule', exact: true }).click();
  await expectFieldError(page, drawer.locator('[name="name"]'), /.+/);
});

test('Category form: a missing description shows under Description', async ({ page }) => {
  await page.goto('/settings/vocabulary');
  const drawer = page.getByRole('dialog');

  await drawer.getByLabel('Category name', { exact: true }).fill('Procurement');
  await drawer.getByLabel('ID prefix', { exact: true }).fill('PRC');
  await drawer.getByLabel('Example message', { exact: true }).fill('Please order two cases.');
  await drawer.getByRole('button', { name: 'Save category', exact: true }).click();
  await expectFieldError(page, drawer.getByLabel('Description', { exact: true }), /.+/);
});

test('Alias form: a missing alias shows under Name or alias', async ({ page }) => {
  await page.goto('/settings/vocabulary');
  await page.getByRole('tab', { name: 'Aliases', exact: true }).click();
  await page.getByRole('button', { name: 'Save alias', exact: true }).click();
  await expectFieldError(page, page.getByLabel('Name or alias', { exact: true }), /.+/);
});

test('Template form: a forbidden field shows under Template', async ({ page }) => {
  await page.goto('/settings/vocabulary');
  await page.getByRole('tab', { name: 'Templates', exact: true }).click();
  await page.getByLabel('Template', { exact: true }).fill('{{cost}}');
  await page.getByRole('button', { name: 'Save template', exact: true }).click();
  await expectFieldError(
    page,
    page.getByLabel('Template', { exact: true }),
    'Use only work_id, customer and summary template fields.',
  );
});

test('Close work form: a short reason shows under Closure reason', async ({ page }) => {
  await page.goto('/work/ORD-0098');
  await page.getByRole('button', { name: 'Close work', exact: true }).click();
  const popup = page.getByRole('dialog', { name: 'Close work', exact: true });

  await popup.getByLabel('Closure reason').fill('ok');
  await popup.getByRole('button', { name: 'Close work', exact: true }).click();
  await expectFieldError(page, popup.getByLabel('Closure reason'), /5 characters/);
});

test('Mapping form: a refused link shows under Team member', async ({ page }) => {
  await page.route('**/api/v1/review-items/**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fallback();

      return;
    }

    await route.fulfill({
      status: 422,
      json: {
        error: {
          code: 'E-VALIDATION',
          message: 'Choose a person who is in this workspace.',
          details: [],
          requestId: 'forms',
        },
      },
    });
  });
  await page.goto('/queue');
  const row = page.getByRole('row').filter({ hasText: 'Who does “Pak Bud” refer to?' });

  await row.getByRole('link', { name: 'Link name', exact: true }).click();
  const drawer = page.getByRole('dialog');

  await drawer.getByRole('button', { name: 'Save mapping', exact: true }).click();
  await expectFieldError(
    page,
    drawer.getByLabel('Team member'),
    'Choose a person who is in this workspace.',
  );
});

test('Person form: a cleared role shows under Role', async ({ page }) => {
  await page.goto('/people');
  await page.getByRole('button', { name: 'Budi Santoso', exact: true }).click();
  const drawer = page.getByRole('dialog');

  await drawer.getByLabel('Role', { exact: true }).fill('');
  await drawer.getByRole('button', { name: 'Save role', exact: true }).click();
  await expectFieldError(
    page,
    drawer.getByLabel('Role', { exact: true }),
    'Enter a role name first.',
  );
});

test('Settings form: equal quiet hours show under Quiet hours end', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('Quiet hours start', { exact: true }).fill('21:00');
  await page.getByLabel('Quiet hours end', { exact: true }).fill('21:00');
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expectFieldError(
    page,
    page.getByLabel('Quiet hours end', { exact: true }),
    'Choose different start and end times.',
  );
});

test('Mail form: a refused port shows under Port', async ({ page }) => {
  await page.route('**/api/v1/settings/mail', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fallback();

      return;
    }

    await route.fulfill({
      status: 422,
      json: {
        error: {
          code: 'E-VALIDATION',
          message: 'Enter a port between 1 and 65535.',
          details: [{ field: 'port', issue: 'out_of_range' }],
          requestId: 'forms',
        },
      },
    });
  });
  await page.goto('/settings/mail');
  await page.getByLabel('Mail server host', { exact: true }).fill('smtp.pointstar.example');
  await page.getByLabel('Port', { exact: true }).fill('587');
  await page.getByLabel('Username', { exact: true }).fill('simpul@pointstar.example');
  await page.getByLabel('Password', { exact: true }).fill('mail-secret-123');
  await page.getByLabel('Sender address', { exact: true }).fill('simpul@pointstar.example');
  await page.getByRole('button', { name: 'Save mail server', exact: true }).click();
  await expectFieldError(page, page.locator('[name="port"]'), 'Enter a port between 1 and 65535.');
});
