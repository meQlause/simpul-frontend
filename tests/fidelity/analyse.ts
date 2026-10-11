// Renders the mockup in every view of the fidelity matrix, at every width, and writes the
// baseline (docs/FE/fidelity.md §3, §10).
//   npm run fidelity:analyse [view-prefix]   write tests/fidelity/baseline/
//   npm run fidelity:check   [view-prefix]   regenerate and compare with the committed baseline
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { diffRatio, TOLERANCE } from './compare.ts';
import { run } from './drive.ts';
import { measure, type Measured } from './measure.ts';
import { views, widths, type View } from './views.ts';

const here = dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const baseline = resolve(here, 'baseline');
const mockup = resolve(process.env.SIMPUL_MOCKUP ?? resolve(here, '../../../index.html'));
const HEIGHT = 900;
// Deterministic rasterisation: no GPU, no subpixel text, no hinting differences.
const RASTER_FLAGS = [
  '--disable-gpu',
  '--force-color-profile=srgb',
  '--disable-lcd-text',
  '--font-render-hinting=none',
  '--disable-font-subpixel-positioning',
];
const SETTLE_ATTEMPTS = 20;
const SETTLE_FRAMES = 3;
const SETTLE_MS = 200;
const KIT = new Set([
  'badge',
  'button',
  'avatar',
  'icon',
  'panel',
  'page-heading',
  'directory-toolbar',
  'directory-tab',
  'directory-table',
  'directory-context',
  'directory-callout',
  'drawer-screen',
  'drawer-section',
  'drawer-identity',
  'trace-facts',
  'toast',
  'screen-state',
  'field',
  'toggle',
  'trace-view-tabs',
  'nav-item',
  'stat-card',
  'text-button',
  'icon-button',
  'eyebrow',
  'notice',
  'drawer-inline-note',
  'drawer-check-row',
  'message-preview',
  'auth-shell',
]);

type Tally = {
  texts: Record<string, string[]>;
  components: Record<string, Record<string, Record<string, string[]>>>;
};

function push(record: Record<string, string[]>, key: string, view: string) {
  const list = record[key] ?? [];

  list.push(view);
  record[key] = list;
}

function child<T>(record: Record<string, T>, key: string, make: () => T): T {
  const existing = record[key] ?? make();

  record[key] = existing;

  return existing;
}

function tally(into: Tally, view: string, measured: Measured) {
  for (const text of measured.texts) {
    push(into.texts, text, view);
  }

  for (const box of measured.boxes) {
    for (const kind of box.classes.filter((name) => KIT.has(name))) {
      const variant =
        box.classes
          .filter((name) => name !== kind)
          .sort()
          .join('.') || '(base)';
      const variants = child(into.components, kind, () => ({}));
      const signatures = child(variants, variant, () => ({}));

      push(signatures, box.signature, view);
    }
  }
}

function sorted<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function counts(record: Record<string, string[]>) {
  return Object.fromEntries(Object.entries(record).map(([key, list]) => [key, list.length]));
}

function assetHashes() {
  const directory = resolve(dirname(mockup), 'assets');

  return Object.fromEntries(
    readdirSync(directory)
      .sort()
      .map((file) => [
        file,
        createHash('sha256')
          .update(readFileSync(resolve(directory, file)))
          .digest('hex'),
      ]),
  );
}

function documents(found: Tally): Record<string, unknown> {
  const components = Object.entries(found.components).map(([kind, variants]) => [
    kind,
    sorted(
      Object.fromEntries(
        Object.entries(variants).map(([variant, signatures]) => [
          variant,
          sorted(counts(signatures)),
        ]),
      ),
    ),
  ]);
  const oneOffs = Object.entries(found.texts)
    .filter(([, list]) => list.length === 1)
    .map(([key, list]) => [key, list[0]]);

  return {
    'text-roles.json': sorted(counts(found.texts)),
    'components.json': sorted(Object.fromEntries(components)),
    'one-offs.json': sorted(Object.fromEntries(oneOffs)),
    'assets.json': assetHashes(),
  };
}

// The mockup fades some states in; capture only once three frames in a row are identical.
async function stable(page: Page) {
  const frame = () => page.screenshot({ animations: 'disabled', caret: 'hide' });
  let previous = await frame();
  let equal = 0;

  for (let attempt = 0; attempt < SETTLE_ATTEMPTS; attempt += 1) {
    await page.waitForTimeout(SETTLE_MS);
    const next = await frame();

    equal = next.equals(previous) ? equal + 1 : 0;
    previous = next;

    if (equal >= SETTLE_FRAMES) {
      return next;
    }
  }

  throw new Error('the view never settled');
}

async function render(page: Page, view: View, width: number, into: Tally) {
  await page.goto(pathToFileURL(mockup).href);
  await page.evaluate(() => document.fonts.ready);

  for (const step of view.steps) {
    await run(page, step);
  }

  await page.evaluate(() => document.fonts.ready);
  tally(into, `${view.id}@${width}`, await page.evaluate(measure));

  return stable(page);
}

