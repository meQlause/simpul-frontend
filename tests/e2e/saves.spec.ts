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

type Form = {
  name: string;
  label: string;
  open: (page: Page) => Promise<void>;
  button: (page: Page) => Locator;
  kept: (page: Page) => Locator;
  keptValue: string | RegExp;
};

const drawer = (page: Page) => page.getByRole('dialog');
const SENTENCE = 'Your changes were not saved. Try again.';

const forms: Form[] = [
  {
    name: 'Rule',
    label: 'Save rule',
    open: async (page) => {
      await page.goto('/rules/new');
      await drawer(page).locator('[name="name"]').fill('Keep this name');
    },
    button: (page) => drawer(page).getByRole('button', { name: 'Save rule', exact: true }),
    kept: (page) => drawer(page).locator('[name="name"]'),
    keptValue: 'Keep this name',
  },
  {
    name: 'Category',
    label: 'Save category',
    open: async (page) => {
      await page.goto('/settings/vocabulary');
      await drawer(page).getByLabel('Category name', { exact: true }).fill('Procurement');
      await drawer(page).getByLabel('ID prefix', { exact: true }).fill('PRC');
      await drawer(page).getByLabel('Description', { exact: true }).fill('Supplier requests');
      await drawer(page).getByLabel('Example message', { exact: true }).fill('Order two cases.');
    },
    button: (page) => drawer(page).getByRole('button', { name: 'Save category', exact: true }),
    kept: (page) => drawer(page).getByLabel('Category name', { exact: true }),
    keptValue: 'Procurement',
  },
  {
    name: 'Alias',
    label: 'Save alias',
    open: async (page) => {
      await page.goto('/settings/vocabulary');
      await page.getByRole('tab', { name: 'Aliases', exact: true }).click();
      await page.getByLabel('Name or alias', { exact: true }).fill('Bu Rin');
    },
    button: (page) => page.getByRole('button', { name: 'Save alias', exact: true }),
    kept: (page) => page.getByLabel('Name or alias', { exact: true }),
    keptValue: 'Bu Rin',
  },
  {
    name: 'Template',
    label: 'Save template',
    open: async (page) => {
      await page.goto('/settings/vocabulary');
      await page.getByRole('tab', { name: 'Templates', exact: true }).click();
      await page.getByLabel('Template', { exact: true }).fill('{{work_id}} for {{customer}}');
    },
    button: (page) => page.getByRole('button', { name: 'Save template', exact: true }),
    kept: (page) => page.getByLabel('Template', { exact: true }),
    keptValue: '{{work_id}} for {{customer}}',
  },
  {
    name: 'Person',
    label: 'Save role',
    open: async (page) => {
      await page.goto('/people');
      await page.getByRole('button', { name: 'Budi Santoso', exact: true }).click();
      await drawer(page).getByLabel('Role', { exact: true }).fill('Warehouse Supervisor');
    },
    button: (page) => drawer(page).getByRole('button', { name: 'Save role', exact: true }),
    kept: (page) => drawer(page).getByLabel('Role', { exact: true }),
    keptValue: 'Warehouse Supervisor',
  },
  {
    name: 'Settings',
    label: 'Save settings',
    open: async (page) => {
      await page.goto('/settings');
      await page.getByLabel('Notifications per person / hour', { exact: true }).fill('9');
    },
    button: (page) => page.getByRole('button', { name: 'Save settings', exact: true }),
    kept: (page) => page.getByLabel('Notifications per person / hour', { exact: true }),
    keptValue: '9',
  },
  {
    name: 'Mail',
    label: 'Save mail server',
    open: async (page) => {
      await page.goto('/settings/mail');
      await page.getByLabel('Mail server host', { exact: true }).fill('smtp.pointstar.example');
      await page.getByLabel('Port', { exact: true }).fill('587');
      await page.getByLabel('Username', { exact: true }).fill('simpul@pointstar.example');
      await page.getByLabel('Password', { exact: true }).fill('mail-secret-123');
      await page.getByLabel('Sender address', { exact: true }).fill('simpul@pointstar.example');
    },
    button: (page) => drawer(page).getByRole('button', { name: 'Save mail server', exact: true }),
    kept: (page) => drawer(page).getByLabel('Mail server host', { exact: true }),
    keptValue: 'smtp.pointstar.example',
  },
  {
    name: 'Close work',
    label: 'Close work',
    open: async (page) => {
      await page.goto('/work/ORD-0098');
      await page.getByRole('button', { name: 'Close work', exact: true }).click();
      await page
        .getByRole('dialog', { name: 'Close work', exact: true })
        .getByLabel('Closure reason')
        .fill('Customer cancelled the sample order.');
    },
    button: (page) =>
      page
        .getByRole('dialog', { name: 'Close work', exact: true })
        .getByRole('button', { name: 'Close work', exact: true }),
    kept: (page) =>
      page.getByRole('dialog', { name: 'Close work', exact: true }).getByLabel('Closure reason'),
    keptValue: 'Customer cancelled the sample order.',
  },
  {
    name: 'Mapping',
    label: 'Save mapping',
    open: async (page) => {
      await page.goto('/queue');
      const row = page.getByRole('row').filter({ hasText: 'Who does “Pak Bud” refer to?' });

      await row.getByRole('link', { name: 'Link name', exact: true }).click();
    },
    button: (page) => drawer(page).getByRole('button', { name: 'Save mapping', exact: true }),
    kept: (page) => drawer(page).getByLabel('Team member'),
    keptValue: /.+/,
  },
];

// Every write is held for a moment, counted, then answered E-INTERNAL.
async function holdWrites(page: Page, mode: 'error' | 'dropped' = 'error') {
  const writes: string[] = [];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();

    if (request.method() === 'GET') {
      await route.fallback();

      return;
    }

    writes.push(`${request.method()} ${request.url()}`);
    await new Promise((resolve) => setTimeout(resolve, 700));

    if (mode === 'dropped') {
      await route.abort('connectionreset');

      return;
    }

    await route.fulfill({
      status: 500,
      json: { error: { code: 'E-INTERNAL', message: '', details: [], requestId: 'saves' } },
    });
  });

  return writes;
}

for (const form of forms) {
  test(`${form.name} form: while saving the button is disabled, keeps its label and sends one request`, async ({
    page,
  }) => {
    await form.open(page);
    const writes = await holdWrites(page);
    const button = form.button(page);

    await button.click();
    await expect(button).toBeDisabled();
    await expect(button).toHaveText(form.label);
    await button.click({ force: true, noWaitAfter: true }).catch(() => undefined);
    await expect(button).toBeEnabled();
    expect(writes).toHaveLength(1);
  });

  test(`${form.name} form: an E-INTERNAL save says so and keeps what was typed`, async ({
    page,
  }) => {
    await form.open(page);
    await holdWrites(page);
    await form.button(page).click();

    await expect(page.locator('[data-component="ErrorToast"]')).toHaveText(SENTENCE);
    await expect(form.kept(page)).toHaveValue(form.keptValue);
    // A failure is never reported as a success.
    await expect(page.locator('.toast.visible:not(.toast-error)')).toHaveCount(0);
  });

  test(`${form.name} form: a dropped connection says so and keeps what was typed`, async ({
    page,
  }) => {
    await form.open(page);
    await holdWrites(page, 'dropped');
    await form.button(page).click();

    await expect(page.locator('[data-component="ErrorToast"]')).toHaveText(SENTENCE);
    await expect(form.kept(page)).toHaveValue(form.keptValue);
    // A failure is never reported as a success.
    await expect(page.locator('.toast.visible:not(.toast-error)')).toHaveCount(0);
  });
}
