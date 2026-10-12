// The five non-ready states of every page but Home (Home has its own spec), against the mockup.
import { expect, test } from '@playwright/test';
import { startBackend } from '../e2e/helpers/backend.ts';
import { capture, compare, goOffline, induce, masks, open, TOLERANCE, type State } from './app.ts';
import { widths } from './views.ts';

let backend: Awaited<ReturnType<typeof startBackend>>;

const STATES: State[] = ['loading', 'empty', 'error', 'offline', 'not-found'];
const LIST = { data: [], page: { nextCursor: null, total: 0 } };
const PAGES = [
  { view: 'work', path: '/work', pattern: /\/api\/v1\/work(\?|$)/, empty: LIST },
  {
    view: 'queue',
    path: '/queue',
    pattern: /\/api\/v1\/review-items(\?|$)/,
    empty: { ...LIST, counts: { unrouted: 0, alias: 0, category: 0 } },
  },
  { view: 'rules', path: '/rules', pattern: /\/api\/v1\/rules(\?|$)/, empty: LIST },
  { view: 'people', path: '/people', pattern: /\/api\/v1\/people(\?|$)/, empty: LIST },
  { view: 'channels', path: '/channels', pattern: /\/api\/v1\/channels(\?|$)/, empty: LIST },
  {
    view: 'audit',
    path: '/audit',
    pattern: /\/api\/v1\/decisions(\?|$)/,
    empty: {
      ...LIST,
      counts: { routing: 0, work: 0, queue: 0, digest: 0 },
    },
  },
  {
    view: 'settings',
    path: '/settings',
    pattern: /\/api\/v1\/settings(\?|$)/,
    empty: { data: {} },
  },
];
const only = process.env.FIDELITY_VIEW ?? '';
// Settings acceptance 5 keeps the disabled form on screen while offline; the mockup omits it.
const WIDER = new Map([['settings.offline', 0.3]]);

test.beforeAll(async () => {
  test.setTimeout(180000);
  backend = await startBackend();
});
test.afterAll(() => backend?.stop());

const cases = PAGES.filter((candidate) => candidate.view.startsWith(only)).flatMap((entry) =>
  STATES.flatMap((state) => widths.map((width) => ({ entry, state, width }))),
);

for (const { entry, state, width } of cases) {
  test(`${entry.view} ${state} at ${width}px equals the mockup`, async ({ page }) => {
    const view = `${entry.view}.${state}`;

    await open(page, backend.baseUrl, {
      path: entry.path,
      width,
      prepare: () => induce(page, state, entry.pattern, entry.empty),
    });

    if (state === 'offline') {
      await goOffline(page);
    }

    const ratio = await compare(page, {
      view,
      width,
      actual: await capture(page),
      ignore: masks(view, width),
    });

    expect(ratio).toBeLessThanOrEqual(WIDER.get(view) ?? TOLERANCE);
  });
}
