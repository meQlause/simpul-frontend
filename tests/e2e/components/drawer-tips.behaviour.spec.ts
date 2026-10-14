import { expect, test, type Page } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';
import { connectedWorkspace, pendingWorkspace } from '../helpers/database';

type Row = {
  name: string;
  path: string;
  open?: (page: Page) => Promise<void>;
  tip: string | RegExp;
  sentence: string;
};

// The tip that holds this sentence: it is the button in the info tip whose tooltip says it.
const tipOf = (page: Page, sentence: string) =>
  page
    .locator('.info-tip', { has: page.locator('[role="tooltip"]', { hasText: sentence }) })
    .getByRole('button')
    .first();

const openWorkspace = async (page: Page) => {
  await page.locator('button.workspace').click();
};

const openConnection = async (page: Page) => {
  await page
    .getByRole('button', { name: 'Manage Telegram connection', exact: true })
    .first()
    .click();
};

const openFirstReview = async (page: Page) => {
  await page.locator('a.directory-title').first().click();
};

const openFirstPerson = async (page: Page) => {
  await page.locator('tr[data-component="PersonRow"] button.directory-title').first().click();
};

const openGuide = async (page: Page) => {
  await page.getByRole('button', { name: 'Simpul guide', exact: true }).click();
};

const COUNTS = { created: 1, attached: 0, held: 0, rejected: 0, ignored: 0, pending: 0 };

// One finished unit. Only a finished row has the "This is wrong" button.
const CREATED = {
  unitId: 'unit-created',
  occurredAt: '2026-10-14T03:10:00Z',
  channel: { id: 'channel-sales', name: 'Sales Group' },
  senderName: 'Toko Berkah',
  text: null,
  outcome: 'created',
  reason: null,
  work: { displayId: 'ORD-0102' },
  correction: null,
  steps: [
    { key: 'read', triageClass: 'EVENT' },
    { key: 'outcome', status: 'done', reason: null, expiresAt: null },
  ],
};

const openCorrection = async (page: Page) => {
  // connectedWorkspace answers every unknown API path with an empty list, so the messages route follows it.
  await connectedWorkspace(page);
  await page.route(/\/api\/v1\/messages(\?|$)/, (route) =>
    route.fulfill({
      json: {
        data: [CREATED],
        page: { total: 1, nextCursor: null },
        counts: COUNTS,
        textAccess: false,
      },
    }),
  );
  await page.goto('/audit?tab=messages');
  // The fixture has one row. Each click waits for its element; a count would not.
  await page.locator('[data-message-row]').getByRole('button', { expanded: false }).click();
  await page.getByRole('button', { name: 'This is wrong', exact: true }).click();
};

