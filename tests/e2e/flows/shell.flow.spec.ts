import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  test.setTimeout(120000);
  backend = await startBackend();
});
test.afterAll(() => backend?.stop());
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});
test.beforeEach(async ({ page }) => {
  await connectBackend(page, backend.baseUrl);
  await page.goto('/');
});

const pages = [
  ['Work', 'Work', '/work'],
  ['Needs attention', 'Needs review', '/queue'],
  ['History & audit', 'History & audit', '/audit'],
  ['Notification rules', 'Notification rules', '/rules'],
  ['People & structure', 'People & structure', '/people'],
  ['Channels', 'Channels', '/channels'],
  ['Settings', 'Settings', '/settings'],
] as const;

test('B-01: the eight pages are reached from the sidebar, with the breadcrumb and aria-current', async ({
  page,
}) => {
  for (const [label, title, path] of pages) {
    await page
      .getByRole('navigation')
      .getByRole('link', { name: new RegExp(`^${label}`) })
      .click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('#breadcrumb-current')).toHaveText(title);
    await expect(
      page.getByRole('navigation').getByRole('link', { name: new RegExp(`^${label}`) }),
    ).toHaveAttribute('aria-current', 'page');
  }
});

test('B-02: the top bar search opens Work with the text', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Search all work' }).fill('Sri');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/work\?q=Sri$/);
});

test('B-28: the quick guide lists four steps and the workspace drawer opens', async ({ page }) => {
  await page.getByRole('button', { name: 'Simpul guide' }).click();
  const guide = page.getByRole('dialog');

  await expect(guide.getByText('Just define the flow.')).toBeVisible();
  await expect(guide.locator('.drawer-guide > a')).toHaveCount(4);
  await guide.getByRole('button', { name: 'Got it' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('.workspace').click();
  await expect(page.getByRole('dialog').getByText('Point Star').first()).toBeVisible();
});

test('B-29: the menu button opens the sidebar on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  const menu = page.getByRole('button', { name: 'Open navigation' });

  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.sidebar')).toHaveClass(/open/);
});
