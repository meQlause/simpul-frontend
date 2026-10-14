import { expect, test, type Page } from '@playwright/test';
import { connectedWorkspace } from './helpers/database';

type Row = Record<string, unknown>;

const MESSAGES = /\/api\/v1\/messages(\?|$)/;
const CORRECT = /\/api\/v1\/messages\/[^/]+\/correct$/;
const WORK = /\/api\/v1\/work(\?|$)/;
const CHANNEL = { id: 'channel-sales', name: 'Sales Group' };
const COUNTS = { created: 1, attached: 1, held: 0, rejected: 1, ignored: 0, pending: 1 };
const ORDER = {
  id: 'cat-order',
  name: 'Order',
  description: null,
  example: null,
  idPrefix: 'ORD',
  prefixInUse: true,
};
const WORK_ITEMS = [
  { displayId: 'ORD-0098', summary: 'Toko Berkah, 12 pcs', status: 'active' },
  { displayId: 'ORD-0091', summary: 'Toko Sari, 4 pcs', status: 'completed' },
];

const outcome = (status: string, reason: string | null) => ({
  key: 'outcome',
  status,
  reason,
  expiresAt: null,
});
const read = { key: 'read', triageClass: 'EVENT' };

const rejected: Row = {
  unitId: 'unit-g3',
  occurredAt: '2026-10-14T03:50:00Z',
  channel: CHANNEL,
  senderName: 'Budi Santoso',
  text: null,
  outcome: 'rejected',
  reason: 'G3',
  work: null,
  correction: null,
  steps: [
    read,
    { key: 'matched', verdict: 'CREATE', decidedBy: 'score', contextMessages: 0, candidates: [] },
    outcome('failed', 'G3'),
  ],
};
const attached: Row = {
  unitId: 'unit-ai',
  occurredAt: '2026-10-14T03:40:00Z',
  channel: CHANNEL,
  senderName: 'Siti Aminah',
  text: null,
  outcome: 'attached',
  reason: null,
  work: { displayId: 'ORD-0091' },
  correction: null,
  steps: [
    read,
    { key: 'matched', verdict: 'ATTACH', decidedBy: 'score', contextMessages: 0, candidates: [] },
    outcome('done', null),
  ],
};
const created: Row = {
  ...rejected,
  unitId: 'unit-created',
  senderName: 'Toko Berkah',
  outcome: 'created',
  reason: null,
  work: { displayId: 'ORD-0102' },
  steps: [read, outcome('done', null)],
};
const pending: Row = {
  ...rejected,
  unitId: 'unit-pending',
  senderName: 'Dewi',
  outcome: 'pending',
  reason: null,
  steps: [read, outcome('pending', null)],
};
const LIST = [rejected, attached, created, pending];

function workItem(item: (typeof WORK_ITEMS)[number]) {
  return {
    ...item,
    customer: null,
    category: 'Order',
    owner: null,
    channel: { id: CHANNEL.id, displayName: CHANNEL.name },
    lastActivityAt: '2026-10-14T03:00:00Z',
  };
}

function correctedRow(body: Record<string, unknown>): Row {
  const attach = body.action === 'attach';
  const workId = attach ? 'ORD-0098' : 'ORD-0110';

  return {
    ...(attach ? attached : rejected),
    outcome: attach ? 'attached' : 'created',
    reason: null,
    work: { displayId: workId },
    correction: {
      workDisplayId: workId,
      action: body.action,
      correctedBy: { name: 'Siti Aminah' },
      correctedAt: '2026-10-14T04:00:00Z',
    },
    steps: [
      read,
      {
        key: 'matched',
        verdict: attach ? 'ATTACH' : 'CREATE',
        decidedBy: 'admin',
        contextMessages: 0,
        candidates: [],
      },
      outcome('done', null),
    ],
  };
}

