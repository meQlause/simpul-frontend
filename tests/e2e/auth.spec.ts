import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

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
  await expect(page.getByRole('status')).toHaveText('Showing 0 of 0 work items');
});

const forbidden = {
  error: { code: 'E-FORBIDDEN', message: '', details: [], requestId: 'not-admin' },
};
const identity = {
  person: { name: 'Budi Santoso', roleName: 'Warehouse Lead' },
  workspace: {
    name: 'Point Star',
    descriptor: 'Operations',
    timezone: 'Asia/Jakarta',
    counts: { members: 1, channels: 1, activeRules: 1 },
  },
};
const page = { nextCursor: null, total: 0 };

test('Auth acceptance 2: a wrong password shows the error, empties the password, keeps the email', async ({
  page: browser,
}) => {
  await browser.route('**/api/auth/sign-in/email', (route) =>
    route.fulfill({ status: 401, json: { code: 'INVALID_EMAIL_OR_PASSWORD' } }),
  );
  await browser.goto('/sign-in');
  await browser.getByLabel('Email', { exact: true }).fill('siti@pointstar.example');
  await browser.getByLabel('Password', { exact: true }).fill('wrong');
  await browser.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(browser.getByRole('alert')).toHaveText('The email or password is incorrect.');
  await expect(browser.getByLabel('Password', { exact: true })).toHaveValue('');
  await expect(browser.getByLabel('Email', { exact: true })).toHaveValue('siti@pointstar.example');
});

test('Auth acceptance 3: the story side is hidden from assistive tech and Email takes focus first', async ({
  page: browser,
}) => {
  await browser.goto('/sign-in');
  await expect(browser.locator('.auth-story')).toHaveAttribute('aria-hidden', 'true');
  await browser.keyboard.press('Tab');
  await expect(browser.getByLabel('Email', { exact: true })).toBeFocused();
});

test('Auth acceptance 4 and 5: mismatched passwords send nothing, matching ones go to sign-in', async ({
  page: browser,
}) => {
  const bodies: unknown[] = [];

  await browser.route('**/api/auth/reset-password', async (route) => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({ json: { status: true } });
  });
  await browser.goto('/set-password?token=one-time');
  await expect(browser.getByRole('heading', { name: 'Set your password.' })).toBeVisible();
  await browser.getByLabel('New password', { exact: true }).fill('one-password');
  await browser.getByLabel('Confirm password', { exact: true }).fill('another');
  await browser.getByRole('button', { name: 'Save password', exact: true }).click();
  await expect(browser.getByRole('alert')).toHaveText('The two passwords do not match.');
  expect(bodies).toHaveLength(0);
  await browser.getByLabel('Confirm password', { exact: true }).fill('one-password');
  await browser.getByRole('button', { name: 'Save password', exact: true }).click();
  await expect(browser).toHaveURL(/\/sign-in$/);
  expect(bodies).toEqual([{ newPassword: 'one-password', token: 'one-time' }]);
});

test('Auth acceptance 6 and 7: a non-admin sees no access with their name, and sign out ends the session', async ({
  page: browser,
}) => {
  let signedOut = false;

  await browser.route('**/api/v1/**', async (route) => {
    if (signedOut) {
      await route.fulfill({
        status: 401,
        json: { error: { code: 'E-AUTH-REQUIRED', message: '', details: [], requestId: 'out' } },
      });
    } else if (route.request().url().endsWith('/me')) {
      await route.fulfill({ json: { data: identity } });
    } else {
      await route.fulfill({ status: 403, json: forbidden });
    }
  });
  await browser.route('**/api/auth/sign-out', async (route) => {
    signedOut = true;
    await route.fulfill({ json: { success: true } });
  });
  await browser.goto('/work');
  await expect(browser.getByRole('heading', { name: 'No access.' })).toBeVisible();
  await expect(browser.getByText('Only workspace admins can open this panel.')).toBeVisible();
  await expect(browser.getByText('SIGNED IN AS')).toBeVisible();
  await expect(browser.locator('.drawer-person')).toContainText('Budi Santoso');
  await expect(browser.locator('.drawer-person')).toContainText('Warehouse Lead');
  await expect(browser.locator('.sidebar')).toHaveCount(0);
  await browser.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(browser.getByRole('heading', { name: 'Sign in.' })).toBeVisible();
});

test('Auth acceptance 8: the workspace drawer signs out', async ({ page: browser }) => {
  await browser.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    let data: unknown = [];

    if (url.endsWith('/me')) {
      data = identity;
    } else if (url.includes('/overview')) {
      data = { activeWork: { count: 0 } };
    }

    await route.fulfill({ json: { data, page } });
  });
  await browser.route('**/api/auth/sign-out', (route) =>
    route.fulfill({ json: { success: true } }),
  );
  await browser.goto('/work');
  await browser.locator('.workspace').click();
  await browser.getByRole('dialog').getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(browser.getByRole('heading', { name: 'Sign in.' })).toBeVisible();
});

test('Auth acceptance 9 and 10: a 375px card is one column without the motif; motion stops when reduced', async ({
  page: browser,
}) => {
  await browser.emulateMedia({ reducedMotion: 'reduce' });
  await browser.setViewportSize({ width: 375, height: 800 });
  await browser.goto('/sign-in');
  await expect(browser.locator('.auth-stage')).toBeHidden();
  const columns = await browser
    .locator('.auth-shell')
    .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length);

  expect(columns).toBe(1);
  const animations = await browser.evaluate(() =>
    document
      .getAnimations()
      .filter((animation) => animation.playState === 'running' && animation.effect !== null)
      .map((animation) => (animation as CSSAnimation).animationName)
      .filter((name) => name?.startsWith('auth-')),
  );

  expect(animations).toEqual([]);
});

test('Auth acceptance 11: the password is not kept in browser storage', async ({
  page: browser,
}) => {
  await browser.route('**/api/auth/sign-in/email', (route) => route.fulfill({ json: {} }));
  await browser.route('**/api/v1/**', (route) => route.fulfill({ json: { data: identity, page } }));
  await browser.goto('/sign-in');
  await browser.getByLabel('Email', { exact: true }).fill('siti@pointstar.example');
  await browser.getByLabel('Password', { exact: true }).fill('secret-pass-123');
  await browser.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(browser).not.toHaveURL(/sign-in/);
  const stored = await browser.evaluate(() =>
    JSON.stringify([{ ...localStorage }, { ...sessionStorage }]),
  );

  expect(stored).not.toContain('secret-pass-123');
});

test('Auth acceptance 6 and 7 against the real backend: Budi is not the admin', async ({
  page: browser,
}) => {
  test.setTimeout(120000);
  const backend = await startBackend();

  try {
    await connectBackend(browser, backend.baseUrl, 'budi@pointstar.example');
    await browser.goto('/work');
    await expect(browser.getByRole('heading', { name: 'No access.' })).toBeVisible();
    await expect(browser.locator('.drawer-person')).toContainText('Budi Santoso');
    await expect(browser.locator('.sidebar')).toHaveCount(0);
    await browser.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(browser.getByRole('heading', { name: 'Sign in.' })).toBeVisible();
    const response = await browser.request.get(`${backend.baseUrl}/api/v1/response`);

    expect(response.status()).toBe(401);
  } finally {
    backend.stop();
  }
});
