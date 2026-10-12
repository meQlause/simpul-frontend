// The app side of the comparison: render a matrix view with the real backend and the §2
// conditions (fixed clock, Asia/Jakarta, reduced motion, bundled fonts).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Page } from '@playwright/test';
import { compareImages, TOLERANCE, type Region } from './compare.ts';
import { isMasked } from './allowed.ts';
import type { Rect } from './measure.ts';
import { connectBackend } from '../e2e/helpers/backend.ts';

const here = dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const baseline = resolve(here, 'baseline');
const HEIGHT = 900;
const IDLE_MS = 4000;
const FROZEN = new Date('2026-10-10T04:01:00Z');
const SETTLE_FRAMES = 3;
const SETTLE_ATTEMPTS = 20;
const SETTLE_MS = 200;

export const routes: Record<string, string> = {
  overview: '/',
  work: '/work',
  queue: '/queue',
  rules: '/rules',
  people: '/people',
  channels: '/channels',
  audit: '/audit',
  settings: '/settings',
};

function expected(view: string, width: number): Buffer {
  return readFileSync(resolve(baseline, 'screens', `${view}.${width}.png`));
}

export function regionsOf(view: string, width: number): Record<string, Rect> {
  const all = JSON.parse(readFileSync(resolve(baseline, 'regions.json'), 'utf8'));

  return all[`${view}@${width}`] ?? {};
}

// The §11 regions of a view, measured on the mockup, to skip in a comparison.
export function masks(view: string, width: number): Region[] {
  return Object.entries(regionsOf(view, width))
    .filter(([name]) => isMasked(name))
    .map(([, region]) => region);
}

async function settle(page: Page) {
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

export async function open(
  page: Page,
  baseUrl: string,
  target: { path: string; width: number; prepare?: () => Promise<void> },
) {
  const { path, width, prepare } = target;

  await page.setViewportSize({ width, height: HEIGHT });
  await page.clock.setFixedTime(FROZEN);
  await connectBackend(page, baseUrl);
  // Routes added after the backend hook take precedence over it.
  await prepare?.();
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  // A request held on purpose (the loading state) never goes idle.
  await page.waitForLoadState('networkidle', { timeout: IDLE_MS }).catch(() => undefined);
}

export type State = 'ready' | 'loading' | 'empty' | 'error' | 'offline' | 'not-found';

const failure = (status: number, code: string) => ({
  status,
  json: { error: { code, message: '', details: [], requestId: 'fidelity' } },
});

// Induces one of the six states on the page's main data request (§1: "intercepted responses").
// `empty` is a well-formed answer with nothing in it; `offline` is the browser losing the network
// after the page has loaded.
export async function induce(page: Page, state: State, pattern: RegExp, empty?: unknown) {
  if (state === 'ready' || state === 'offline') {
    return;
  }

  await page.route(pattern, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();

      return;
    }

    if (state === 'loading') {
      await new Promise(() => undefined);
    } else if (state === 'empty') {
      await route.fulfill({ json: empty });
    } else if (state === 'error') {
      await route.fulfill(failure(500, 'E-INTERNAL'));
    } else {
      await route.fulfill(failure(404, 'E-NOT-FOUND'));
    }
  });
}

export async function goOffline(page: Page) {
  await page.context().setOffline(true);
  await page.waitForTimeout(300);
}

export async function capture(page: Page) {
  return settle(page);
}

// Fraction of unmasked pixels that differ between the app and the mockup baseline.
export async function compare(
  page: Page,
  target: { view: string; width: number; actual: Buffer; ignore: Region[] },
): Promise<number> {
  const comparer = await page.context().newPage();

  // Kept for looking at: test-results/fidelity/<view>.<width>.png is the app's render.
  mkdirSync('test-results/fidelity', { recursive: true });
  writeFileSync(`test-results/fidelity/${target.view}.${target.width}.png`, target.actual);

  try {
    const result = await compareImages(
      comparer,
      expected(target.view, target.width),
      target.actual,
      target.ignore,
    );

    if (result.ratio > TOLERANCE) {
      console.log(
        `DIFF ${target.view}@${target.width} ${(result.ratio * 100).toFixed(2)}%`,
        JSON.stringify(result.cells.slice(0, 4)),
      );
    }

    return result.ratio;
  } finally {
    await comparer.close();
  }
}

export { TOLERANCE };
