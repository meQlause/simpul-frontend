import { expect, test, type Page } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>> | undefined;

test.beforeEach(async ({ page }) => {
  test.setTimeout(120000);
  backend = await startBackend();
  await connectBackend(page, backend.baseUrl);
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
  backend?.stop();
});

async function fill(page: Page, host: string) {
  await page.getByLabel('Mail server host', { exact: true }).fill(host);
  await page.getByLabel('Port', { exact: true }).fill('587');
  await page.getByLabel('Username', { exact: true }).fill('simpul@pointstar.example');
  await page.getByLabel('Password', { exact: true }).fill('mail-secret-123');
  await page.getByLabel('Sender address', { exact: true }).fill('simpul@pointstar.example');
}

test('Settings acceptance 6: with no server the drawer shows the waiting digests and empty fields', async ({
  page,
}) => {
  await page.goto('/settings');
  await page.getByRole('link', { name: /Configure/ }).click();
  const drawer = page.getByRole('dialog');

  await expect(drawer.getByText('4 digest items are waiting for a mail server.')).toBeVisible();

  for (const label of ['Mail server host', 'Port', 'Username', 'Password', 'Sender address']) {
    await expect(drawer.getByLabel(label, { exact: true })).toHaveValue('');
  }
});

test('Settings acceptance 7 and 9: a saved server toasts, reopens without notice, and keeps the password out of storage', async ({
  page,
}) => {
  await page.goto('/settings/mail');
  await fill(page, 'smtp.pointstar.example');
  await page.getByRole('button', { name: 'Save mail server', exact: true }).click();

  await expect(page.getByRole('status')).toHaveText('Mail server saved.');
  await page.getByRole('link', { name: /Configure/ }).click();
  const drawer = page.getByRole('dialog');

  await expect(drawer.getByLabel('Mail server host', { exact: true })).toHaveValue(
    'smtp.pointstar.example',
  );
  await expect(drawer.getByText(/waiting for a mail server/)).toHaveCount(0);
  await expect(drawer.getByLabel('Password', { exact: true })).toHaveValue('');

  const html = await page.content();
  const stored = await page.evaluate(() =>
    JSON.stringify([{ ...localStorage }, { ...sessionStorage }]),
  );

  expect(html).not.toContain('mail-secret-123');
  expect(stored).not.toContain('mail-secret-123');
});

test('Settings acceptance 8: a refused server shows the sentence, keeps the fields and empties the password', async ({
  page,
}) => {
  await page.goto('/settings/mail');
  await fill(page, 'smtp.unreachable.example');
  await page.getByRole('button', { name: 'Save mail server', exact: true }).click();
  const drawer = page.getByRole('dialog');

  await expect(
    drawer.getByText('The mail server could not be reached with these details. Nothing was saved.'),
  ).toBeVisible();
  await expect(drawer.getByLabel('Mail server host', { exact: true })).toHaveValue(
    'smtp.unreachable.example',
  );
  await expect(drawer.getByLabel('Port', { exact: true })).toHaveValue('587');
  await expect(drawer.getByLabel('Username', { exact: true })).toHaveValue(
    'simpul@pointstar.example',
  );
  await expect(drawer.getByLabel('Sender address', { exact: true })).toHaveValue(
    'simpul@pointstar.example',
  );
  await expect(drawer.getByLabel('Password', { exact: true })).toHaveValue('');
});
