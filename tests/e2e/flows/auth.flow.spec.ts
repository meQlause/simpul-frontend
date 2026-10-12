import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

async function signedOut(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/**', (route) =>
    route.fulfill({
      status: 401,
      json: { error: { code: 'E-AUTH-REQUIRED', message: '', details: [], requestId: 'flow' } },
    }),
  );
}

test('B-30: a wrong password says so and clears the field; nothing animates', async ({ page }) => {
  await signedOut(page);
  await page.route('**/api/auth/sign-in/email', (route) =>
    route.fulfill({ status: 401, json: { message: 'Invalid' } }),
  );
  await page.goto('/sign-in');
  await page.getByLabel('Email', { exact: true }).fill('siti@pointstar.example');
  await page.getByLabel('Password', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await expect(page.getByText('The email or password is incorrect.')).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('B-31: two different passwords are refused before anything is sent', async ({ page }) => {
  await signedOut(page);
  let sent = 0;

  await page.route('**/api/auth/**', async (route) => {
    sent += 1;
    await route.fallback();
  });
  await page.goto('/set-password');
  await page.getByLabel('New password', { exact: true }).fill('one-password');
  await page.getByLabel('Confirm password', { exact: true }).fill('another');
  await page.getByRole('button', { name: /password/i }).click();

  await expect(page.getByRole('alert').filter({ hasText: /./ }).first()).toBeVisible();
  expect(sent).toBe(0);
});

test('B-32: a signed-in person without access sees who they are and can sign out', async ({
  page,
}) => {
  await page.route('**/api/v1/**', (route) => {
    if (route.request().url().endsWith('/me')) {
      return route.fulfill({
        json: { data: { person: { name: 'Budi Santoso', roleName: 'Warehouse Lead' } } },
      });
    }

    return route.fulfill({
      status: 403,
      json: { error: { code: 'E-FORBIDDEN', message: '', details: [], requestId: 'flow' } },
    });
  });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /No access/ })).toBeVisible();
  await expect(page.getByText('Budi Santoso')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
});
