// Fidelity §7: each one-off block of the app against the same block of the mockup — its own
// box and every text style inside it. The mockup is rendered live from the same file the
// baseline is made from.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, expect, test, type Page } from '@playwright/test';
import { startBackend } from '../e2e/helpers/backend.ts';
import { open } from './app.ts';
import { run } from './drive.ts';
import { appViews } from './pages.ts';
import { views } from './views.ts';

const mockup = resolve(import.meta.dirname, '../../../index.html');

type OneOff = { key: string; view: string; app: string; mockup: string };

// fidelity.md §7, one row each. `view` names the mockup view and the app view that reach it.
const ONE_OFFS: OneOff[] = [
  { key: 'home.flow', view: 'overview.ready', mockup: '.routing-panel', app: 'home-flow' },
  { key: 'home.stats', view: 'overview.ready', mockup: '.stats-grid', app: 'home-stats' },
  {
    key: 'home.attention',
    view: 'overview.ready',
    mockup: '.attention-strip',
    app: 'home-attention',
  },
  { key: 'home.updates', view: 'overview.ready', mockup: '.activity-feed', app: 'home-updates' },
  { key: 'sidebar.quiet', view: 'work.ready', mockup: '.quiet-card', app: 'sidebar-quiet' },
  { key: 'sidebar.brand', view: 'work.ready', mockup: '.brand', app: 'brand' },
  {
    key: 'channels.connection',
    view: 'channels.ready',
    mockup: '.telegram-connection',
    app: 'connection-card',
  },
  { key: 'rules.impact', view: 'rules.edit', mockup: '.drawer-impact', app: 'rule-impact' },
  { key: 'trace.hero', view: 'audit.trace', mockup: '.trace-outcome-hero', app: 'trace-hero' },
  { key: 'trace.steps', view: 'audit.trace', mockup: '.rich-decision-trace', app: 'trace-steps' },
  {
    key: 'onboarding.progress',
    view: 'settings.onboarding.1',
    mockup: '.onboarding-progress',
    app: 'onboarding-progress',
  },
  {
    key: 'preview.message',
    view: 'settings.preview.notification',
    mockup: '.message-preview',
    app: 'message-preview',
  },
];

// The block's own box and the multiset of text styles inside it, as one comparable record.
function signature(selector: string) {
  const root = document.querySelector(selector);

  if (!root) {
    return null;
  }

  const text = (style: CSSStyleDeclaration) =>
    [
      style.fontFamily.split(',')[0].replace(/['"]/g, ''),
      style.fontSize,
      style.fontWeight,
      style.lineHeight,
      style.letterSpacing,
      style.textTransform,
      style.color,
    ].join('|');
  const style = getComputedStyle(root);
  const shown = (element: Element) => {
    const rect = element.getBoundingClientRect();
    const look = getComputedStyle(element);

    return rect.width > 0 && rect.height > 0 && look.visibility !== 'hidden';
  };

  const own = (element: Element) =>
    shown(element) &&
    [...element.childNodes].some(
      (node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()),
    );
  const texts = [root, ...root.querySelectorAll('*')]
    .filter(own)
    .map((element) => text(getComputedStyle(element)));

  return {
    box: [
      style.paddingTop,
      style.paddingRight,
      style.paddingBottom,
      style.paddingLeft,
      style.borderTopLeftRadius,
      style.borderTopWidth,
      style.backgroundColor,
    ].join('|'),
    texts: [...new Set(texts)].sort(),
  };
}

async function fromMockup(page: Page, view: string, selector: string) {
  const entry = views.find((candidate) => candidate.id === view);

  if (!entry) {
    throw new Error(`no mockup view ${view}`);
  }

  await page.goto(pathToFileURL(mockup).href);
  await page.evaluate(() => document.fonts.ready);

  for (const step of entry.steps) {
    await run(page, step);
  }

  return page.evaluate(signature, selector);
}

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  test.setTimeout(180000);
  backend = await startBackend();
});
test.afterAll(() => backend?.stop());

async function inMockup(oneOff: OneOff) {
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    return await fromMockup(await context.newPage(), oneOff.view, oneOff.mockup);
  } finally {
    await browser.close();
  }
}

async function inApp(page: Page, oneOff: OneOff) {
  const entry = appViews.find((candidate) => candidate.view === oneOff.view) ?? {
    view: oneOff.view,
    path: '/',
  };

  await open(page, backend.baseUrl, {
    path: entry.path,
    width: 1440,
    prepare: async () => {
      await entry.prepare?.(page, backend.baseUrl);
    },
  });
  await entry.steps?.(page);
  await page.mouse.move(0, 0);

  return page.evaluate(signature, `[data-testid="${oneOff.app}"]`);
}

for (const oneOff of ONE_OFFS) {
  test(`${oneOff.key} equals the mockup's block`, async ({ page }) => {
    const expected = await inMockup(oneOff);
    const actual = await inApp(page, oneOff);

    expect(expected, `${oneOff.mockup} is on the mockup view`).not.toBeNull();
    expect(actual, `${oneOff.app} is on the app view`).not.toBeNull();
    expect(actual?.box).toBe(expected?.box);
    // Demo markers and sample variations the mockup draws (FD-02) are not in the product: what
    // the app draws must be a style the mockup draws, nothing foreign.
    const foreign = (actual?.texts ?? []).filter((style) => !expected?.texts.includes(style));

    expect(foreign).toEqual([]);
  });
}