const HEADERS: Row[] = [
  {
    name: 'the guide drawer header',
    path: '/',
    open: openGuide,
    tip: 'About Just define the flow.',
    sentence: 'A few clear decisions keep the right information moving.',
  },
  {
    name: 'the workspace drawer header',
    path: '/',
    open: openWorkspace,
    tip: /^About /,
    sentence: 'Connected conversations. Shared operational clarity.',
  },
  {
    name: 'the channel setup drawer header',
    path: '/channels/new',
    tip: /^About (Add Telegram channel|Configure channel)$/,
    sentence: 'Save a draft now, or complete the readiness checks to start monitoring.',
  },
  {
    name: 'the connection drawer header',
    path: '/channels',
    open: openConnection,
    tip: /^About /,
    sentence: 'One bot connects multiple groups. Updating it affects the entire workspace.',
  },
  {
    name: 'the connection drawer second section',
    path: '/channels',
    open: openConnection,
    tip: /^About /,
    sentence: 'Changing this connection applies to every group below.',
  },
  {
    name: 'the database drawer header',
    path: '/settings/database',
    tip: /^About /,
    sentence: 'Where this workspace’s data is stored.',
  },
  {
    name: 'the onboarding drawer header',
    path: '/settings/onboarding',
    tip: /^About /,
    sentence: 'A short setup for the conversations your team already uses.',
  },
  {
    name: 'the vocabulary drawer header',
    path: '/settings/vocabulary',
    tip: 'About Vocabulary & templates',
    sentence: 'Small, explicit definitions keep your team’s updates understandable.',
  },
  {
    name: 'the recipient preview header',
    path: '/settings/recipient-preview',
    tip: /^About /,
    sentence:
      'What a person receives in Telegram and by email: a notification with its actions, a clarification question, an executive digest, a voice note. It previews; it sends nothing and changes no work item.',
  },
  {
    name: 'the mail drawer header',
    path: '/settings/mail',
    tip: 'About Mail server',
    sentence: 'Where Simpul sends email digests.',
  },
  {
    name: 'the review drawer header',
    path: '/queue',
    open: openFirstReview,
    tip: /^About /,
    sentence: 'See what is missing before choosing the next step.',
  },
  {
    name: 'the rule drawer header',
    path: '/rules/new',
    tip: 'About Create routing rule',
    sentence: 'Define the condition, choose a recipient, and review the impact.',
  },
  {
    name: 'the person drawer header',
    path: '/people',
    open: openFirstPerson,
    tip: /^About /,
    sentence: 'A clear responsibility and a dependable fallback.',
  },
  {
    name: 'the correction drawer header',
    path: '/audit?tab=messages',
    open: openCorrection,
    tip: /^About /,
    sentence: 'Choose where this message belongs. The change is recorded with your name.',
  },
];

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  test.setTimeout(60000);
  backend = await startBackend();
});
test.afterAll(() => {
  backend?.stop();
});
test.beforeEach(async ({ page }) => {
  await connectBackend(page, backend.baseUrl);
});

for (const row of HEADERS) {
  test(`T14: ${row.name} keeps its sentence in a tip, not on screen`, async ({ page }) => {
    await page.goto(row.path);

    if (row.open) {
      await row.open(page);
    }

    await expect(tipOf(page, row.sentence)).toBeVisible();
    await expect(
      page.getByText(row.sentence, { exact: true }).filter({ visible: true }),
    ).toHaveCount(0);
  });
}

test('T34: untitled text stays visible: the sidebar card line and the bot handle line', async ({
  page,
}) => {
  // The sidebar card is hidden below 880px of height (FD-22), so this check needs a tall screen.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('p', { hasText: 'Relevant updates,' }).first()).toBeVisible();
  await page.goto('/channels/new');
  await expect(
    page.getByText('Token stored separately · Never required for each group', { exact: true }),
  ).toBeVisible();
});

test('T34: the bot instruction note, the notice and the audit note stay drawn', async ({
  page,
}) => {
  await page.goto('/channels/new');
  await expect(
    page
      .locator('.drawer-inline-note')
      .filter({ hasText: 'Add this bot to your Telegram group' })
      .first(),
  ).toBeVisible();
  await page.goto('/audit');
  await expect(page.locator('.directory-note').first()).toBeVisible();
  // The Notice sits on the database setup page, which opens only for a pending workspace.
  await pendingWorkspace(page);
  await page.goto('/setup/database');
  await expect(
    page.locator('.notice').filter({ hasText: 'Your database, your responsibility' }).first(),
  ).toBeVisible();
});

test('T34: the auth lead stays drawn on the sign-in page', async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 401,
      json: {
        error: { code: 'E-AUTH-REQUIRED', message: '', details: [], requestId: 'stay-visible' },
      },
    }),
  );
  await page.goto('/sign-in');
  await expect(
    page
      .getByText('Conversations keep moving. Important updates reach the right people.', {
        exact: true,
      })
      .filter({ visible: true }),
  ).toHaveCount(1);
});

test('T34: the guide drawer identity line stays drawn', async ({ page }) => {
  await page.goto('/');
  await openGuide(page);
  await expect(
    page
      .getByText('Your team keeps working in everyday conversations.', { exact: true })
      .filter({ visible: true }),
  ).toHaveCount(1);
});
