import { expect, test } from '@playwright/test';

const routes = ['/', '/work', '/queue', '/rules', '/people', '/channels', '/audit', '/settings'];
const lists = ['/work', '/queue', '/rules', '/people', '/channels', '/audit'];
const messages = {
  loading: ['Loading workspace', 'Your workspace data is loading.'],
  empty: ['No data yet', 'Connect a group or adjust your filters to get started.'],
  error: [
    'Workspace could not be loaded',
    'Your settings were not changed. Retry when the service is available.',
  ],
  offline: [
    'You are offline',
    'Editing and activation are unavailable until connectivity returns.',
  ],
  'not-found': ['This page is unavailable', 'Return to Home to continue.'],
};

for (const path of routes) {
  for (const state of ['loading', 'error', 'offline', 'not-found'] as const) {
    test(`${path} renders ScreenState ${state} with the mockup's copy`, async ({
      page,
      context,
    }) => {
      await page.route('**/api/v1/**', async (route) => {
        if (state === 'loading') {
          return;
        }

        const code = state === 'not-found' ? 'E-NOT-FOUND' : 'E-INTERNAL';

        await route.fulfill({
          status: 500,
          json: { error: { code, message: '', details: [], requestId: 'state-test' } },
        });
      });

      if (state === 'offline') {
        await page.goto('/');
        await context.setOffline(true);
        await page.evaluate((routePath) => {
          history.pushState(null, '', routePath);
          dispatchEvent(new PopStateEvent('popstate'));
        }, path);
      } else {
        await page.goto(path);
      }

      const screen = page.getByRole('status');

      await expect(screen).toHaveAttribute('data-component', 'ScreenState');
      await expect(screen).toHaveAttribute('data-variant', state);
      await expect(screen.getByRole('heading')).toHaveText(messages[state][0]);
      await expect(screen.getByText(messages[state][1], { exact: true })).toBeVisible();
    });
  }
}

for (const path of lists) {
  test(`${path} renders ScreenState empty after a zero-row response`, async ({ page }) => {
    await page.route('**/api/v1/**', async (route) => {
      await route.fulfill({
        json: {
          data: [],
          page: { nextCursor: null, total: 0 },
          counts: { unrouted: 0, alias: 0, category: 0, routing: 0, work: 0, queue: 0, digest: 0 },
          weeklyEstimate: 0,
        },
      });
    });
    await page.goto(path);

    const screen = page.getByRole('status');

    await expect(screen).toHaveAttribute('data-variant', 'empty');
    await expect(screen.getByRole('heading')).toHaveText(messages.empty[0]);
    await expect(screen.getByText(messages.empty[1], { exact: true })).toBeVisible();
  });
}

test('an unknown route renders the not-found state', async ({ page }) => {
  await page.goto('/unknown-page');
  await expect(page.getByRole('status')).toHaveAttribute('data-variant', 'not-found');
});

for (const path of ['/', '/settings']) {
  test(`${path} remains ready with its populated object response`, async ({ page }) => {
    let release: (() => void) | undefined;
    const responseReady = new Promise<void>((resolve) => {
      release = resolve;
    });

    await page.route('**/api/v1/**', async (route) => {
      await responseReady;
      await route.fulfill({
        json: {
          data: {
            messagesUnderstood: { count: 0, trendPercent: null },
            activeWork: { count: 0, completedToday: 0 },
            updatesDelivered: { count: 0, recipients: 0, topRecipients: [] },
            needsReview: { count: 0, areas: 0, byKind: { unrouted: 0, alias: 0, category: 0 } },
            quietStart: '21:00',
            quietEnd: '07:00',
            budgetPerHour: 6,
            digestTime: '08:30',
            holdSeconds: 60,
            timezone: 'Asia/Jakarta',
          },
        },
      });
    });
    await page.goto(path);
    await expect(page.getByRole('status')).toHaveAttribute('data-variant', 'loading');
    release?.();
    await expect(page.getByRole('main')).toBeAttached();
    await expect(page.getByRole('status')).toHaveCount(0);
  });
}