// Lists GET /messages and the correction POST for the test. The latest route wins, so these
// override connectedWorkspace. After a correction the list returns the corrected row, as the server does.
async function answerLists(page: Page) {
  const corrected: { row: Row | null } = { row: null };
  const requests: Record<string, unknown>[] = [];

  await page.route('**/api/v1/vocabulary', (route) =>
    route.fulfill({
      json: {
        data: {
          version: 1,
          categories: [ORDER],
          aliases: [],
          templates: {
            internal: { body: '', allowedFields: [] },
            external: { body: '' },
            sample: {},
          },
        },
      },
    }),
  );
  await page.route(WORK, (route) => {
    const term = new URL(route.request().url()).searchParams.get('q') ?? '';
    const data = WORK_ITEMS.filter((item) => item.displayId.includes(term)).map(workItem);

    return route.fulfill({ json: { data, page: { nextCursor: null, total: data.length } } });
  });
  await page.route(MESSAGES, (route) => {
    const data = corrected.row
      ? LIST.map((row) => (row.unitId === corrected.row?.unitId ? corrected.row : row))
      : LIST;

    return route.fulfill({
      json: {
        data,
        page: { total: LIST.length, nextCursor: null },
        counts: COUNTS,
        textAccess: false,
      },
    });
  });
  await page.route(CORRECT, async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;

    requests.push(body);
    corrected.row = correctedRow(body);
    await route.fulfill({ json: { data: corrected.row } });
  });

  return requests;
}

async function openRow(page: Page, sender: string) {
  await page
    .locator('[data-message-row]', { hasText: sender })
    .getByRole('button', { expanded: false })
    .click();
}

async function openDrawer(page: Page, sender: string) {
  await openRow(page, sender);
  await page.getByRole('button', { name: 'This is wrong', exact: true }).click();
}

test('AC30: the drawer offers the choices of each outcome, and created says to close the work', async ({
  page,
}) => {
  await connectedWorkspace(page);
  await answerLists(page);
  await page.goto('/audit?tab=messages');

  await openDrawer(page, 'Budi Santoso');
  await expect(page.getByRole('dialog').getByLabel('Create new work')).toBeChecked();
  await expect(page.getByRole('dialog').getByLabel('Attach to existing work')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.reload();

  await openDrawer(page, 'Siti Aminah');
  await expect(page.getByRole('dialog').getByLabel('Move to other work')).toBeChecked();
  await page.keyboard.press('Escape');
  await page.reload();

  await openDrawer(page, 'Toko Berkah');
  await expect(
    page
      .getByRole('dialog')
      .getByRole('link', { name: 'To cancel this work, close it from Work.' }),
  ).toHaveAttribute('href', '/work/ORD-0102');
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Apply correction' }),
  ).toHaveCount(0);
});

test('AC30: a pending row, In progress, has no This is wrong button', async ({ page }) => {
  await connectedWorkspace(page);
  await answerLists(page);
  await page.goto('/audit?tab=messages');

  await openRow(page, 'Dewi');
  await expect(page.getByRole('button', { name: 'This is wrong', exact: true })).toHaveCount(0);
});

test('AC31: Create new work with the category Order sends the category; the row becomes Created work', async ({
  page,
}) => {
  await connectedWorkspace(page);
  const requests = await answerLists(page);

  await page.goto('/audit?tab=messages');

  await openDrawer(page, 'Budi Santoso');
  await page
    .getByRole('dialog')
    .getByLabel('Category', { exact: true })
    .selectOption({ label: 'Order' });
  await page.getByRole('button', { name: 'Apply correction', exact: true }).click();

  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('Correction applied.', { exact: true })).toBeVisible();
  expect(requests).toEqual([{ action: 'create', categoryId: 'cat-order' }]);

  const row = page.locator('[data-message-row]', { hasText: 'Budi Santoso' });

  await expect(row.getByText('Created work', { exact: true })).toBeVisible();
  await expect(page.getByText('Corrected by Siti Aminah', { exact: true })).toBeVisible();
});

