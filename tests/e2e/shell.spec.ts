import { expect, test, type Page } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

test('Ctrl K focuses the search field; the skip link moves focus to #page-content', async ({
  page,
}) => {
  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill({ json: { data: [] } });
  });
  await page.goto('/work');
  const skip = page.getByRole('link', { name: 'Skip to content' });

  await expect(skip).toBeAttached();
  await page.waitForLoadState('networkidle');
  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('searchbox', { name: 'Search all work' })).toBeFocused();
});

test.describe('shell against the real API', () => {
  let backend: Awaited<ReturnType<typeof startBackend>>;

  test.beforeAll(async () => {
    test.setTimeout(120000);
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

  test('Shell acceptance 2: searching sri from Work navigates to /work?q=sri and lists ORD-0091', async ({
    page,
  }) => {
    await page.goto('/work');
    await expect(page.getByRole('row')).toHaveCount(26);
    const search = page.getByRole('searchbox', { name: 'Search all work', exact: true });

    await search.fill('sri');
    await search.press('Enter');
    await expect(page).toHaveURL('/work?q=sri');
    await expect(page.getByRole('row')).toHaveCount(2);
    await expect(page.getByRole('link', { name: 'ORD-0091', exact: true })).toBeVisible();
  });

  test('Shell acceptance 1: Point Star and Siti Aminah come from the real session', async ({
    page,
  }) => {
    const sidebar = page.getByRole('complementary', { name: 'Main navigation' });
    // The workspace switcher sits at the top right (fidelity FD-24); the person stays below.
    const topbar = page.locator('.topbar');

    for (const name of ['Point Star', 'Operations workspace']) {
      await expect(topbar.getByText(name, { exact: true })).toBeVisible();
    }

    for (const name of ['Siti Aminah', 'Operations Manager']) {
      await expect(sidebar.getByText(name, { exact: true })).toBeVisible();
    }

    await expect(sidebar.getByRole('link', { name: 'Work 48', exact: true })).toBeVisible();
    await expect(
      sidebar.getByRole('link', { name: 'Needs attention 7', exact: true }),
    ).toBeVisible();
  });

  test('Shell acceptance 4: the workspace drawer shows real counts and timezone', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: 'Point Star Operations workspace', exact: true })
      .click();
    const drawer = page.getByRole('dialog');

    for (const value of [
      '4 people across operational roles',
      '3 Telegram groups',
      '3 notification rules',
      'WIB · Asia/Jakarta · UTC+7',
    ]) {
      await expect(drawer.getByText(value, { exact: true })).toBeVisible();
    }

    await drawer.getByRole('button', { name: 'Back to workspace', exact: true }).click();
    await expect(drawer).toHaveCount(0);
  });

  test('Shell acceptance 6: an expired session returns to its page after signing in', async ({
    page,
    context,
  }) => {
    await expect(page.getByLabel('Daily digest', { exact: true })).toBeVisible();
    const expired = await page.request.post(`${backend.baseUrl}/api/auth/sign-out`, {
      data: {},
      headers: { Origin: new URL(page.url()).origin },
    });

    expect(expired.ok(), await expired.text()).toBe(true);
    await context.clearCookies();
    const session = await page.request.get(`${backend.baseUrl}/api/v1/me`);

    expect(session.status(), await session.text()).toBe(401);
    await page.reload();
    await expect(page).toHaveURL('/sign-in');
    await page.getByLabel('Email', { exact: true }).fill('admin@pointstar.example');
    await page.getByLabel('Password', { exact: true }).fill('test-password-123');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL('/settings');
    await expect(page.getByLabel('Daily digest', { exact: true })).toHaveValue('08:30');
  });
});

async function stubShell(page: Page) {
  await page.route('**/api/v1/**', async (route) => {
    if (route.request().url().endsWith('/me')) {
      await route.fulfill({
        json: {
          data: {
            person: { name: 'Siti Aminah', roleName: 'Operations Manager' },
            workspace: {
              name: 'Point Star',
              descriptor: 'Operations workspace',
              timezone: 'Asia/Jakarta',
              counts: { members: 4, channels: 3, activeRules: 3 },
            },
          },
        },
      });

      return;
    }

    const data = route.request().url().endsWith('/overview') ? { activeWork: { count: 48 } } : [];

    await route.fulfill({ json: { data, page: { total: 7 } } });
  });
}

