import { expect, test } from '@playwright/test';

test('Playwright with Chromium runs one passing spec locally and in CI (SR-4)', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByRole('main')).toHaveAttribute('id', 'page-content');
});
