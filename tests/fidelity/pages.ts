// How the app reaches each matrix view that is not a Home state: route, optional response shaping
// and a driver for the interaction the mockup view is captured after.
import type { Locator, Page } from '@playwright/test';

export type AppView = {
  view: string;
  path: string;
  // Intercepts responses *after* the backend hook, before the page loads.
  prepare?: (page: Page, backendUrl: string) => Promise<void>;
  steps?: (page: Page) => Promise<void>;
};

type Json = Record<string, unknown>;

// The mockup lists nine hand-written rows in a fixed order; the real API lists 125 by recency.
// The same rows, in the mockup's order, are served so row styling is compared like for like.
const WORK_ORDER = [
  'ORD-0091',
  'ORD-0098',
  'PAY-0034',
  'ORD-0095',
  'STK-0018',
  'ORD-0087',
  'ORD-0100',
  'ORD-0083',
  'ORD-0070',
];
const WORK_TOTAL = 48;

async function everyWork(page: Page, backendUrl: string): Promise<Json[]> {
  const found: Json[] = [];
  let cursor: string | null = '';

  while (cursor !== null) {
    const query: string = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
    const response = await page.request.get(`${backendUrl}/api/v1/work?limit=100${query}`);
    const body = (await response.json()) as { data: Json[]; page: { nextCursor: string | null } };

    found.push(...body.data);
    cursor = body.page.nextCursor;
  }

  return found;
}

async function mockupWork(page: Page, backendUrl: string) {
  const all = await everyWork(page, backendUrl);
  const rows = WORK_ORDER.flatMap((id) => all.filter((item) => item.displayId === id));

  await page.route(/\/api\/v1\/work(\?|$)/, async (route) => {
    if (route.request().method() !== 'GET' || route.request().url().includes('export')) {
      await route.fallback();

      return;
    }

    await route.fulfill({
      json: { data: rows, page: { total: WORK_TOTAL, nextCursor: 'more' } },
    });
  });
}

const QUEUE_ORDER = [
  'Returns need a routing rule',
  'Delivery schedule changed',
  'Customer pricing adjustment',
  'Who does “Pak Bud” refer to?',
  '“Bu Rin” is not recognized',
  'Product sample request',
  'Damaged packaging reported',
];

// The mockup lists the queue in the order its sample array was written, not by recency.
async function mockupQueue(page: Page, backendUrl: string) {
  const response = await page.request.get(`${backendUrl}/api/v1/review-items?limit=100`);
  const real = (await response.json()) as { data: Json[] } & Json;
  const data = QUEUE_ORDER.flatMap((title) => real.data.filter((item) => item.title === title));

  await page.route(/\/api\/v1\/review-items(\?|$)/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();

      return;
    }

    await route.fulfill({ json: { ...real, data } });
  });
}

// The mockup opens a drawer from a script, which leaves focus-visible on: use the keyboard.
async function openByKeyboard(page: Page, trigger: Locator) {
  // Without scrolling: focusing a far-right action would shift the table behind the drawer.
  await trigger.evaluate((element) => (element as HTMLElement).focus({ preventScroll: true }));
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
}

const openFirstWork = async (page: Page) => {
  // The mockup opens it from a script, which leaves focus-visible on: use the keyboard.
  const link = page.locator('tbody tr').first().getByRole('link').first();

  await link.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
};

export const appViews: AppView[] = [
  { view: 'work.ready', path: '/work', prepare: mockupWork },
  {
    view: 'work.detail',
    path: '/work',
    prepare: mockupWork,
    steps: openFirstWork,
  },
  {
    view: 'work.close',
    path: '/work',
    prepare: mockupWork,
    steps: async (page) => {
      await openFirstWork(page);
      await page.getByRole('button', { name: 'Close work', exact: true }).click();
      await page.getByRole('dialog', { name: 'Close work', exact: true }).waitFor();
    },
  },
  { view: 'queue.ready', path: '/queue', prepare: mockupQueue },
  {
    view: 'queue.review',
    path: '/queue',
    prepare: mockupQueue,
    steps: (page) =>
      openByKeyboard(page, page.getByRole('link', { name: 'Returns need a routing rule' })),
  },
  {
    view: 'queue.mapping',
    path: '/queue',
    prepare: mockupQueue,
    steps: (page) =>
      openByKeyboard(
        page,
        page
          .getByRole('row')
          .filter({ hasText: 'Pak Bud' })
          .getByRole('link', { name: 'Link name' }),
      ),
  },
  { view: 'rules.ready', path: '/rules' },
  { view: 'people.ready', path: '/people' },
  { view: 'channels.ready', path: '/channels' },
  { view: 'audit.ready', path: '/audit' },
  { view: 'settings.ready', path: '/settings' },
];
