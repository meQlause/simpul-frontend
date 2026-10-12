import { expect, test } from '@playwright/test';
import { startBackend } from '../e2e/helpers/backend.ts';
import { capture, compare, open, regionsOf, routes, TOLERANCE } from './app.ts';
import { widths } from './views.ts';

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  test.setTimeout(180000);
  backend = await startBackend();
});
test.afterAll(() => backend?.stop());

// "Shell" is everything outside the page's own content: the sidebar and the top bar.
for (const width of widths) {
  for (const [route, path] of Object.entries(routes)) {
    test(`Shell ${route} at ${width}px equals the mockup outside the page content`, async ({
      page,
    }) => {
      const view = `${route}.ready`;
      const content = regionsOf(view, width).content;

      await open(page, backend.baseUrl, path, width);
      const image = await capture(page);
      const ratio = await compare(page, {
        view,
        width,
        actual: image,
        ignore: content ? [content] : [],
      });

      expect(ratio).toBeLessThanOrEqual(TOLERANCE);
    });
  }
}
