import { expect, test } from '@playwright/test';

test('Ctrl K focuses the search field; the skip link moves focus to #page-content', async ({
  page,
}) => {
  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill({ json: { data: [] } });
  });
  await page.goto('/work');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('searchbox', { name: 'Search all work' })).toBeFocused();
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
            workspace: { name: 'Point Star', descriptor: 'Operations workspace' },
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
