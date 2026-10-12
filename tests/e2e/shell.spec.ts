import { expect, test } from '@playwright/test';
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

    for (const name of [
      'Point Star',
      'Operations workspace',
      'Siti Aminah',
      'Operations Manager',
    ]) {
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

test('At 760px the menu button opens the sidebar and sets aria-expanded=true (shell acceptance 5)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 760, height: 900 });
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
