import { expect, test, type Locator, type Page, type Request, type Route } from '@playwright/test';
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

// Every error that is not a field's own is a toast with its sentence, never its code.
const errorToast = (page: Page) => page.locator('[data-component="ErrorToast"]');
const steps = (page: Page) => page.locator('.setup-step');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const row = (page: Page, text: string) => page.getByRole('row').filter({ hasText: text });
const isVerify = (request: Request) =>
  request.method() === 'POST' && /\/channels\/[^/]+\/verify$/.test(request.url());
const isSave = (request: Request) =>
  request.method() === 'POST' && request.url().endsWith('/api/v1/channels');
const expiredSession = {
  id: 'expired-session',
  state: 'expired',
  expiresAt: '2026-10-10T04:16:00.000Z',
  candidate: null,
};
const expiredSentence = 'This connection code has expired. Generate a new code.';
const errorBody = (code: string, message: string, extra = {}) => ({
  error: { code, message, requestId: 'browser-test', details: [], ...extra },
});

test('Channels acceptance 2: an active group opens with four Done steps', async ({ page }) => {
  const verifies = countRequests(page, isVerify);

  await button(page, 'Configure Operations').click();
  await expectStatuses(page, ['done', 'done', 'done', 'done']);
  await expect(page.getByRole('combobox', { name: /^Audience/ })).toBeEnabled();
  await expect(page.getByRole('combobox', { name: /^Conversation language/ })).toBeEnabled();
  await expect(button(page, 'Save changes')).toBeVisible();
  expect(verifies()).toBe(0);
});

test('Channels acceptance 3: a command from a configured group adds no row and says so', async ({
  page,
}) => {
  const existing = await groups(page);
  const rows = existing.length + 1;

  await expect(page.getByRole('row')).toHaveCount(rows);
  const command = await newGroupCommand(page);

  await sendUpdate(page, existing[0].providerChatId, 'Demo new group', command);
  await expect(errorToast(page)).toHaveText('This group is already configured in this workspace.');
  await expect(page.getByRole('row')).toHaveCount(rows);
  await expectStatuses(page, ['done', 'now']);
  await expect(button(page, 'Try again')).toHaveCount(0);
});

