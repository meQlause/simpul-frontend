import { expect, test } from '@playwright/test';

test('An error envelope with an unknown code renders as E-INTERNAL (error-handling §5)', async ({
  page,
}) => {
  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill({
      status: 500,
      json: {
        error: {
          code: 'E-FUTURE-CODE',
          message: 'Untrusted server text',
          details: [],
          requestId: 'unknown-code-test',
        },
      },
    });
  });
  await page.goto('/people');
  const screen = page.getByRole('status');

  await expect(screen).toHaveAttribute('data-variant', 'error');
  await expect(screen.getByRole('heading')).toHaveText('Workspace could not be loaded');
  await expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible();
  await expect(page.getByText('Untrusted server text')).toHaveCount(0);
});
