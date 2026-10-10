import { expect, test } from '@playwright/test';

test('A response E-AUTH-REQUIRED navigates to /sign-in and remembers the page it left', async ({
  page,
}) => {
  let signedIn = false;
  await page.route('**/api/v1/**', async (route) => {
    if (!signedIn) {
      await route.fulfill({
        status: 401,
        json: {
          error: {
            code: 'E-AUTH-REQUIRED',
            message: '',
            details: [],
            requestId: 'expired-session',
          },
        },
      });
      return;
    }
    const data = route.request().url().endsWith('/me') ? {} : [];
    await route.fulfill({ json: { data, page: { nextCursor: null, total: 0 } } });
  });
  await page.route('**/api/auth/sign-in/email', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: 'siti@pointstar.example',
      password: 'correct-password',
    });
    signedIn = true;
    await route.fulfill({ json: {} });
  });
  await page.goto('/work?q=sri#results');
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.locator('.topbar, .sidebar')).toHaveCount(0);
  await page.getByLabel('Email', { exact: true }).fill('siti@pointstar.example');
  await page.getByLabel('Password', { exact: true }).fill('correct-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/work\?q=sri#results$/);
  await expect(page.getByRole('status')).toHaveAttribute('data-variant', 'empty');
});
