import { expect, test } from '@playwright/test';
import { startBackend } from '../e2e/helpers/backend.ts';
import { capture, compare, masks, open, TOLERANCE } from './app.ts';
import { appViews } from './pages.ts';
import { widths } from './views.ts';

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  test.setTimeout(180000);
  backend = await startBackend();
});
test.afterAll(() => backend?.stop());

const only = process.env.FIDELITY_VIEW ?? '';

for (const entry of appViews.filter((candidate) => candidate.view.startsWith(only))) {
  for (const width of widths) {
    test(`${entry.view} at ${width}px equals the mockup`, async ({ page }) => {
      await open(page, backend.baseUrl, {
        path: entry.path,
        width,
        anonymous: entry.anonymous,
        prepare: () => entry.prepare?.(page, backend.baseUrl) ?? Promise.resolve(),
      });
      await entry.steps?.(page);
      const image = await capture(page);
      const ratio = await compare(page, {
        view: entry.view,
        width,
        actual: image,
        ignore: [...masks(entry.view, width), ...(entry.ignore?.(width) ?? [])],
      });

      expect(ratio).toBeLessThanOrEqual(entry.tolerance ?? TOLERANCE);
    });
  }
}
