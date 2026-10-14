import { expect, test, type Page } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';
import { connectedWorkspace } from './helpers/database';

type Row = Record<string, unknown>;

const MESSAGES = /\/api\/v1\/messages(\?|$)/;
const CHANNEL = { id: 'channel-sales', name: 'Sales Group' };
const COUNTS = { created: 1, attached: 1, held: 1, rejected: 1, ignored: 1, pending: 0 };

const read = (triageClass: string) => ({ key: 'read', triageClass });
const outcome = (status: string, reason: string | null, expiresAt: string | null = null) => ({
  key: 'outcome',
  status,
  reason,
  expiresAt,
});

const rejected: Row = {
  unitId: 'unit-g3',
  occurredAt: '2026-10-14T03:50:00Z',
  channel: CHANNEL,
  senderName: 'Budi Santoso',
  text: 'Sample order update 1',
  outcome: 'rejected',
  reason: 'G3',
  work: null,
  correction: null,
  steps: [
    read('EVENT'),
    { key: 'matched', verdict: 'CREATE', decidedBy: 'score', contextMessages: 0, candidates: [] },
    outcome('failed', 'G3'),
  ],
};

const attached: Row = {
  unitId: 'unit-ai',
  occurredAt: '2026-10-14T03:40:00Z',
  channel: CHANNEL,
  senderName: 'Siti Aminah',
  text: 'Sample order update 2',
  outcome: 'attached',
  reason: null,
  work: { displayId: 'ORD-0098' },
  correction: null,
  steps: [
    read('EVENT'),
    {
      key: 'matched',
      verdict: 'ATTACH',
      decidedBy: 'model_context',
      contextMessages: 2,
      candidates: [
        { displayId: 'ORD-0091', summary: 'Toko Berkah, 12 pcs', score: '0.58' },
        { displayId: 'ORD-0095', summary: 'Toko Sari', score: '0.41' },
      ],
    },
    outcome('done', null),
    { key: 'notified', decisionId: 'decision-1' },
  ],
};

const held: Row = {
  unitId: 'unit-held',
  occurredAt: '2026-10-14T03:30:00Z',
  channel: CHANNEL,
  senderName: 'Rina',
  text: 'Sample order update 3',
  outcome: 'held',
  reason: 'question_open',
  work: null,
  correction: null,
  steps: [read('EVENT'), outcome('held', 'question_open', '2026-10-14T12:56:45Z')],
};

const ignored: Row = {
  unitId: 'unit-noise',
  occurredAt: '2026-10-14T03:20:00Z',
  channel: CHANNEL,
  senderName: 'Dedi',
  text: 'Sample order update 4',
  outcome: 'ignored',
  reason: 'noise',
  work: null,
  correction: null,
  steps: [read('NOISE'), outcome('done', 'noise')],
};

const created: Row = {
  unitId: 'unit-created',
  occurredAt: '2026-10-14T03:10:00Z',
  channel: CHANNEL,
  senderName: 'Toko Berkah',
  text: 'Sample order update 5',
  outcome: 'created',
  reason: null,
  work: { displayId: 'ORD-0102' },
  correction: null,
  steps: [read('EVENT'), outcome('done', null)],
};

const SIX = [rejected, attached, held, ignored, created];

function answer(
  rows: Row[],
  access: boolean,
  page: { total: number; nextCursor: string | null } = { total: rows.length, nextCursor: null },
) {
  return {
    data: rows.map((row) => ({ ...row, text: access ? row.text : null })),
    page,
    counts: COUNTS,
    textAccess: access,
  };
}

// The list of GET /messages, answered by the test. Playwright matches the latest route first.
async function messagesRoute(page: Page, respond: (url: URL) => unknown, delay?: Promise<void>) {
  await page.route(MESSAGES, async (route) => {
    await delay;
    await route.fulfill({ json: respond(new URL(route.request().url())) });
  });
}

test.describe('the Messages tab on the seeded backend', () => {
  let backend: Awaited<ReturnType<typeof startBackend>>;

  test.beforeAll(async () => {
    test.setTimeout(120000);
    backend = await startBackend();
  });
  test.afterAll(() => backend?.stop());

  test('AC25: the page tabs switch, the URL and the request follow the filters, and Decisions returns', async ({
    page,
  }) => {
    await connectBackend(page, backend.baseUrl);
    await messagesRoute(page, (url) => {
      const outcomeOf = url.searchParams.get('outcome');

      return answer(outcomeOf ? SIX.filter((row) => row.outcome === outcomeOf) : SIX, false);
    });
    await page.goto('/audit');

    await page.getByRole('link', { name: 'Messages', exact: true }).click();
    await expect(page).toHaveURL(/\/audit\?tab=messages$/);
    await expect(page.getByRole('button', { name: 'Rejected' })).toBeVisible();

    const request = page.waitForRequest((req) => req.url().includes('outcome=rejected'));

    await page.getByRole('button', { name: 'Rejected' }).click();
    expect((await request).url()).toContain('/api/v1/messages?outcome=rejected');
    await expect(page).toHaveURL(/outcome=rejected/);
    await page.locator('[data-component="DirectoryToolbar"] input[type="search"]').fill('siti');
    await expect(page).toHaveURL(/q=siti/);

    await page.getByRole('link', { name: 'Decisions', exact: true }).click();
    await expect(page).toHaveURL(/\/audit$/);
    await expect(page.getByRole('row')).toHaveCount(6);
  });
});