const fontFiles = resolve(here, '../../node_modules/@fontsource-variable');

// The mockup links Google Fonts; serve the same families from the bundled files so a run never
// leaves the machine (FD-12) and renders exactly as the app does.
function bundledFontCss() {
  const face = (family: string, file: string, weights: string) =>
    `@font-face{font-family:'${family}';font-style:normal;font-weight:${weights};` +
    `src:url('${pathToFileURL(resolve(fontFiles, file)).href}') format('woff2-variations');}`;

  return [
    face('DM Sans', 'dm-sans/files/dm-sans-latin-wght-normal.woff2', '100 1000'),
    face('Manrope', 'manrope/files/manrope-latin-wght-normal.woff2', '200 800'),
  ].join(' ');
}

async function isolate(context: BrowserContext, foreign: string[]) {
  await context.route(/^https?:/, async (route) => {
    const url = route.request().url();

    if (url.startsWith('https://fonts.googleapis.com/')) {
      await route.fulfill({ contentType: 'text/css', body: bundledFontCss() });
    } else {
      foreign.push(url);
      await route.abort();
    }
  });
}

async function capture(browser: Browser, view: View, width: number, into: Tally) {
  // A fresh context per view: the mockup keeps state in the page and in storage.
  const context = await browser.newContext({
    viewport: { width, height: HEIGHT },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });

  const foreign: string[] = [];

  await isolate(context, foreign);

  try {
    const image = await render(await context.newPage(), view, width, into);

    if (foreign.length) {
      throw new Error(`third-party request: ${foreign[0]}`);
    }

    return image;
  } finally {
    await context.close();
  }
}

async function compareImage(comparer: Page, name: string, image: Buffer): Promise<string | null> {
  const expected = readFileSync(resolve(baseline, 'screens', name));
  const ratio = await diffRatio(comparer, expected, image);

  return ratio > TOLERANCE ? `${name}: ${(ratio * 100).toFixed(3)}% of pixels differ` : null;
}

function committed(name: string): unknown {
  try {
    return JSON.parse(readFileSync(resolve(baseline, name), 'utf8'));
  } catch {
    return null;
  }
}

function reconcile(found: Tally, check: boolean, partial: boolean): string[] {
  const problems: string[] = [];

  for (const [name, content] of Object.entries(documents(found))) {
    if (partial) {
      continue; // a prefix run measures only some views; the documents need the full set
    }

    if (!check) {
      writeFileSync(resolve(baseline, name), `${JSON.stringify(content, null, 2)}\n`);
    } else if (!partial && JSON.stringify(content) !== JSON.stringify(committed(name))) {
      problems.push(`${name}: differs from the committed baseline`);
    }
  }

  return problems;
}

type Context = { browser: Browser; comparer: Page; check: boolean; found: Tally };

const AGREEMENT_RENDERS = 3;

async function firstMatch(comparer: Page, earlier: Buffer[], image: Buffer) {
  for (const candidate of earlier) {
    if ((await diffRatio(comparer, candidate, image)) <= TOLERANCE) {
      return candidate;
    }
  }

  return null;
}

// The mockup occasionally settles on a different frame; take the first render that a
// second render agrees with.
async function agreed(context: Context, view: View, width: number): Promise<Buffer> {
  const renders: Buffer[] = [];

  for (let attempt = 0; attempt < AGREEMENT_RENDERS; attempt += 1) {
    const image = await capture(context.browser, view, width, context.found);

    const match = await firstMatch(context.comparer, renders, image);

    if (match) {
      return match;
    }

    renders.push(image);
  }

  return renders[0];
}

async function verify(context: Context, view: View, width: number): Promise<string> {
  const name = `${view.id}.${width}.png`;

  try {
    const image = await agreed(context, view, width);

    if (context.check) {
      return (await compareImage(context.comparer, name, image)) ?? '';
    }

    writeFileSync(resolve(baseline, 'screens', name), image);

    return '';
  } catch (error) {
    return `${name}: ${(error as Error).message.split(/\r?\n/)[0]}`;
  }
}

function report(total: number, failures: string[]) {
  console.log(`views ${total} · widths ${widths.length} · problems ${failures.length}`);
  failures.forEach((line) => console.log(`  ${line}`));
  process.exitCode = failures.length ? 1 : 0;
}

async function main() {
  const check = process.argv.includes('--check');
  const prefix = process.argv.slice(2).find((argument) => !argument.startsWith('--')) ?? '';
  const selected = views.filter((view) => view.id.startsWith(prefix));
  const browser = await chromium.launch({ args: RASTER_FLAGS });
  const context: Context = {
    browser,
    comparer: await browser.newPage(),
    check,
    found: { texts: {}, components: {} },
  };
  const problems: string[] = [];

  mkdirSync(resolve(baseline, 'screens'), { recursive: true });

  for (const view of selected) {
    for (const width of widths) {
      problems.push(await verify(context, view, width));
    }
  }

  await browser.close();
  problems.push(...reconcile(context.found, check, prefix !== ''));
  report(selected.length, problems.filter(Boolean));
}

await main();
