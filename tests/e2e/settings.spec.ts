import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
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
  await page.goto('/settings');
});

test('Settings acceptance 1: the seeded form shows 21:00, 07:00, 6 and 08:30', async ({ page }) => {
  for (const [label, value] of [
    ['Quiet hours start', '21:00'],
    ['Quiet hours end', '07:00'],
    ['Notifications per person / hour', '6'],
    ['Daily digest', '08:30'],
  ]) {
    await expect(page.getByLabel(label, { exact: true })).toHaveValue(value);
  }

  await expect(
    page.getByText('Applies to Point Star · WIB (UTC+7)', { exact: true }),
  ).toBeVisible();
});

test('Settings acceptance 2 and 4: equal hours and a zero limit submit nothing', async ({
  page,
}) => {
  let writes = 0;

  page.on('request', (request) => {
    if (request.method() === 'PUT') {
      writes += 1;
    }
  });
  const end = page.getByLabel('Quiet hours end', { exact: true });

  await end.fill('21:00');
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(
    page.getByText('Choose different start and end times.', { exact: true }),
  ).toBeVisible();
  await expect(end).toHaveAttribute('aria-invalid', 'true');
  await expect(end).toBeFocused();
  await end.fill('07:00');
  const budget = page.getByLabel('Notifications per person / hour', { exact: true });

  await budget.fill('0');
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(budget).toBeFocused();
  expect(writes).toBe(0);
});

test('Settings acceptance 3: a saved limit survives reload and appears in Budi’s delivery', async ({
  page,
}) => {
  await page.getByLabel('Notifications per person / hour', { exact: true }).fill('8');
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Workspace settings saved.');
  await page.reload();
  await expect(page.getByLabel('Notifications per person / hour', { exact: true })).toHaveValue(
    '8',
  );
  await page.getByRole('link', { name: 'People & structure', exact: true }).click();
  await page.getByRole('button', { name: 'Budi Santoso', exact: true }).click();
  await expect(
    page.getByRole('dialog').getByText('8 notifications per person / hour', { exact: true }),
  ).toBeVisible();
});

test('Settings acceptance 5: offline disables every field and Save settings', async ({
  page,
  context,
}) => {
  await expect(page.getByLabel('Daily digest', { exact: true })).toBeVisible();
  await context.setOffline(true);

  for (const label of [
    'Quiet hours start',
    'Quiet hours end',
    'Notifications per person / hour',
    'Daily digest',
  ]) {
    await expect(page.getByLabel(label, { exact: true })).toBeDisabled();
  }

  await expect(page.getByRole('button', { name: 'Save settings', exact: true })).toBeDisabled();
});

const contextHint =
  "When a message is unclear, Simpul reads the group's recent messages to understand it. 0 turns this off: Simpul then reads only the message itself, and asks the group when that is not enough.";

test('SRS §6.7 (FR-UI-21): the Understanding panel shows the context window and cap, their hint, and the message-text switch', async ({
  page,
}) => {
  await expect(page.locator('[data-component="UnderstandingPanel"]')).toBeVisible();
  await expect(
    page
      .locator('[data-component="UnderstandingPanel"]')
      .getByText('Understanding', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Conversation context window (minutes)', { exact: true }),
  ).toHaveValue('30');
  await expect(page.getByLabel('Context messages', { exact: true })).toHaveValue('10');
  await expect(page.getByText(contextHint, { exact: true })).toBeVisible();
  await expect(
    page.getByLabel('Show message text in History & audit', { exact: true }),
  ).toBeVisible();
});

test('SRS §6.7 (FR-UI-21): 181 is refused before any write; 0 saves and survives a reload', async ({
  page,
}) => {
  let writes = 0;

  page.on('request', (request) => {
    if (request.method() === 'PUT') {
      writes += 1;
    }
  });
  const windowField = page.getByLabel('Conversation context window (minutes)', { exact: true });

  await windowField.fill('181');
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  expect(writes).toBe(0);

  await windowField.fill('0');
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Workspace settings saved.');
  await page.reload();
  await expect(
    page.getByLabel('Conversation context window (minutes)', { exact: true }),
  ).toHaveValue('0');
});

test('SRS §6.7 (FR-UI-21): offline disables both Understanding fields', async ({
  page,
  context,
}) => {
  await expect(page.getByLabel('Context messages', { exact: true })).toBeVisible();
  await context.setOffline(true);

  await expect(
    page.getByLabel('Conversation context window (minutes)', { exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel('Context messages', { exact: true })).toBeDisabled();
});

const textAccessHint =
  'Account, ID and card numbers stay hidden. Every time message text is opened is recorded.';

test('SRS §11.4 (FR-UI-21): the message-text switch is off on the seed, its hint shows, Save settings sends it, and it survives a reload', async ({
  page,
  context,
}) => {
  const toggle = page.getByLabel('Show message text in History & audit', { exact: true });

  await expect(toggle).not.toBeChecked();
  await expect(page.getByText(textAccessHint, { exact: true })).toBeVisible();
  const sent = page.waitForRequest(
    (request) => request.method() === 'PUT' && request.url().endsWith('/settings'),
  );

  await toggle.check();
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  expect((await sent).postDataJSON()).toMatchObject({ messageTextAccess: true });
  await page.reload();
  await expect(toggle).toBeChecked();
  await context.setOffline(true);

  await expect(toggle).toBeDisabled();
});
