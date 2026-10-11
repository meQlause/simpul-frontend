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

const CONNECTED = {
  mode: 'own',
  status: 'connected',
  host: 'db.pointstar.example',
  port: 5432,
  databaseName: 'simpul',
  schemaVersion: '0007',
  unreachableSince: null,
};
const IDENTITY = {
  person: { name: 'Siti Aminah', roleName: 'Operations Manager' },
  workspace: {
    name: 'Point Star',
    descriptor: 'Operations workspace',
    timezone: 'Asia/Jakarta',
    counts: { members: 4, channels: 3, activeRules: 3 },
  },
};
const SETTINGS = {
  quietStart: '21:00',
  quietEnd: '07:00',
  budgetPerHour: 6,
  digestTime: '08:30',
  holdSeconds: 60,
  timezone: 'Asia/Jakarta',
};

// A connected own-database workspace with the Settings page's own data.
type Answer = { status: number; json: unknown };

async function connectedWorkspace(page: Page, put?: () => Answer, hosted = false) {
  const pages: Record<string, unknown> = {
    '/me': IDENTITY,
    '/settings': SETTINGS,
    '/overview': { activeWork: { count: 0 } },
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api/v1', '');

    if (path === '/database') {
      await route.fulfill(databaseAnswer(request.method(), hosted, put));

      return;
    }

    await route.fulfill({
      json: { data: pages[path] ?? [], page: { nextCursor: null, total: 0 } },
    });
  });
}

function databaseAnswer(method: string, hosted: boolean, put?: () => Answer) {
  if (hosted) {
    return {
      status: 404,
      json: { error: { code: 'E-NOT-FOUND', message: '', details: [], requestId: 'hosted' } },
    };
  }

  if (method === 'PUT') {
    return put?.() ?? { status: 200, json: { data: CONNECTED } };
  }

  return { status: 200, json: { data: CONNECTED } };
}

test('Database setup acceptance 5: the drawer shows host, port, name and status, never the string', async ({
  page,
}) => {
  await connectedWorkspace(page);
  await page.goto('/settings/database');
  const drawer = page.getByRole('dialog');

  for (const text of ['db.pointstar.example', '5432', 'simpul', 'Connected']) {
    await expect(drawer.getByText(text, { exact: true }).first()).toBeVisible();
  }

  await drawer.getByLabel('Connection string', { exact: true }).fill(STRING);
  await drawer.getByRole('button', { name: 'Update connection', exact: true }).click();
  await expect(drawer.getByText('Database connection updated.')).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.stringify([{ ...localStorage }, { ...sessionStorage }]),
  );
  const html = await page.content();

  for (const secret of [STRING, 'secret-pass']) {
    expect(html).not.toContain(secret);
    expect(stored).not.toContain(secret);
  }
});

test('Database setup acceptance 6: a refused replacement shows its sentence and keeps the old host', async ({
  page,
}) => {
  await connectedWorkspace(page, () => ({
    status: 422,
    json: {
      error: { code: 'E-DB-WORKSPACE-MISMATCH', message: '', details: [], requestId: 'swap' },
    },
  }));
  await page.goto('/settings/database');
  const drawer = page.getByRole('dialog');

  await drawer.getByLabel('Connection string', { exact: true }).fill(STRING);
  await drawer.getByRole('button', { name: 'Update connection', exact: true }).click();

  await expect(
    drawer.getByText(
      'This database does not contain this workspace’s data. The connection was not changed.',
    ),
  ).toBeVisible();
  await expect(drawer.getByText('db.pointstar.example', { exact: true }).first()).toBeVisible();
  await expect(drawer.getByLabel('Connection string', { exact: true })).toHaveValue('');
});

test('Database setup: the drawer lists a callout on Settings, and a successful update toasts', async ({
  page,
}) => {
  await connectedWorkspace(page);
  await page.goto('/settings');
  await page
    .locator('[data-component="Callout"]')
    .filter({ hasText: 'Where this workspace’s data is stored.' })
    .getByRole('link')
    .click();
  const drawer = page.getByRole('dialog');

  await drawer.getByLabel('Connection string', { exact: true }).fill(STRING);
  await drawer.getByRole('button', { name: 'Update connection', exact: true }).click();
  await expect(drawer.getByText('Database connection updated.')).toBeVisible();
});