test('AC32: Move to other work picks open work by its id and sends attach; the outcome reads Attached to it', async ({
  page,
}) => {
  await connectedWorkspace(page);
  const requests = await answerLists(page);

  await page.goto('/audit?tab=messages');

  await openDrawer(page, 'Siti Aminah');
  const dialog = page.getByRole('dialog');

  await dialog.getByRole('searchbox').fill('ORD-0');
  await expect(dialog.getByRole('option', { name: /ORD-0098/ })).toHaveCount(1);
  await expect(dialog.getByRole('option', { name: /ORD-0091/ })).toHaveCount(0);
  await dialog.getByRole('combobox').selectOption('ORD-0098');
  await page.getByRole('button', { name: 'Apply correction', exact: true }).click();

  await expect(page.getByRole('dialog')).toBeHidden();
  expect(requests).toEqual([{ action: 'attach', workDisplayId: 'ORD-0098' }]);
  await expect(page.getByText('Attached to ORD-0098', { exact: true })).toBeVisible();
});

test('AC33: a 422 on summary sits under Summary, the field is required, and the drawer stays open with its category', async ({
  page,
}) => {
  await connectedWorkspace(page);
  await answerLists(page);
  await page.route(CORRECT, (route) =>
    route.fulfill({
      status: 422,
      json: {
        error: {
          code: 'E-VALIDATION',
          message: '',
          details: [{ field: 'summary', message: 'Enter a short summary.' }],
          requestId: 'correction-test',
        },
      },
    }),
  );
  await page.goto('/audit?tab=messages');

  await openDrawer(page, 'Budi Santoso');
  const dialog = page.getByRole('dialog');

  await dialog.getByLabel('Category', { exact: true }).selectOption({ label: 'Order' });
  await page.getByRole('button', { name: 'Apply correction', exact: true }).click();

  await expect(dialog.getByText('Enter a short summary.', { exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Summary', { exact: true })).toHaveAttribute('required', '');
  await expect(dialog.getByLabel('Category', { exact: true })).toHaveValue('cat-order');
});

test('AC33: a 422 on workDisplayId sits under the work field and keeps the drawer open', async ({
  page,
}) => {
  await connectedWorkspace(page);
  await answerLists(page);
  await page.route(CORRECT, (route) =>
    route.fulfill({
      status: 422,
      json: {
        error: {
          code: 'E-VALIDATION',
          message: '',
          details: [{ field: 'workDisplayId', message: 'Choose work that is still open.' }],
          requestId: 'correction-test',
        },
      },
    }),
  );
  await page.goto('/audit?tab=messages');

  await openDrawer(page, 'Siti Aminah');
  const dialog = page.getByRole('dialog');

  await dialog.getByRole('searchbox').fill('ORD-0');
  await dialog.getByRole('combobox').selectOption('ORD-0098');
  await page.getByRole('button', { name: 'Apply correction', exact: true }).click();

  await expect(dialog.getByText('Choose work that is still open.', { exact: true })).toBeVisible();
  await expect(dialog).toBeVisible();
});

test('AC33: a 500 shows an ErrorToast inside the drawer with no error code on the page', async ({
  page,
}) => {
  await connectedWorkspace(page);
  await answerLists(page);
  await page.route(CORRECT, (route) =>
    route.fulfill({
      status: 500,
      json: {
        error: { code: 'E-INTERNAL', message: '', details: [], requestId: 'correction-test' },
      },
    }),
  );
  await page.goto('/audit?tab=messages');

  await openDrawer(page, 'Budi Santoso');
  const dialog = page.getByRole('dialog');

  await dialog.getByLabel('Category', { exact: true }).selectOption({ label: 'Order' });
  await page.getByRole('button', { name: 'Apply correction', exact: true }).click();

  await expect(dialog.getByRole('alert')).toContainText('Your changes were not saved. Try again.');
  await expect(dialog).toBeVisible();
  expect(await page.locator('body').innerText()).not.toMatch(/E-[A-Z]+/);
});
