import { expect, test, type Page } from '@playwright/test';

async function signedOut(page: Page) {
  await page.route('**/api/v1/**', (route) =>
    route.fulfill({
      status: 401,
      json: { error: { code: 'E-AUTH-REQUIRED', message: '', details: [], requestId: 'button' } },
    }),
  );
}

test('Button: hover and focus-visible change how it looks', async ({ page }) => {
  await signedOut(page);
  await page.goto('/sign-in');
  const button = page.getByRole('button', { name: 'Sign in', exact: true });
  const background = () => button.evaluate((node) => getComputedStyle(node).backgroundColor);
  const resting = await background();

  await button.hover();
  await expect.poll(background).not.toBe(resting);
  await page.mouse.move(0, 0);
  await page.getByLabel('Password', { exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  expect(await button.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe('none');
});

test('Button: pending blocks a second click and keeps the label', async ({ page }) => {
  await signedOut(page);
  let sent = 0;

  await page.route('**/api/auth/sign-in/email', async () => {
    sent += 1;
    await new Promise(() => undefined);
  });
  await page.goto('/sign-in');
  await page.getByLabel('Email', { exact: true }).fill('siti@pointstar.example');
  await page.getByLabel('Password', { exact: true }).fill('a-password');
  const button = page.getByRole('button', { name: 'Sign in', exact: true });

  await button.click();
  await expect(button).toBeDisabled();
  expect(sent).toBe(1);
  await expect(button).toHaveText('Sign in');
});
