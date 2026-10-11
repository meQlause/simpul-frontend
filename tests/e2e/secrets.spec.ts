import { expect, test, type Page } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

async function expectNoSecret(page: Page, secret: string) {
  const stored = await page.evaluate(() =>
    JSON.stringify([{ ...localStorage }, { ...sessionStorage }]),
  );

  expect(stored).not.toContain(secret);
  expect(await page.content()).not.toContain(secret);
  expect(page.url()).not.toContain(secret);
  const fields = await page.evaluate(() =>
    [...document.querySelectorAll('input[type="password"]')].map(
      (input) => (input as HTMLInputElement).value,
    ),
  );

  expect(fields.filter(Boolean)).toEqual([]);
}

test('Sign-in: a wrong and a right password leave no trace in storage, HTML or URL', async ({
  page,
}) => {
  const secret = 'sign-in-secret-4431';
  let accept = false;

  await page.route('**/api/auth/sign-in/email', (route) =>
    accept ? route.fulfill({ json: {} }) : route.fulfill({ status: 401, json: {} }),
  );
  await page.route('**/api/v1/**', (route) =>
    route.fulfill({ json: { data: route.request().url().endsWith('/me') ? {} : [] } }),
  );
  await page.goto('/sign-in');
  await page.getByLabel('Email', { exact: true }).fill('siti@pointstar.example');
  await page.getByLabel('Password', { exact: true }).fill(secret);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('The email or password is incorrect.');
  await expectNoSecret(page, secret);
  accept = true;
  await page.getByLabel('Password', { exact: true }).fill(secret);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).not.toHaveURL(/sign-in/);
  await expectNoSecret(page, secret);
});

async function submitNewPassword(page: Page, secret: string) {
  await page.getByLabel('New password', { exact: true }).fill(secret);
  await page.getByLabel('Confirm password', { exact: true }).fill(secret);
  await page.getByRole('button', { name: 'Save password', exact: true }).click();
}

test('Set password: a refused and a saved password leave no trace in storage, HTML or URL', async ({
  page,
}) => {
  const secret = 'new-password-8820';
  let accept = false;

  await page.route('**/api/auth/reset-password', (route) =>
    accept ? route.fulfill({ json: {} }) : route.fulfill({ status: 400, json: {} }),
  );
  await page.goto('/set-password?token=one-time-link');
  await submitNewPassword(page, secret);
  await expect(page.getByRole('alert')).toHaveText('Your changes were not saved. Try again.');
  await expectNoSecret(page, secret);
  accept = true;
  await submitNewPassword(page, secret);
  await expect(page).toHaveURL(/\/sign-in$/);
  await expectNoSecret(page, secret);
  await expectNoSecret(page, 'one-time-link');
});

test.describe('mail server', () => {
  let backend: Awaited<ReturnType<typeof startBackend>>;

  test.beforeAll(async () => {
    test.setTimeout(120000);
    backend = await startBackend();
  });
  test.afterAll(() => backend?.stop());
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'wait' });
  });

  test('Mail: a refused and a saved password leave no trace in storage, HTML or URL', async ({
    page,
  }) => {
    const secret = 'mail-secret-5512';

    await connectBackend(page, backend.baseUrl);
    await page.goto('/settings/mail');

    for (const host of ['smtp.unreachable.example', 'smtp.pointstar.example']) {
      await page.getByLabel('Mail server host', { exact: true }).fill(host);
      await page.getByLabel('Port', { exact: true }).fill('587');
      await page.getByLabel('Username', { exact: true }).fill('simpul@pointstar.example');
      await page.getByLabel('Password', { exact: true }).fill(secret);
      await page.getByLabel('Sender address', { exact: true }).fill('simpul@pointstar.example');
      await page.getByRole('button', { name: 'Save mail server', exact: true }).click();
      await expect(page.getByRole('alert').or(page.getByRole('status')).first()).toBeVisible();
      await expectNoSecret(page, secret);
    }
  });
});