test('AC26: a G3 rejection reads its three sentences and no reason code', async ({ page }) => {
  await connectedWorkspace(page);
  await messagesRoute(page, () => answer(SIX, false));
  await page.goto('/audit?tab=messages');

  const row = page.locator('[data-message-row]', { hasText: 'Budi Santoso' });

  await expect(row.getByText('Rejected', { exact: true })).toBeVisible();
  await row.getByRole('button', { expanded: false }).click();
  await expect(page.getByText('Work event', { exact: true })).toBeVisible();
  await expect(page.getByText('Nothing similar — treated as new', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Does not say who or what it is about.', { exact: true }),
  ).toBeVisible();

  const text = await page.locator('body').innerText();

  expect(text).not.toMatch(
    /\b(G[1-5]|empty_evidence|low_genesis_confidence|model_invalid_json|question_open|question_expired|question_quota)\b/,
  );
});

test('AC27: the AI line lists its candidates, the held line shows the WIB time, the notified step links', async ({
  page,
}) => {
  await connectedWorkspace(page);
  await messagesRoute(page, () => answer(SIX, false));
  await page.goto('/audit?tab=messages');

  await page
    .locator('[data-message-row]', { hasText: 'Siti Aminah' })
    .getByRole('button', { expanded: false })
    .click();
  await expect(
    page.getByText('Decided by AI using 2 recent messages', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('ORD-0091')).toBeVisible();
  await expect(page.getByText('0.41', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'See the routing decision' })).toHaveAttribute(
    'href',
    '/audit/decision-1',
  );

  await page
    .locator('[data-message-row]', { hasText: 'Rina' })
    .getByRole('button', { expanded: false })
    .click();
  await expect(
    page.getByText('Waiting for an answer in the group until 19:56', { exact: true }),
  ).toBeVisible();
});

test('AC28: text access off hides every text cell and links the footnote to Settings; on shows the text', async ({
  page,
}) => {
  await connectedWorkspace(page);
  let access = false;

  await messagesRoute(page, () => answer(SIX, access));
  await page.goto('/audit?tab=messages');

  await expect(page.getByText('Message text is hidden', { exact: true })).toHaveCount(5);
  await expect(page.locator('[data-role="footnote"] a[href="/settings"]')).toBeVisible();

  access = true;
  await page.reload();
  await expect(page.getByText('Sample order update 1', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Account, ID and card numbers are hidden. Opening this list is recorded.', {
      exact: true,
    }),
  ).toBeVisible();
});

test('AC29: the loading state shows, then the empty state when no units exist', async ({
  page,
}) => {
  await connectedWorkspace(page);
  let release = (): void => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  await messagesRoute(page, () => answer(SIX, false), gate);
  await page.goto('/audit?tab=messages');
  await expect(page.getByRole('status')).toHaveAccessibleName('Your workspace data is loading.');
  release();
  await expect(page.locator('[data-message-row]')).toHaveCount(5);

  await page.unrouteAll({ behavior: 'wait' });
  await messagesRoute(page, () => answer([], false));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'No data yet' })).toBeVisible();
});

test('AC29: a filter that matches nothing reads No matches found', async ({ page }) => {
  await connectedWorkspace(page);
  await messagesRoute(page, (url) =>
    url.searchParams.get('outcome') ? answer([], false) : answer(SIX, false),
  );
  await page.goto('/audit?tab=messages');
  await page.getByRole('button', { name: 'Ignored' }).click();
  await expect(page.getByRole('heading', { name: 'No matches found' })).toBeVisible();
});

test('AC29: Showing 25 of 60 and Load more appends the next page', async ({ page }) => {
  await connectedWorkspace(page);
  const first = [...Array(25).keys()].map((index) => ({ ...rejected, unitId: `p1-${index}` }));
  const second = [...Array(25).keys()].map((index) => ({ ...rejected, unitId: `p2-${index}` }));

  await messagesRoute(page, (url) =>
    url.searchParams.get('cursor')
      ? answer(second, false, { total: 60, nextCursor: 'page-3' })
      : answer(first, false, { total: 60, nextCursor: 'page-2' }),
  );
  await page.goto('/audit?tab=messages');

  await expect(page.getByRole('status').filter({ hasText: 'Showing 25 of 60' })).toBeVisible();
  await page.getByRole('button', { name: 'Load more' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Showing 50 of 60' })).toBeVisible();
});

test('AC29: offline, the loaded rows stay and every This is wrong button is disabled', async ({
  page,
  context,
}) => {
  await connectedWorkspace(page);
  await messagesRoute(page, () => answer(SIX, false));
  await page.goto('/audit?tab=messages');
  await page
    .locator('[data-message-row]', { hasText: 'Budi Santoso' })
    .getByRole('button', { expanded: false })
    .click();
  await page
    .locator('[data-message-row]', { hasText: 'Dedi' })
    .getByRole('button', { expanded: false })
    .click();

  await context.setOffline(true);

  await expect(page.locator('[data-message-row]')).toHaveCount(5);
  await expect(page.getByText('You are offline', { exact: true })).toBeVisible();
  await expect(page.locator('[data-role="correct"]').first()).toBeDisabled();
  await expect(page.locator('[data-role="correct"]')).toHaveCount(2);
});
