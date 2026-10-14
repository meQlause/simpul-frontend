import { expect, test, type Page } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

const SENTENCE = 'One Telegram connection. A clear policy for every group.';
const about = (page: Page) => page.getByRole('button', { name: 'About Channels', exact: true });
const tip = (page: Page) => page.getByRole('tooltip');

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  test.setTimeout(60000);
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
  await page.goto('/channels');
});

test('T5: hovering About Channels shows the sentence, and moving away hides it', async ({
  page,
}) => {
  await expect(page.locator('.page-description')).toHaveCount(0);

  await about(page).hover();
  await expect(tip(page)).toHaveText(SENTENCE);

  await page.mouse.move(0, 0);
  await expect(tip(page)).toBeHidden();
});

test('T9: the button is named About Channels and is described by the sentence while closed', async ({
  page,
}) => {
  await expect(tip(page)).toBeHidden();
  await expect(about(page)).toHaveAccessibleDescription(SENTENCE);
});

test('T7: focus shows the sentence, and Tab away hides it', async ({ page }) => {
  await about(page).focus();
  await expect(tip(page)).toHaveText(SENTENCE);

  await page.keyboard.press('Tab');
  await expect(tip(page)).toBeHidden();
});

test('T8: Escape hides the sentence and leaves focus on the button', async ({ page }) => {
  await about(page).focus();
  await expect(tip(page)).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(tip(page)).toBeHidden();
  await expect(about(page)).toBeFocused();
});

test.describe('on a 375px phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test('T6: a tap shows the sentence, and a tap outside hides it', async ({ page }) => {
    await about(page).tap();
    await expect(tip(page)).toHaveText(SENTENCE);

    await page.locator('h1').tap();
    await expect(tip(page)).toBeHidden();
  });

  test('T11: an open tip is at most 280px wide and inside the viewport', async ({ page }) => {
    await about(page).tap();
    // No box means no open tip: the sentinel fails every check below.
    const box = (await tip(page).boundingBox()) ?? { x: -1, y: 0, width: Infinity, height: 0 };

    expect(box.width).toBeLessThanOrEqual(280);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
  });
});
