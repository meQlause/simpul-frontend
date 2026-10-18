import { expect, test } from '@playwright/test';
import { connectedWorkspace } from './helpers/database';

for (const width of [1440, 375]) {
  for (const [work, attention] of [
    [0, 0],
    [7, 48],
    [48, 7],
    [120, 120],
  ]) {
    test(`AC4: sidebar counts ${work}/${attention} share one center at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await connectedWorkspace(page);
      await page.route('**/api/v1/overview', (route) =>
        route.fulfill({ json: { data: { activeWork: { count: work } } } }),
      );
      await page.route('**/api/v1/review-items?*', (route) =>
        route.fulfill({ json: { data: [], page: { total: attention } } }),
      );
      await page.goto('/settings');

      if (width === 375) {
        await page.getByRole('button', { name: 'Open navigation' }).click();
      }

      const counters = page.locator('.sidebar .nav-count');

      await expect(counters).toHaveText([String(work), String(attention)]);
      const measurements = await counters.evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect();

          return {
            center: rect.x + rect.width / 2,
            clipped: node.scrollWidth > node.clientWidth,
            labelWraps: [...(node.parentElement?.childNodes ?? [])]
              .filter((child) => child.nodeType === Node.TEXT_NODE && child.textContent?.trim())
              .some((child) => {
                const range = document.createRange();

                range.selectNodeContents(child);

                return (
                  new Set([...range.getClientRects()].map((box) => Math.round(box.top))).size > 1
                );
              }),
          };
        }),
      );

      expect(Math.abs(measurements[0].center - measurements[1].center)).toBeLessThanOrEqual(1);
      expect(measurements.some((entry) => entry.clipped)).toBe(false);
      expect(measurements.some((entry) => entry.labelWraps)).toBe(false);
      await expect(counters.nth(1)).toHaveCSS('background-color', 'rgb(244, 240, 223)');
      await expect(counters.nth(1)).toHaveCSS('color', 'rgb(162, 127, 54)');
    });
  }
}