test('Channels acceptance 4: a non-group chat shows its sentence', async ({ page }) => {
  await page.route(/\/telegram\/connection-sessions\//, (route) =>
    route.fulfill({
      json: {
        data: {
          id: 'private-session',
          state: 'identified',
          expiresAt: new Date(Date.now() + 900000).toISOString(),
          candidate: { providerChatId: '12345', title: 'Private chat', chatType: 'private' },
        },
      },
    }),
  );
  await page.route(/\/api\/v1\/channels$/, (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({
          status: 409,
          json: errorBody(
            'E-TG-CHAT-TYPE-UNSUPPORTED',
            'Only Telegram groups and supergroups are supported.',
          ),
        })
      : route.fallback(),
  );
  await newGroupCommand(page);

  await expect(errorToast(page)).toHaveText('Only Telegram groups and supergroups are supported.');
  await expect(page.getByRole('row')).toHaveCount(4);
  await expectStatuses(page, ['done', 'now']);
  await expect(button(page, 'Try again')).toHaveCount(0);
});

test('Channels acceptance 5: a timeout shows Try again, Activate stays off', async ({ page }) => {
  await timeoutGroup(page, '-1009400000000', 'Timeout group');

  await expect(errorToast(page)).toContainText('Setup failed');
  await expect(errorToast(page)).not.toContainText('E-TG-SETUP-TIMEOUT');
  await expect(button(page, 'Try again')).toBeVisible();
  await expect(button(page, 'Activate monitoring')).toBeDisabled();
  await expect(row(page, 'Timeout group')).toContainText('Draft');
});

test('Channels acceptance 5: silent for a minute, then Try again checks once', async ({ page }) => {
  const verifies = countRequests(page, isVerify);
  const saves = countRequests(page, isSave);

  await timeoutGroup(page, '-1009400000001', 'Silent group');
  await expect(button(page, 'Try again')).toBeVisible();
  const before = verifies();
  const savesBefore = saves();

  expect(verifies()).toBe(before);
  await button(page, 'Try again').click();
  await expect.poll(verifies).toBe(before + 1);
  expect(saves()).toBe(savesBefore);
});

for (const [index, code] of (
  [
    'E-TG-GROUP-UNAVAILABLE',
    'E-TG-READINESS-INCOMPLETE',
    'E-TG-WEBHOOK-CONFLICT',
    'E-TG-RATE-LIMITED',
  ] as const
).entries()) {
  test(
    'Channels acceptance 6: ' + code + ' keeps the found group and prevents activation',
    async ({ page }) => {
      await failRequest(page, /\/channels\/[^/]+\/verify$/, code);
      const command = await newGroupCommand(page);

      await sendUpdate(page, '-100' + String(8000000000 + index), code, command);
      await expect(row(page, code)).toContainText('Draft');
      await expect(errorToast(page)).toContainText('Setup failed');
      await expect(errorToast(page)).not.toContainText(code);

      if (code === 'E-TG-RATE-LIMITED') {
        await expect(errorToast(page)).toContainText('30s');
      }

      await expect(button(page, 'Activate monitoring')).toBeDisabled();
    },
  );
}

test('Channels acceptance 7: failed activation never marks the group Active', async ({ page }) => {
  await readyGroup(page, 'Failed activation', '-1009000000001');
  await failRequest(page, /\/channels\/[^/]+\/activate$/, 'E-TG-ACTIVATION-FAILED');
  await button(page, 'Activate monitoring').click();
  await page
    .getByRole('dialog', { name: 'Start monitoring Failed activation?' })
    .getByRole('button', { name: 'Activate monitoring', exact: true })
    .click();
  await expect(errorToast(page)).toHaveText('Setup failed');
  const saved = (await groups(page)).find((group) => group.displayName === 'Failed activation');

  expect(saved?.monitored).toBe(false);
  expect(saved?.connectionStatus).not.toBe('active');
  await button(page, 'Close channel setup').click();
  await expect(row(page, 'Failed activation')).toContainText('Draft');
});
test('Channels acceptance 8: a check expires after ten minutes', async ({ page }) => {
  await page.clock.install();
  await readyGroup(page, 'Expired verification', '-1009000000002', true);
  await page.clock.fastForward(600001);
  await expect(button(page, 'Activate monitoring')).toBeDisabled();
});
test('Channels acceptance 9: activation marks only the selected group Active', async ({ page }) => {
  await readyGroup(page, 'Activated group', '-1009000000003');
  await button(page, 'Activate monitoring').click();
  await page
    .getByRole('dialog', { name: 'Start monitoring Activated group?' })
    .getByRole('button', { name: 'Activate monitoring', exact: true })
    .click();
  await expect(row(page, 'Activated group')).toContainText('Active');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('Channels acceptance 10: pausing Operations keeps Sales & Order active', async ({ page }) => {
  await button(page, 'Pause Operations').click();
  await page
    .getByRole('dialog', { name: 'Pause Operations?' })
    .getByRole('button', { name: 'Pause group', exact: true })
    .click();
  await expect(row(page, 'Operations')).toContainText('Paused');
  await expect(row(page, 'Sales & Order')).toContainText('Active');
});
test('Channels acceptance 11: an expired code says so, Generate code stays', async ({ page }) => {
  await page.route(/\/telegram\/connection-sessions\//, (route) =>
    route.fulfill({ json: { data: expiredSession } }),
  );
  await newGroupCommand(page);

  await expect(errorToast(page)).toHaveText(expiredSentence);
  await expectStatuses(page, ['done', 'now']);
  await expect(button(page, 'Generate code')).toBeEnabled();
});
test('Channels AC16: a code that expires after saving keeps the Draft row', async ({ page }) => {
  let expired = false;

  await page.route(/\/telegram\/connection-sessions\//, (route) =>
    expired ? route.fulfill({ json: { data: expiredSession } }) : route.fallback(),
  );
  const command = await newGroupCommand(page);

  await sendUpdate(page, '-1009300000000', 'Expiring group', command);
  const expiring = row(page, 'Expiring group');

  await expect(expiring).toContainText('Draft');
  expired = true;
  await expect(errorToast(page)).toHaveText(expiredSentence);
  await expect(expiring).toContainText('Draft');
  await expectStatuses(page, ['done', 'now']);
  await expect(button(page, 'Generate code')).toBeEnabled();
});
test('Channels AC9: no name or chat ID field, four steps, one primary button', async ({ page }) => {
  await page.goto('/channels/new');
  await expect(page.getByLabel('Display name', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Telegram Chat ID', { exact: true })).toHaveCount(0);
  await expect(steps(page)).toHaveCount(4);
  await expect(steps(page).locator('.badge')).toHaveText(['Now', 'Next', 'Next', 'Next']);
  await expect(steps(page).locator('.button-primary')).toHaveCount(1);
});
test('Channels AC10: a command saves a Draft row with no click', async ({ page }) => {
  const saves = countRequests(page, isSave);
  const verifies = countRequests(page, isVerify);
  const command = await newGroupCommand(page);

  await sendUpdate(page, '-1009200000000', 'Customer orders', command);
  await expect(row(page, 'Customer orders')).toContainText('Draft');
  await expect(page.getByText('Found: Customer orders', { exact: true })).toBeVisible();
  await expectStatuses(page, ['done', 'done', 'now']);
  expect(saves()).toBe(1);
  expect(verifies()).toBe(1);
});
test('Channels AC11: an ordinary message makes the group ready', async ({ page }) => {
  const verifies = countRequests(page, isVerify);
  const command = await newGroupCommand(page);

  await sendUpdate(page, '-1009200000001', 'Ready group', command);
  await expect(row(page, 'Ready group')).toContainText('Draft');
  const before = verifies();

  await sendUpdate(page, '-1009200000001', 'Ready group', 'A new ordinary check message');
  await expect(page.getByText('Message received', { exact: true })).toBeVisible();
  await expectStatuses(page, ['done', 'done', 'done', 'now']);
  expect(verifies()).toBe(before + 1);
  await page.getByRole('checkbox').check();
  await expect(button(page, 'Activate monitoring')).toBeEnabled();

  for (const label of ['Check group', 'Recheck', 'Save draft', 'Get connection code']) {
    await expect(page.getByRole('button', { name: label, exact: true })).toHaveCount(0);
  }
});
test('Channels AC17: reopening a Draft runs one check and shows its steps', async ({ page }) => {
  const command = await newGroupCommand(page);

  await sendUpdate(page, '-1009200000002', 'Reopened group', command);
  await expect(row(page, 'Reopened group')).toContainText('Draft');
  await button(page, 'Close channel setup').click();
  const verifies = countRequests(page, isVerify);

  await button(page, 'Configure Reopened group').click();
  await expectStatuses(page, ['done', 'now', 'next', 'next']);
  await expect(
    steps(page).nth(1).getByRole('button', { name: 'Generate code', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('dialog').getByText('Reopened group', { exact: true }).first(),
  ).toBeVisible();
  await expect.poll(verifies).toBe(1);
});
test('Channels AC19: the code poll keeps going until the proof arrives', async ({ page }) => {
  const calls = await trackSessionPolls(page, (route) => route.fallback());
  const command = await startIdentification(page);

  await expect.poll(calls).toBe(1);
  await sendUpdate(page, '-1009100000001', 'Identified browser group', command);
  await settle(page, 'Found: Identified browser group', true);
  const identified = calls();

  await page.clock.fastForward(10000);
  await expect.poll(calls).toBeGreaterThan(identified);
  await sendUpdate(
    page,
    '-1009100000001',
    'Identified browser group',
    'A new ordinary check message',
  );
  await settle(page, 'Message received', true);
  const stopped = calls();

  await page.clock.fastForward(60000);
  expect(calls()).toBe(stopped);
});
test('Channels AC19: the code poll stops on expired', async ({ page }) => {
  let expired = false;
  const calls = await trackSessionPolls(page, (route) =>
    expired ? route.fulfill({ json: { data: expiredSession } }) : route.fallback(),
  );

  await startIdentification(page);
  await expect.poll(calls).toBe(1);
  expired = true;
  await page.clock.fastForward(10000);
  await expect(errorToast(page)).toHaveText(expiredSentence);
  const stopped = calls();

  await page.clock.fastForward(60000);
  expect(calls()).toBe(stopped);
});

for (const close of ['button', 'Escape']) {
  test(
    'Channels AC19: the code poll stops when the drawer closes using ' + close,
    async ({ page }) => {
      const calls = await trackSessionPolls(page, (route) => route.fallback());

      await startIdentification(page);
      await expect.poll(calls).toBe(1);

      if (close === 'Escape') {
        await page.keyboard.press('Escape');
      } else {
        await button(page, 'Close channel setup').click();
      }

      await expect(page.getByRole('dialog')).toHaveCount(0);
      const stopped = calls();

      await page.clock.fastForward(60000);
      expect(calls()).toBe(stopped);
    },
  );
}

test('Channels AC20: a Telegram title replaces the display name', async ({ page }) => {
  const sales = (await groups(page)).find((group) => group.displayName === 'Sales & Order');

  await routeGroupTitle(page, 'Sales & Order', 'Sales floor');
  await page.reload();
  await button(page, 'Configure Sales floor').click();
  await expect(
    page.getByRole('dialog').getByText('Sales floor', { exact: true }).first(),
  ).toBeVisible();
  expect(await page.getByRole('dialog').innerText()).not.toContain(sales?.providerChatId ?? '');
  await button(page, 'Close channel setup').click();
  await button(page, 'Pause Sales floor').click();
  await expect(page.getByRole('dialog', { name: 'Pause Sales floor?' })).toBeVisible();
  expect(await page.getByRole('dialog').innerText()).not.toContain(sales?.providerChatId ?? '');
});
test('Channels AC20: with no Telegram title, the display name is shown', async ({ page }) => {
  await routeGroupTitle(page, 'Operations', null);
  await page.reload();
  await button(page, 'Configure Operations').click();
  await expect(
    page.getByRole('dialog').getByText('Operations', { exact: true }).first(),
  ).toBeVisible();
});
test('Channels AC21: a read-only command that Copy puts on the clipboard', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const command = await newGroupCommand(page);

  await expect(page.getByLabel('Connection command', { exact: true })).toHaveAttribute(
    'readonly',
    '',
  );
  await expect(page.locator('label', { hasText: 'expires in 15 minutes' })).toBeVisible();
  await button(page, 'Copy').click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(command);
});
test('Channels AC23: a check ten minutes old is rechecked once', async ({ page }) => {
  await page.clock.install();
  await readyGroup(page, 'Stale check group', '-1009200000003', true);
  const verifies = countRequests(page, isVerify);

  await page.clock.fastForward(600001);
  await expect(button(page, 'Activate monitoring')).toBeDisabled();
  await expect(
    page.getByText('The setup changed or the check expired. Run the checks again.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect.poll(verifies).toBe(1);
  await page.clock.fastForward(60000);
  expect(verifies()).toBe(1);
});
test('Channels AC26: no chat ID in the list, drawer, popup or connection', async ({ page }) => {
  const chats = (await groups(page)).map((group) => group.providerChatId);

  await expectNoChat(page.locator('body'), chats);

  for (const group of await groups(page)) {
    await expect(row(page, group.displayName)).toContainText('Telegram group');
  }

  await button(page, 'Configure Operations').click();
  await expectNoChat(page.getByRole('dialog'), chats);
  await button(page, 'Close channel setup').click();
  await button(page, 'Pause Sales & Order').click();
  await expect(
    page
      .getByRole('dialog', { name: 'Pause Sales & Order?' })
      .getByRole('heading', { name: 'Sales & Order', exact: true }),
  ).toBeVisible();
  await expectNoChat(page.getByRole('dialog'), chats);
  await page.keyboard.press('Escape');
  await button(page, 'Manage Telegram connection').click();
  await expectNoChat(page.getByRole('dialog'), chats);
});

async function expectNoChat(scope: Locator, chats: string[]) {
  const text = await scope.innerText();

  expect(chats.filter((chat) => text.includes(chat))).toEqual([]);
}

// Helpers. A fake clock only moves when a test moves it, so every wait takes the clock into account.
async function groups(page: Page) {
  const response = await page.request.get(backend.baseUrl + '/api/v1/channels');

  return (await response.json()).data as {
    displayName: string;
    providerChatId: string;
    monitored: boolean;
    connectionStatus: string;
  }[];
}

async function failRequest(page: Page, path: RegExp, code: string) {
  await page.route(path, (route) =>
    route.fulfill({
      status: 409,
      json: errorBody(code, 'Setup failed', code === 'E-TG-RATE-LIMITED' ? { retryAfter: 30 } : {}),
    }),
  );
}

function countRequests(page: Page, matches: (request: Request) => boolean) {
  let count = 0;

  page.on('request', (request) => {
    if (matches(request)) {
      count += 1;
    }
  });

  return () => count;
}

async function trackSessionPolls(page: Page, answer: (route: Route) => Promise<void>) {
  let calls = 0;

  await page.route(/\/telegram\/connection-sessions\//, async (route) => {
    calls += 1;
    await answer(route);
  });

  return () => calls;
}

async function expectStatuses(page: Page, statuses: string[]) {
  for (const [index, status] of statuses.entries()) {
    await expect(steps(page).nth(index)).toHaveAttribute('data-status', status);
  }
}

async function generateCode(page: Page) {
  await button(page, 'Generate code').click();
  const command = page.getByLabel('Connection command', { exact: true });

  await expect(command).toHaveValue(/\/simpul_connect /);

  return command.inputValue();
}

async function newGroupCommand(page: Page) {
  await button(page, 'Add Telegram channel').click();

  return generateCode(page);
}

async function startIdentification(page: Page) {
  await page.clock.install();

  return newGroupCommand(page);
}

// One message from a group, as the webhook receives it.
async function sendUpdate(page: Page, chatId: string, title: string, text: string) {
  const response = await page.request.get(backend.baseUrl + '/api/v1/telegram/connections');
  const connection = (await response.json()).data[0];
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
          chat: { id: Number(chatId), type: 'supergroup', title },
          text,
        },
      },
    },
  );

  expect(receipt.ok()).toBe(true);
}

async function settle(page: Page, text: string, clock = false) {
  const locator = page.getByText(text, { exact: true });

  if (!clock) {
    await expect(locator).toBeVisible();

    return;
  }

  await expect
    .poll(async () => {
      await page.clock.fastForward(1000);

      return locator.isVisible();
    })
    .toBe(true);
}

async function readyGroup(page: Page, title: string, chatId: string, clock = false) {
  const command = await newGroupCommand(page);

  await sendUpdate(page, chatId, title, command);
  await settle(page, 'Found: ' + title, clock);
  await sendUpdate(page, chatId, title, 'A new ordinary check message');
  await settle(page, 'Message received', clock);
  await page.getByRole('checkbox').check();
  await expect(button(page, 'Activate monitoring')).toBeEnabled();
}

async function timeoutGroup(page: Page, chatId: string, title: string) {
  await failRequest(page, /\/channels\/[^/]+\/verify$/, 'E-TG-SETUP-TIMEOUT');
  const command = await startIdentification(page);

  await sendUpdate(page, chatId, title, command);
  await expect
    .poll(async () => {
      await page.clock.fastForward(1000);

      return row(page, 'Timeout group').isVisible();
    })
    .toBe(true);
}

async function routeGroupTitle(page: Page, displayName: string, title: string | null) {
  await page.route(/\/api\/v1\/channels(\/[^/]+)?$/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();

      return;
    }

    const path = new URL(route.request().url()).pathname;
    const body = await (await page.request.get(backend.baseUrl + path)).json();
    const retitle = (group: { displayName: string }) =>
      group.displayName === displayName ? { ...group, providerChatTitle: title } : group;

    await route.fulfill({
      json: { data: Array.isArray(body.data) ? body.data.map(retitle) : retitle(body.data) },
    });
  });
}
