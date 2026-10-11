import { expect, test, type Page } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>>;
test.beforeAll(async () => {
  test.setTimeout(60000);
  backend = await startBackend();
});
test.afterAll(() => {
  backend?.stop();
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});
test.beforeEach(async ({ page }) => {
  await connectBackend(page, backend.baseUrl);
  await page.goto('/channels');
});

test('Channels acceptance 1: the seed lists three Active groups and the shared workspace bot', async ({
  page,
}) => {
  await expect(page.getByRole('row')).toHaveCount(4);
  const card = page.locator('[data-component="ConnectionCard"]');
  await expect(card).toContainText('Simpul workspace bot');
  await expect(card).toContainText('@simpul_workspace_bot');
  await expect(card).toContainText('Shared by 3 groups');
  await page.screenshot({
    path: test.info().outputPath('channels.png'),
    fullPage: true,
    animations: 'disabled',
  });
  for (const tab of ['All groups 3', 'Active 3', 'Drafts 0', 'Paused 0']) {
    await expect(page.getByRole('button', { name: tab, exact: true })).toBeVisible();
  }
});

test('Channels acceptance 2: saved group identity is read-only and display name is limited to 120 characters', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Operations', exact: true }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByLabel('Telegram Chat ID', { exact: true })).toHaveAttribute(
    'readonly',
    '',
  );
  await expect(drawer.getByLabel('Display name', { exact: true })).toHaveAttribute(
    'maxlength',
    '120',
  );
  await page.screenshot({
    path: test.info().outputPath('channel-drawer.png'),
    fullPage: true,
    animations: 'disabled',
  });
});

