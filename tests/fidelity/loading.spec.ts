// The nine loading views (FD-28: eight pages and the work drawer) are checked by structure, not by
// pixels: the skeleton's variant and block count, the named status, and that the skeleton sits
// inside the page content or the open drawer. The mockup has no loading skeleton to compare with.
import { expect, test, type Locator } from '@playwright/test';
import { startBackend } from '../e2e/helpers/backend.ts';
import { induce, open } from './app.ts';
import { openFirstWork, workDetail } from './pages.helpers.ts';
import { widths } from './views.ts';

type Shape = { variant: 'table' | 'cards'; blocks: number; grid?: string };

const TABLE: Shape = { variant: 'table', blocks: 8 };
const CARDS: Shape = { variant: 'cards', blocks: 4 };
const DRAWER_BLOCKS = 4;
const NAME = 'Your workspace data is loading.';
// Sub-pixel rounding of the layout box is not a misplaced skeleton.
const SLACK = 0.5;

const PAGES: { view: string; path: string; pattern: RegExp; shape: Shape }[] = [
  {
    view: 'overview',
    path: '/',
    pattern: /\/api\/v1\/overview\?period=/,
    shape: { ...CARDS, grid: 'stats-grid' },
  },
  { view: 'work', path: '/work', pattern: /\/api\/v1\/work(\?|$)/, shape: TABLE },
  { view: 'queue', path: '/queue', pattern: /\/api\/v1\/review-items(\?|$)/, shape: TABLE },
  { view: 'rules', path: '/rules', pattern: /\/api\/v1\/rules(\?|$)/, shape: TABLE },
  { view: 'people', path: '/people', pattern: /\/api\/v1\/people(\?|$)/, shape: TABLE },
  { view: 'channels', path: '/channels', pattern: /\/api\/v1\/channels(\?|$)/, shape: TABLE },
  { view: 'audit', path: '/audit', pattern: /\/api\/v1\/decisions(\?|$)/, shape: TABLE },
  { view: 'settings', path: '/settings', pattern: /\/api\/v1\/settings(\?|$)/, shape: CARDS },
];

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  test.setTimeout(180000);
  backend = await startBackend();
});
test.afterAll(() => backend?.stop());

async function within(inner: Locator, outer: Locator): Promise<boolean> {
  const part = await inner.boundingBox();
  const whole = await outer.boundingBox();

  return (
    part !== null &&
    whole !== null &&
    part.x >= whole.x - SLACK &&
    part.y >= whole.y - SLACK &&
    part.x + part.width <= whole.x + whole.width + SLACK &&
    part.y + part.height <= whole.y + whole.height + SLACK
  );
}

for (const width of widths) {
  for (const entry of PAGES) {
    test(`${entry.view}.loading at ${width}px: its skeleton, named status, inside the page`, async ({
      page,
    }) => {
      await open(page, backend.baseUrl, {
        path: entry.path,
        width,
        prepare: () => induce(page, 'loading', entry.pattern),
      });

      const skeleton = page.locator(
        `[data-component="Skeleton"][data-variant="${entry.shape.variant}"]`,
      );

      await expect(skeleton).toHaveCount(1);
      await expect(skeleton.locator('.skeleton-block')).toHaveCount(entry.shape.blocks);

      if (entry.shape.grid) {
        await expect(skeleton).toHaveClass(new RegExp(entry.shape.grid));
      }

      await expect(page.getByRole('status', { name: NAME })).toHaveCount(1);
      expect(await within(skeleton, page.locator('#page-content'))).toBe(true);
    });
  }

  test(`drawer.loading at ${width}px: the drawer skeleton inside the open dialog`, async ({
    page,
  }) => {
    await open(page, backend.baseUrl, {
      path: '/work',
      width,
      prepare: () => workDetail('loading')(page),
    });
    await openFirstWork(page);

    const skeleton = page.locator(
      'dialog[open] [data-component="Skeleton"][data-variant="drawer"]',
    );

    await expect(skeleton).toHaveCount(1);
    await expect(skeleton.locator('.skeleton-block')).toHaveCount(DRAWER_BLOCKS);
    await expect(page.getByRole('status', { name: NAME })).toHaveCount(1);
    expect(await within(skeleton, page.locator('dialog[open]'))).toBe(true);
  });
}
