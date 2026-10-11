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