test('At 760px the menu button opens the sidebar and sets aria-expanded=true (shell acceptance 5)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await stubShell(page);
  await page.goto('/work');
  const menu = page.getByRole('button', { name: 'Open navigation' }),
    sidebar = page.getByRole('complementary', { name: 'Main navigation' });

  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(sidebar).not.toBeInViewport();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(sidebar).toBeInViewport();
  await expect(sidebar.getByRole('link', { name: 'Work 48', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(sidebar.getByRole('link', { name: 'Needs attention 7', exact: true })).toBeVisible();
  await expect(sidebar.getByText('Siti Aminah', { exact: true })).toBeVisible();
  await page.keyboard.press('Space');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(sidebar).not.toBeInViewport();
});

test('A window shorter than the sidebar keeps brand and profile; only the menu scrolls (fidelity FD-22)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 760 });
  await stubShell(page);
  await page.goto('/work');
  const sidebar = page.getByRole('complementary', { name: 'Main navigation' });

  await expect(sidebar.getByText('Siti Aminah', { exact: true })).toBeInViewport();
  await page.setViewportSize({ width: 1440, height: 560 });
  // The sidebar itself never scrolls: the brand and the profile stay; only the menu does.
  await expect(sidebar.getByText('Siti Aminah', { exact: true })).toBeInViewport();
  await expect(sidebar.locator('.brand')).toBeInViewport();
  expect(await sidebar.evaluate((node) => node.scrollHeight - node.clientHeight)).toBe(0);
  await sidebar.getByRole('link', { name: 'Settings' }).scrollIntoViewIfNeeded();
  await expect(sidebar.getByRole('link', { name: 'Settings' })).toBeInViewport();
});

async function stubAccount(
  page: Page,
  name: string,
  roleName: string | null,
  descriptor: string | null,
) {
  await stubShell(page);
  const identity = {
    person: { name, roleName },
    workspace: {
      name: 'Simpul',
      descriptor,
      timezone: 'Asia/Jakarta',
      counts: { members: 1, channels: 0, activeRules: 0 },
    },
  };

  await page.route('**/api/v1/me', (route) => route.fulfill({ json: { data: identity } }));

  return identity;
}

for (const [roleName, descriptor] of [
  [null, 'Operations workspace'],
  ['Administrator', null],
  [null, null],
]) {
  test(`AC5: nullable role ${roleName} and descriptor ${descriptor} keep workspace controls usable`, async ({
    page,
  }) => {
    await stubAccount(page, 'Ardial', roleName, descriptor);
    await page.goto('/work');
    const workspace = page.locator('.topbar .workspace');

    await expect(workspace).toBeEnabled();
    await expect(workspace).toContainText('Simpul');
    await expect(workspace.locator('.workspace-logo')).toHaveText('S');
    await expect(page.locator('.sidebar .profile-avatar')).toHaveText('A');
    await expect(page.locator('.sidebar .profile small')).toHaveText(roleName ?? '');
    await expect(workspace.locator('.workspace-copy small')).toHaveText(descriptor ?? '');
    await workspace.click();
    await expect(page.getByRole('dialog')).toHaveAccessibleName('Simpul');
  });
}

for (const [name, letters] of [
  ['Ardial', 'A'],
  ['Siti Aminah', 'SA'],
]) {
  test(`AC6 AC7: ${name} opens their account with initials and keyboard access`, async ({
    page,
  }) => {
    await stubAccount(page, name, 'Administrator', null);
    await page.goto('/work');
    const profile = page.locator('.sidebar .profile');

    await expect(profile).toHaveRole('button');
    await expect(profile.locator('.profile-avatar')).toHaveText(letters);
    await profile.focus();
    await page.keyboard.press('Enter');
    const drawer = page.getByRole('dialog');

    await expect(drawer).toHaveAccessibleName(name);
    await expect(drawer.locator('.drawer-person small')).toHaveText('Administrator');
    await expect(drawer.locator('.drawer-person small')).toBeVisible();
    await expect(drawer.locator('.avatar')).toHaveText(letters);
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(profile).toBeFocused();
  });

  test(`AC6 AC7: ${name} closes their account without editing and People stays separate`, async ({
    page,
  }) => {
    await stubAccount(page, name, 'Administrator', null);
    await page.goto('/work');
    const profile = page.locator('.sidebar .profile');

    await profile.click();
    const drawer = page.getByRole('dialog');

    await expect(drawer).toHaveAccessibleName(name);
    await expect(drawer.locator('input, textarea, select')).toHaveCount(0);
    await expect(drawer.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
    await expect(page).toHaveURL('/work');
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(drawer).toHaveCount(0);
    await expect(profile).toBeFocused();
    await page.getByRole('link', { name: 'People & structure', exact: true }).click();
    await expect(page).toHaveURL('/people');
  });
}

test('AC7: account Sign out ends the session and clears the previous identity cache', async ({
  page,
}) => {
  const identity = await stubAccount(page, 'Ardial', 'Administrator', 'Operations workspace');
  let signOutRequests = 0;

  await page.route('**/api/auth/sign-out', async (route) => {
    expect(route.request().method()).toBe('POST');
    signOutRequests += 1;
    await route.fulfill({ json: { success: true } });
  });
  await page.route('**/api/auth/sign-in/email', (route) => route.fulfill({ json: {} }));
  await page.goto('/work');
  await page.locator('.sidebar .profile').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/sign-in');
  expect(signOutRequests).toBe(1);
  identity.person.name = 'Budi Santoso';
  await page.getByLabel('Email', { exact: true }).fill('budi@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-password-123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('.sidebar .profile')).toContainText('Budi Santoso');
  await expect(page.locator('.sidebar .profile')).not.toContainText('Ardial');
});
