import { expect, test, type Page } from '@playwright/test';

const SETUP_REQUIRED = {
  error: {
    code: 'E-DB-SETUP-REQUIRED',
    message: '',
    details: [],
    requestId: 'database-setup',
  },
};

type Options = { put?: (body: unknown) => Promise<{ status: number; json: unknown }> };

// A pending own-database workspace: every admin endpoint but /database answers E-DB-SETUP-REQUIRED.
async function pendingWorkspace(page: Page, options: Options = {}) {
  const writes: unknown[] = [];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path.endsWith('/database') && request.method() === 'GET') {
      await route.fulfill({ json: { data: { mode: 'own', status: 'pending' } } });
    } else if (path.endsWith('/database') && request.method() === 'PUT') {
      writes.push(request.postDataJSON());
      const answer = (await options.put?.(request.postDataJSON())) ?? {
        status: 200,
        json: { data: { mode: 'own', status: 'connected', host: 'db.pointstar.example' } },
      };

      await route.fulfill({ status: answer.status, json: answer.json });
    } else if (path.endsWith('/me')) {
      await route.fulfill({ status: 409, json: SETUP_REQUIRED });
    } else {
      await route.fulfill({ status: 409, json: SETUP_REQUIRED });
    }
  });

  return writes;
}

const STRING = 'postgres://simpul:secret-pass@db.pointstar.example:5432/simpul?sslmode=require';

test('Database setup acceptance 1: any page lands on setup, without a sidebar, notice before field', async ({
  page,
}) => {
  await pendingWorkspace(page);
  await page.goto('/work');

  await expect(page).toHaveURL(/\/setup\/database$/);
  await expect(page.locator('.sidebar')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Connect your database.' })).toBeVisible();
  const before = await page.evaluate(() => {
    const notice = document.querySelector('[data-component="Notice"]');
    const field = document.querySelector('input[name="connectionString"]');

    return Boolean(
      notice && field && notice.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  expect(before).toBe(true);
});

test('Database setup acceptance 2: an unticked notice shows its message and sends nothing', async ({
  page,
}) => {
  const writes = await pendingWorkspace(page);

  await page.goto('/setup/database');
  await page.getByLabel('Connection string', { exact: true }).fill(STRING);
  await page.getByRole('button', { name: 'Connect database', exact: true }).click();

  await expect(page.getByText('Confirm the notice before connecting.')).toBeVisible();
  expect(writes).toHaveLength(0);
});

test('Database setup acceptance 3: a failed check shows its sentence, empties and focuses the field, keeps the box', async ({
  page,
}) => {
  await pendingWorkspace(page, {
    put: async () => ({
      status: 422,
      json: {
        error: { code: 'E-DB-VECTOR-MISSING', message: '', details: [], requestId: 'setup' },
      },
    }),
  });
  await page.goto('/setup/database');
  await page.getByLabel('I understand that data availability is our responsibility.').check();
  await page.getByLabel('Connection string', { exact: true }).fill(STRING);
  await page.getByRole('button', { name: 'Connect database', exact: true }).click();

  await expect(
    page.getByText(
      'The pgvector extension is not available on this server. Install it and try again. Nothing was saved.',
    ),
  ).toBeVisible();
  await expect(page.getByLabel('Connection string', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Connection string', { exact: true })).toBeFocused();
  await expect(
    page.getByLabel('I understand that data availability is our responsibility.'),
  ).toBeChecked();
});

test('Database setup acceptance 4: connecting disables the button with its label, then opens /', async ({
  page,
}) => {
  await pendingWorkspace(page, {
    put: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));

      return {
        status: 200,
        json: { data: { mode: 'own', status: 'connected', host: 'db.pointstar.example' } },
      };
    },
  });
  await page.goto('/setup/database');
  await page.getByLabel('I understand that data availability is our responsibility.').check();
  await page.getByLabel('Connection string', { exact: true }).fill(STRING);
  const button = page.getByRole('button', { name: 'Connect database', exact: true });

  await button.click();
  await expect(button).toBeDisabled();
  await expect(button).toHaveText('Connect database');
  await expect(
    page.getByText('Preparing your database. This can take up to a minute.'),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});
