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
