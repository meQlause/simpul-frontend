import { expect, test, type Page } from '@playwright/test';
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

const NO_DECISIONS = {
  data: [],
  page: { nextCursor: null, total: 0 },
  counts: { routing: 0, work: 0, queue: 0, digest: 0 },
};
const NO_MESSAGES = {
  data: [],
  page: { nextCursor: null, total: 0 },
  counts: { created: 0, attached: 0, held: 0, rejected: 0, ignored: 0, pending: 0 },
};

async function expectAuditHeading(page: Page, active: 'Decisions' | 'Messages') {
  await expect(page.getByText('EVERY DECISION HAS A REASON', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'History & audit', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'About History & audit' })).toBeVisible();
  const tabs = page.getByRole('navigation', { name: 'Audit pages' });

  await expect(tabs.getByRole('link', { name: active, exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
}

test('AC3: empty Decisions keeps the heading and both tabs, and Messages is reachable', async ({
  page,
}) => {
  await connectedWorkspace(page);
  await page.route('**/api/v1/decisions*', (route) => route.fulfill({ json: NO_DECISIONS }));
  await page.route('**/api/v1/messages*', (route) => route.fulfill({ json: NO_MESSAGES }));
  await page.goto('/audit');
  await expectAuditHeading(page, 'Decisions');
  await expect(page.locator('[data-component="ScreenState"]')).toBeVisible();
  await page.getByRole('link', { name: 'Messages', exact: true }).click();
  await expect(page).toHaveURL(/\/audit\?tab=messages$/);
  await expectAuditHeading(page, 'Messages');
  await page.getByRole('link', { name: 'Decisions', exact: true }).click();
  await expectAuditHeading(page, 'Decisions');
});

test('AC3: loading Decisions keeps the heading and both tabs', async ({ page }) => {
  await connectedWorkspace(page);
  await page.route('**/api/v1/decisions*', () => undefined);
  await page.goto('/audit');
  await expectAuditHeading(page, 'Decisions');
});

test('AC3: failed Decisions keeps the heading and both tabs above the retry', async ({ page }) => {
  await connectedWorkspace(page);
  await page.route('**/api/v1/decisions*', (route) =>
    route.fulfill({
      status: 500,
      json: { error: { code: 'E-INTERNAL', message: '', details: [], requestId: 'audit' } },
    }),
  );
  await page.goto('/audit');
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await expectAuditHeading(page, 'Decisions');
});
