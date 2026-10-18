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

const EMPTY_OVERVIEW = {
  data: {
    messagesUnderstood: { count: 0, trendPercent: null },
    activeWork: { count: 0, completedToday: 0 },
    updatesDelivered: { count: 0, recipients: 0, topRecipients: [] },
    needsReview: { count: 0, areas: 0, byKind: { unrouted: 0, alias: 0, category: 0 } },
  },
};

for (const width of [1440, 375]) {
  test(`AC1: empty Home keeps its dashboard without the top empty panel at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await connectedWorkspace(page);
    await page.route('**/api/v1/overview?*', (route) => route.fulfill({ json: EMPTY_OVERVIEW }));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Good morning, Siti.' })).toBeVisible();
    await expect(page.locator('.stat-card')).toHaveCount(4);
    await expect(page.locator('.stat-main strong').first()).toHaveText('0');
    await expect(page.locator('[data-component="ScreenState"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Retry', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Review onboarding' })).toBeVisible();
    await expect(page.locator('.page-footer')).toBeVisible();
  });

  test(`AC2: empty Channels keeps its heading and setup controls without the top empty panel at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await connectedWorkspace(page);
    await page.goto('/channels');
    await expect(page.getByRole('heading', { name: 'Channels', exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Add Telegram channel', exact: true }),
    ).toBeEnabled();
    await expect(page.locator('[data-component="ConnectionCard"]')).toBeVisible();
    await expect(page.locator('[data-component="ScreenState"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Retry', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Add Telegram channel', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveURL(/\/channels\/new$/);
  });
}
