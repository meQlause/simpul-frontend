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

const WORK_SENTENCE = 'The full picture, from the first update to the next step.';
const OWNERSHIP_SENTENCE = 'Who is responsible for the next step.';
const CALLOUT_TITLE = 'Resolve the configuration, improve the next update';
const CALLOUT_SENTENCE =
  'These are routing and vocabulary gaps. Questions about ambiguous work stay in the original conversation with the people who know.';

test.describe('in the drawers and the callouts, at 1440px', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('T10: the drawer title tip is inside the dialog; Escape hides it, and a second Escape closes the drawer', async ({
    page,
  }) => {
    await page.goto('/work/ORD-0091');
    const dialog = page.getByRole('dialog');
    const trigger = dialog
      .locator('.drawer-screen-header')
      .getByRole('button', { name: /^About / });

    await trigger.focus();

    await expect(dialog.getByRole('tooltip')).toBeVisible();
    await expect(dialog.getByRole('tooltip')).toHaveText(WORK_SENTENCE);

    await page.keyboard.press('Escape');
    await expect(dialog.getByRole('tooltip')).toBeHidden();
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('T11: an open tip in the drawer sits inside the dialog box at 1440px', async ({ page }) => {
    await page.goto('/work/ORD-0091');
    const dialog = page.getByRole('dialog');

    await dialog
      .locator('.drawer-screen-header')
      .getByRole('button', { name: /^About / })
      .hover();

    const tooltip = dialog.getByRole('tooltip');

    await expect(tooltip).toBeVisible();
    // No box means no open tip: the sentinels fail the containment checks below.
    const box = (await tooltip.boundingBox()) ?? {
      x: -1,
      y: -1,
      width: Infinity,
      height: Infinity,
    };
    const frame = (await dialog.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };

    expect(box.x).toBeGreaterThanOrEqual(frame.x);
    expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width);
    expect(box.y + box.height).toBeLessThanOrEqual(frame.y + frame.height);
  });

  test('T12: the trace drawer, held while loading, shows no info tip in its header', async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/decisions\/[^/?]+(\?|$)/, () => undefined);
    await page.goto('/audit/DEC-HELD');
    const dialog = page.getByRole('dialog');

    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.drawer-screen-header')).toBeVisible();
    await expect(
      dialog.locator('.drawer-screen-header').getByRole('button', { name: /^About/ }),
    ).toHaveCount(0);
  });

  const rows: { name: string; path: string; tip: string | RegExp; sentence: string }[] = [
    {
      name: 'the work drawer header',
      path: '/work/ORD-0091',
      tip: /^About /,
      sentence: WORK_SENTENCE,
    },
    {
      name: 'a shared drawer section',
      path: '/work/ORD-0091',
      tip: 'About Ownership',
      sentence: OWNERSHIP_SENTENCE,
    },
    {
      name: 'a shared callout',
      path: '/queue',
      tip: `About ${CALLOUT_TITLE}`,
      sentence: CALLOUT_SENTENCE,
    },
  ];

  for (const row of rows) {
    test(`T14: ${row.name} keeps its sentence in a tip, not on screen`, async ({ page }) => {
      await page.goto(row.path);

      await expect(
        page.getByRole('button', { name: row.tip, exact: typeof row.tip === 'string' }).first(),
      ).toBeVisible();
      await expect(page.getByText(row.sentence, { exact: true })).toBeHidden();
    });
  }
});
