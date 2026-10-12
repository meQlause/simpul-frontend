import { expect, test } from '@playwright/test';
import { startBackend } from '../e2e/helpers/backend.ts';
import { capture, compare, goOffline, induce, masks, open, TOLERANCE, type State } from './app.ts';
import { widths } from './views.ts';

let backend: Awaited<ReturnType<typeof startBackend>>;

const STATES: State[] = ['ready', 'loading', 'empty', 'error', 'offline', 'not-found'];
const EMPTY = {
  data: {
    messagesUnderstood: { count: 0, trendPercent: null },
    activeWork: { count: 0, completedToday: 0 },
    updatesDelivered: { count: 0, recipients: 0, topRecipients: [] },
    needsReview: { count: 0, areas: 0, byKind: { unrouted: 0, alias: 0, category: 0 } },
  },
};

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
        prepare: () => induce(page, state, /\/api\/v1\/overview\?period=/, EMPTY),
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

      expect(ratio).toBeLessThanOrEqual(TOLERANCE);
    });
  }
}