async function addGroup(page: Page, name: string, chatId: string) {
  await page.getByRole('button', { name: 'Add Telegram channel', exact: true }).click();
  await page.getByLabel('Display name', { exact: true }).fill(name);
  await page.getByLabel('Telegram Chat ID', { exact: true }).fill(chatId);
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue(name);
  await expect(page.getByLabel('Telegram Chat ID', { exact: true })).toHaveValue(chatId);
}
async function failRequest(page: Page, path: RegExp, code: string) {
  await page.route(path, (route) =>
    route.fulfill({
      status: 409,
      json: {
        error: {
          code,
          message: 'Setup failed',
          requestId: 'browser-test',
          details: [],
          ...(code === 'E-TG-RATE-LIMITED' ? { retryAfter: 30 } : {}),
        },
      },
    }),
  );
}
async function proof(page: Page, chatId: string) {
  const response = await page.request.get(backend.baseUrl + '/api/v1/telegram/connections');
  const connection = (await response.json()).data[0];
  const session = await page.request.post(
    backend.baseUrl + '/api/v1/telegram/connections/' + connection.id + '/sessions',
    { data: { purpose: 'receive_check' } },
  );
  const command = (await session.json()).data.command;
  for (const text of [command, 'A new ordinary check message']) {
    const receipt = await page.request.post(
      backend.baseUrl + '/api/v1/webhooks/telegram/' + connection.id,
      {
        headers: { 'X-Telegram-Bot-Api-Secret-Token': Buffer.alloc(32, 8).toString('base64url') },
        data: {
          update_id: Date.now(),
          message: {
            message_id: Date.now(),
            date: Math.floor(Date.now() / 1000),
            from: { id: 1, is_bot: false, first_name: 'Tester' },
            chat: { id: Number(chatId), type: 'supergroup', title: 'Browser test group' },
            text,
          },
        },
      },
    );
    expect(receipt.ok()).toBe(true);
  }
}
async function readyGroup(page: Page, name: string, chatId: string) {
  await addGroup(page, name, chatId);
  await page.getByRole('button', { name: 'Check group', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Recheck', exact: true })).toBeEnabled();
  await proof(page, chatId);
  await page.getByRole('button', { name: 'Recheck', exact: true }).click();
  await expect(
    page.getByText('Last checked just now · Valid for 10 minutes', { exact: true }),
  ).toBeVisible();
  await page.getByRole('checkbox').check();
  await expect(
    page.getByRole('button', { name: 'Activate monitoring', exact: true }),
  ).toBeEnabled();
}
test('Channels acceptance 3: duplicate group never adds a row', async ({ page }) => {
  const existing = await page.request.get(backend.baseUrl + '/api/v1/channels');
  const groups = (await existing.json()).data;
  const rows = groups.length + 1;
  await expect(page.getByRole('row')).toHaveCount(rows);
  await addGroup(page, 'Demo new group', groups[0].providerChatId);
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('E-TG-CHANNEL-DUPLICATE');
  await expect(page.getByRole('row')).toHaveCount(rows);
});
test('Channels acceptance 4: positive chat IDs show the exact unsupported error', async ({
  page,
}) => {
  await addGroup(page, 'Private chat', '12345');
  await page.getByRole('button', { name: 'Check group', exact: true }).click();
  await expect(page.locator('#channel-setup-error')).toHaveText(
    'E-TG-CHAT-TYPE-UNSUPPORTED · Only Telegram groups and supergroups are supported.',
  );
});
for (const [index, [number, code]] of (
  [
    [5, 'E-TG-SETUP-TIMEOUT'],
    [6, 'E-TG-GROUP-UNAVAILABLE'],
    [6, 'E-TG-READINESS-INCOMPLETE'],
    [6, 'E-TG-WEBHOOK-CONFLICT'],
    [6, 'E-TG-RATE-LIMITED'],
  ] as const
).entries()) {
  test(
    'Channels acceptance ' + number + ': ' + code + ' preserves inputs and prevents activation',
    async ({ page }) => {
      const chatId = '-100' + String(8000000000 + index);
      await addGroup(page, code, chatId);
      await failRequest(page, /\/channels\/[^/]+\/verify$/, code);
      await page.getByRole('button', { name: 'Check group', exact: true }).click();
      await expect(page.locator('#channel-setup-error')).toContainText(code);
      if (code === 'E-TG-RATE-LIMITED') {
        await expect(page.locator('#channel-setup-error')).toContainText('30s');
      }
      await expect(page.getByLabel('Display name', { exact: true })).toHaveValue(code);
      await expect(page.getByLabel('Telegram Chat ID', { exact: true })).toHaveValue(chatId);
      await expect(
        page.getByRole('button', { name: 'Activate monitoring', exact: true }),
      ).toBeDisabled();
    },
  );
}
test('Channels acceptance 7: failed activation never marks the group Active', async ({ page }) => {
  await readyGroup(page, 'Failed activation', '-1009000000001');
  await failRequest(page, /\/channels\/[^/]+\/activate$/, 'E-TG-ACTIVATION-FAILED');
  await page.getByRole('button', { name: 'Activate monitoring', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Start monitoring Failed activation?' })
    .getByRole('button', { name: 'Activate monitoring', exact: true })
    .click();
  await expect(page.locator('#channel-setup-error')).toContainText('E-TG-ACTIVATION-FAILED');
  const response = await page.request.get(backend.baseUrl + '/api/v1/channels');
  const saved = (await response.json()).data.find(
    (group: { displayName: string }) => group.displayName === 'Failed activation',
  );
  expect(saved.monitored).toBe(false);
  expect(saved.connectionStatus).not.toBe('active');
  await page.getByRole('button', { name: 'Close channel setup', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Failed activation' })).toContainText(
    'Draft',
  );
});
test('Channels acceptance 8: a check expires after ten minutes', async ({ page }) => {
  await page.clock.install();
  await readyGroup(page, 'Expired verification', '-1009000000002');
  await page.clock.fastForward(600001);
  await expect(
    page.getByRole('button', { name: 'Activate monitoring', exact: true }),
  ).toBeDisabled();
});
test('Channels acceptance 9: confirmed activation marks only the selected group Active', async ({
  page,
}) => {
  await readyGroup(page, 'Activated group', '-1009000000003');
  await page.getByRole('button', { name: 'Activate monitoring', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Start monitoring Activated group?' })
    .getByRole('button', { name: 'Activate monitoring', exact: true })
    .click();
  await expect(page.getByRole('row').filter({ hasText: 'Activated group' })).toContainText(
    'Active',
  );
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('Channels acceptance 10: pausing Operations keeps Sales & Order active', async ({ page }) => {
  await page.getByRole('button', { name: 'Pause Operations', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Pause Operations?' })
    .getByRole('button', { name: 'Pause group', exact: true })
    .click();
  await expect(page.getByRole('row').filter({ hasText: 'Operations' })).toContainText('Paused');
  await expect(page.getByRole('row').filter({ hasText: 'Sales & Order' })).toContainText('Active');
});
test('Channels acceptance 11: expired code keeps the typed Chat ID', async ({ page }) => {
  await addGroup(page, 'Expired code', '-1009000000004');
  await page.route(/\/telegram\/connection-sessions\//, (route) =>
    route.fulfill({
      json: {
        data: {
          id: 'expired-session',
          state: 'expired',
          expiresAt: new Date().toISOString(),
          candidate: null,
        },
      },
    }),
  );
  await page.getByText('Identify with a connection code instead', { exact: true }).click();
  await page.getByRole('button', { name: 'Get connection code', exact: true }).click();
  await expect(page.locator('#channel-setup-error')).toContainText('E-TG-SESSION-EXPIRED');
  await expect(page.getByLabel('Telegram Chat ID', { exact: true })).toHaveValue('-1009000000004');
});
test('Channels acceptance 12: verifying a different bot empties the password field', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Manage Telegram connection', exact: true }).click();
  await page.getByLabel('Replacement bot token', { exact: true }).fill('different-bot-token');
  await page.getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(page.locator('#bot-check-result')).toContainText('E-TG-CREDENTIAL-BOT-MISMATCH');
  await expect(page.getByLabel('Replacement bot token', { exact: true })).toHaveValue('');
});
