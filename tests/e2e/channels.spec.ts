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

// Every error that is not a field's own is a toast with its sentence, never its code.
const errorToast = (page: Page) => page.locator('[data-component="ErrorToast"]');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

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

test('Channels acceptance 12: verifying a different bot empties the password field', async ({
  page,
}) => {
  await button(page, 'Manage Telegram connection').click();
  await page.getByLabel('Replacement bot token', { exact: true }).fill('different-bot-token');
  await button(page, 'Verify').click();
  await expect(errorToast(page)).toHaveText('This token belongs to a different bot.');
  await expect(page.getByLabel('Replacement bot token', { exact: true })).toHaveValue('');
});

test('Channels credential re-entry uses the token submitted to Verify even if the DOM changes during its response', async ({
  page,
}) => {
  await button(page, 'Manage Telegram connection').click();
  const field = page.getByLabel('Replacement bot token', { exact: true });

  await page.route(/\/telegram\/connections\/verify$/, async (route) => {
    await field.evaluate((element) => {
      (element as HTMLInputElement).value = 'changed-during-verification';
    });
    await route.fallback();
  });
  await field.fill('verified-re-entry-token');
  await button(page, 'Verify').click();
  await expect(field).toHaveValue('');
  // The seed stores the username with its @; the result shows exactly one.
  await expect(page.locator('#bot-check-result')).toHaveText('@simpul_workspace_bot');
  await field.fill('verified-re-entry-token');
  await expect(button(page, 'Save connection')).toBeEnabled();
});

async function credentialVersion(page: Page) {
  const response = await page.request.get(backend.baseUrl + '/api/v1/telegram/connections');

  return (await response.json()).data[0].credentialVersion as number;
}

async function verifyReplacement(page: Page, token: string) {
  await button(page, 'Manage Telegram connection').click();
  const field = page.getByLabel('Replacement bot token', { exact: true });

  await field.fill(token);
  await button(page, 'Verify').click();
  await expect(field).toHaveValue('');

  return field;
}

async function rotateReplacement(page: Page, token: string) {
  const field = await verifyReplacement(page, token);

  await expect(button(page, 'Save connection')).toBeDisabled();
  await field.fill('a-different-token-for-the-same-bot');
  await expect(button(page, 'Save connection')).toBeDisabled();
  await field.fill(token);
  await button(page, 'Save connection').click();
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/v1/telegram/connections') &&
        response.request().method() === 'GET',
    ),
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/v1/channels') && response.request().method() === 'GET',
    ),
    page
      .getByRole('dialog', { name: 'Save connection', exact: true })
      .getByRole('button', { name: 'Save connection', exact: true })
      .click(),
  ]);
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

async function expectNoCredential(page: Page, token: string) {
  expect(
    await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
  ).toEqual({ local: 0, session: 0 });
  expect(await page.content()).not.toContain(token);
  expect(page.url()).not.toContain(token);
}

test('Channels acceptance 13: a successful credential rotation leaves storage empty and no token in page HTML', async ({
  page,
}) => {
  const token = 'browser-rotated-token';
  const version = await credentialVersion(page);

  await rotateReplacement(page, token);
  expect(await credentialVersion(page)).toBe(version + 1);
  await expectNoCredential(page, token);
  await page.reload();
  await expect(page.locator('[data-component="ConnectionCard"]')).toContainText(
    'Simpul workspace bot',
  );
  await expect(button(page, 'Operations')).toBeVisible();
  await expectNoCredential(page, token);
});
