import { expect, test } from '@playwright/test';
import { startBackend } from '../e2e/helpers/backend.ts';
import { capture, compare, goOffline, induce, masks, open, TOLERANCE, type State } from './app.ts';
import { barOf } from './allowed.ts';
import { widths } from './views.ts';

let backend: Awaited<ReturnType<typeof startBackend>>;

// No `empty`: an all-zero Home keeps its page, while the mockup still shows the removed panel
// (ticket ui-empty-layout, AC1). tests/e2e/ui-empty-layout.spec.ts covers that layout.
const STATES: State[] = ['ready', 'error', 'offline', 'not-found'];

test.beforeAll(async () => {
  test.setTimeout(180000);
  backend = await startBackend();
});
test.afterAll(() => backend?.stop());

for (const state of STATES) {
  for (const width of widths) {
    test(`Home ${state} at ${width}px equals the mockup`, async ({ page }) => {
      const view = `overview.${state}`;

      await open(page, backend.baseUrl, {
        path: '/',
        width,
        prepare: () => induce(page, state, /\/api\/v1\/overview\?period=/),
      });

      if (state === 'offline') {
        await goOffline(page);
      }

      const image = await capture(page);
      const ratio = await compare(page, {
        view,
        width,
        actual: image,
        ignore: masks(view, width),
      });

      expect(ratio).toBeLessThanOrEqual(barOf(view, TOLERANCE));
    });
  }
}
