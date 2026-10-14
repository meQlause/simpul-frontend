import { expect, test, type Page } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

const PAGES = ['/', '/work', '/queue', '/rules', '/people', '/channels', '/audit', '/settings'];
const WIDTHS = [1440, 900, 375];

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  test.setTimeout(120000);
  backend = await startBackend();
});
test.afterAll(() => backend?.stop());
test.beforeEach(async ({ page }) => {
  await connectBackend(page, backend.baseUrl);
});

const fontSize = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((node) => getComputedStyle(node).fontSize);

test('T24: on /channels at 1440 every text is the mockup size plus 2px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/channels');
  await expect(page.locator('.page-title')).toBeVisible();

  expect(await fontSize(page, 'body')).toBe('15px');
  expect(await fontSize(page, '.page-title')).toBe('32px');
  expect(await fontSize(page, '.page-heading .eyebrow')).toBe('11px');
  expect(await fontSize(page, '.nav-item')).toBe('14px');
  expect(await fontSize(page, 'main .badge')).toBe('11px');

  await page.setViewportSize({ width: 1600, height: 900 });
  expect(await fontSize(page, '.page-title')).toBe('36px');
});

for (const [width, size] of [
  [1440, '27px'],
  [375, '24px'],
] as const) {
  test(`T24: the work drawer title is ${size} at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/work/ORD-0091');
    const title = page.getByRole('dialog').locator('#drawer-title');

    await expect(title).toBeVisible();
    expect(await title.evaluate((node) => getComputedStyle(node).fontSize)).toBe(size);
  });
}

// What is cut or wrapped on screen. A name cell with a title carries the FD-13 ellipsis on
// purpose; the table wrapper scrolls on purpose.
function clipped(page: Page) {
  return page.evaluate(() => {
    const visible = (node: Element) => node.getClientRects().length > 0;
    const cuts = (node: Element) => {
      const style = getComputedStyle(node);
      const hides =
        ['hidden', 'clip'].includes(style.overflowX) || style.textOverflow === 'ellipsis';

      return hides && node.scrollWidth > node.clientWidth + 1;
    };

    const wraps = (item: Element) =>
      [...item.childNodes]
        .filter((child) => child.nodeType === Node.TEXT_NODE && child.textContent?.trim())
        .some((child) => {
          const range = document.createRange();

          range.selectNodeContents(child);

          return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size > 1;
        });
    const nav = [...document.querySelectorAll('.nav-item')]
      .filter(visible)
      .filter((item) => item.scrollWidth > item.clientWidth + 1 || wraps(item))
      .map((item) => `nav: ${item.textContent?.trim()}`);
    const cells = [...document.querySelectorAll('td, td *')]
      .filter(visible)
      .filter((node) => !node.closest('[title]') && cuts(node))
      .map((node) => `cell: ${node.textContent?.trim().slice(0, 40)}`);

    return {
      scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      cut: [...nav, ...cells],
    };
  });
}

for (const width of WIDTHS) {
  for (const path of PAGES) {
    test(`T26: ${path} at ${width}px has no page scroll and nothing clipped`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('[data-variant="loading"]')).toHaveCount(0);

      const found = await clipped(page);

      expect(found.scroll).toBeLessThanOrEqual(0);
      expect(found.cut).toEqual([]);
    });
  }
}
