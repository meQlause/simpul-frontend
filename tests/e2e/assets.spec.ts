import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const HOSTS_ALLOWED = ['127.0.0.1', 'localhost'];
const PAGES = ['/sign-in', '/set-password', '/setup/database'];

for (const path of PAGES) {
  test(`${path}: no third-party request, and DM Sans and Manrope render from bundled files`, async ({
    page,
  }) => {
    const foreign: string[] = [];

    page.on('request', (request) => {
      const { hostname, protocol } = new URL(request.url());

      if (protocol.startsWith('http') && !HOSTS_ALLOWED.includes(hostname)) {
        foreign.push(request.url());
      }
    });
    await page.route(/\/api\/(v1|auth)\//, (route) => route.fulfill({ status: 401, json: {} }));
    await page.goto(path);
    // A loading skeleton has no text, so no font is requested until the page's heading is drawn.
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const faces = await page.evaluate(() =>
      [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family),
    );

    expect(foreign).toEqual([]);
    expect(faces.some((family) => family.includes('DM Sans'))).toBe(true);
  });
}

test('every visible text node uses DM Sans or Manrope', async ({ page }) => {
  await page.route(/\/api\/(v1|auth)\//, (route) => route.fulfill({ status: 401, json: {} }));
  await page.goto('/sign-in');
  await page.evaluate(() => document.fonts.ready);
  const families = await page.evaluate(() => {
    const names = new Set<string>();

    for (const element of document.querySelectorAll('body *')) {
      const own = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE);

      if (own && element.getBoundingClientRect().width > 0) {
        names.add(getComputedStyle(element).fontFamily.split(',')[0].replace(/['"]/g, ''));
      }
    }

    return [...names];
  });

  expect(families.every((family) => ['DM Sans', 'Manrope'].includes(family))).toBe(true);
});

// fidelity §8: the app ships the very file the mockup uses, byte for byte; a file the mockup
// does not reference is not an asset of the page and is not shipped.
test('every asset the mockup uses is shipped sha256-equal', () => {
  const root = resolve(import.meta.dirname, '../../..');

  // The mockup lives in the parent repository: a checkout of this repository alone has none.
  if (!existsSync(resolve(root, 'index.html'))) {
    return;
  }

  const baseline = JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../fidelity/baseline/assets.json'), 'utf8'),
  ) as Record<string, string>;
  const mockupSources = ['index.html', 'app.js', 'styles.css']
    .map((file) => readFileSync(resolve(root, file), 'utf8'))
    .join(' ');

  for (const [name, hash] of Object.entries(baseline)) {
    const used = mockupSources.includes(`assets/${name}`);
    const shipped = resolve(root, 'frontend/public/assets', name);

    if (!used) {
      expect(existsSync(shipped), `${name} is not used by the mockup`).toBe(false);
      continue;
    }

    expect(createHash('sha256').update(readFileSync(shipped)).digest('hex')).toBe(hash);
  }
});

test('the favicon is the shipped brand mark', () => {
  const html = readFileSync(resolve(import.meta.dirname, '../../index.html'), 'utf8');

  expect(html).toContain('href="/assets/simpul-mark.png"');
});
