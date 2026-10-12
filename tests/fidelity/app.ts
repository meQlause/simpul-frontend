// The app side of the comparison: render a matrix view with the real backend and the §2
// conditions (fixed clock, Asia/Jakarta, reduced motion, bundled fonts).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Page } from '@playwright/test';
import { compareImages, TOLERANCE, type Region } from './compare.ts';
import type { Rect } from './measure.ts';
import { connectBackend } from '../e2e/helpers/backend.ts';

const here = dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const baseline = resolve(here, 'baseline');
const HEIGHT = 900;
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

export async function open(page: Page, baseUrl: string, path: string, width: number) {
  await page.setViewportSize({ width, height: HEIGHT });
  await page.clock.setFixedTime(FROZEN);
  await connectBackend(page, baseUrl);
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
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
      console.log(`DIFF ${target.view}@${target.width}`, JSON.stringify(result.cells));
    }

    return result.ratio;
  } finally {
    await comparer.close();
  }
}

export { TOLERANCE };
