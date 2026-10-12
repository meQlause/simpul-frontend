// How the app reaches each matrix view that is not a Home state: route, optional response shaping
// and a driver for the interaction the mockup view is captured after.
import type { Locator, Page } from '@playwright/test';
import type { Region } from './compare.ts';
import { connectedWorkspace, pendingWorkspace, STRING } from '../e2e/helpers/database';

export type AppView = {
  view: string;
  path: string;
  // Intercepts responses *after* the backend hook, before the page loads.
  prepare?: (page: Page, backendUrl: string) => Promise<void>;
  steps?: (page: Page) => Promise<void>;
  // Regions skipped on top of the §11 masks, by viewport width.
  ignore?: (width: number) => Region[];
  // A wider bar for a view whose approved copy is longer than the mockup's sample sentence.
  tolerance?: number;
};

type Json = Record<string, unknown>;

// FR-UI-03's description wraps to more lines than the mockup's sample sentence at 900 and 375.
const PREVIEW_TOLERANCE = 0.3;

// The mockup lists nine hand-written rows in a fixed order; the real API lists 125 by recency.
// The same rows, in the mockup's order, are served so row styling is compared like for like.
const WORK_ORDER = [
  'ORD-0091',
  'ORD-0098',
  'PAY-0034',
  'ORD-0095',
  'STK-0018',
  'ORD-0087',
  'ORD-0100',
  'ORD-0083',
  'ORD-0070',
];
const WORK_TOTAL = 48;

async function everyWork(page: Page, backendUrl: string): Promise<Json[]> {
  const found: Json[] = [];
  let cursor: string | null = '';

  while (cursor !== null) {
    const query: string = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
    const response = await page.request.get(`${backendUrl}/api/v1/work?limit=100${query}`);
    const body = (await response.json()) as { data: Json[]; page: { nextCursor: string | null } };

    found.push(...body.data);
    cursor = body.page.nextCursor;
  }

  return found;
}

async function mockupWork(page: Page, backendUrl: string) {
  const all = await everyWork(page, backendUrl);
  const rows = WORK_ORDER.flatMap((id) => all.filter((item) => item.displayId === id));

  await page.route(/\/api\/v1\/work(\?|$)/, async (route) => {
    if (route.request().method() !== 'GET' || route.request().url().includes('export')) {
      await route.fallback();

      return;
    }

    await route.fulfill({
      json: { data: rows, page: { total: WORK_TOTAL, nextCursor: 'more' } },
    });
  });
}

const QUEUE_ORDER = [
  'Returns need a routing rule',
  'Delivery schedule changed',
  'Customer pricing adjustment',
  'Who does “Pak Bud” refer to?',
  '“Bu Rin” is not recognized',
  'Product sample request',
  'Damaged packaging reported',
];

// The mockup lists the queue in the order its sample array was written, not by recency.
async function mockupQueue(page: Page, backendUrl: string) {
  const response = await page.request.get(`${backendUrl}/api/v1/review-items?limit=100`);
  const real = (await response.json()) as { data: Json[] } & Json;
  const data = QUEUE_ORDER.flatMap((title) => real.data.filter((item) => item.title === title));

  await page.route(/\/api\/v1\/review-items(\?|$)/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();

      return;
    }

    await route.fulfill({ json: { ...real, data } });
  });
}

const PEOPLE_ORDER = ['Siti Aminah', 'Budi Santoso', 'Rina Anggraini', 'Andi Pratama'];

// The mockup lists its four people in the order they were written; the API lists them by name.
async function mockupPeople(page: Page, backendUrl: string) {
  const response = await page.request.get(`${backendUrl}/api/v1/people?limit=100`);
  const real = (await response.json()) as { data: Json[] } & Json;
  const named = PEOPLE_ORDER.flatMap((name) => real.data.filter((person) => person.name === name));
  const data = [...named, ...real.data.filter((person) => !named.includes(person))];

  await page.route(/\/api\/v1\/people(\?|$)/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();

      return;
    }

    await route.fulfill({ json: { ...real, data } });
  });
}

// The mockup's page is scrolled by its own focus handling: put the heading where it ends up.
async function settleHeading(page: Page) {
  // Only at 900px does the mockup end up scrolled; its demo panels under the card give it room
  // to scroll further than this page can, so the same room is added here.
  if (page.viewportSize()?.width !== 900) {
    await page.evaluate(() => window.scrollTo(0, 0));

    return;
  }

  await page.evaluate(() => {
    const spacer = document.createElement('div');

    spacer.style.height = '400px';
    document.body.append(spacer);
    const heading = document.querySelector('h1');

    if (heading) {
      window.scrollBy(0, heading.getBoundingClientRect().top - 200);
    }
  });
}

// A refusal the way the backend words it: the code only, the page writes the sentence.
function refused(code: string) {
  return {
    status: 422,
    json: { error: { code, message: '', details: [], requestId: 'fidelity' } },
  };
}

// A group saved by one view would be a duplicate in the next: each run uses a chat ID of its own.
let groupCounter = 0;

function nextGroup() {
  groupCounter += 1;

  return { name: 'Sales & Order', chatId: `-100123456${String(groupCounter).padStart(4, '0')}` };
}

// Sends the two messages the readiness check waits for, as Telegram would.
async function sendProof(page: Page, backendUrl: string, group: { name: string; chatId: string }) {
  const list = await page.request.get(`${backendUrl}/api/v1/telegram/connections`);
  const connection = ((await list.json()) as { data: { id: string }[] }).data[0];
  const session = await page.request.post(
    `${backendUrl}/api/v1/telegram/connections/${connection.id}/sessions`,
    { data: { purpose: 'receive_check' } },
  );
  const command = ((await session.json()) as { data: { command: string } }).data.command;

  for (const text of [command, 'A new ordinary check message']) {
    await page.request.post(`${backendUrl}/api/v1/webhooks/telegram/${connection.id}`, {
      headers: { 'X-Telegram-Bot-Api-Secret-Token': Buffer.alloc(32, 8).toString('base64url') },
      data: {
        update_id: Date.now(),
        message: {
          message_id: Date.now(),
          date: Math.floor(Date.now() / 1000),
          from: { id: 1, is_bot: false, first_name: 'Tester' },
          chat: { id: Number(group.chatId), type: 'supergroup', title: group.name },
          text,
        },
      },
    });
  }
}

// The new group's setup drawer after its checks ran; `patch` shapes the verification answer.
function checkedGroup(patch?: (verification: Json) => void) {
  let backend = '';
  let group = nextGroup();

  return {
    prepare: async (page: Page, backendUrl: string) => {
      backend = backendUrl;
      group = nextGroup();

      if (!patch) {
        return;
      }

      await page.route(/\/channels\/[^/]+\/verify$/, async (route) => {
        // The page reaches the backend through the harness; ask it the same way, directly.
        const response = await page.request.post(
          `${backend}${new URL(route.request().url()).pathname}`,
          { data: route.request().postDataJSON() ?? {} },
        );
        const body = (await response.json()) as Json;
        const target = (body.data ?? body) as Json;

        patch(target);
        await route.fulfill({ status: response.status(), json: body });
      });
    },
    steps: async (page: Page) => {
      await page.getByRole('button', { name: 'Add Telegram channel' }).click();
      await page.getByLabel('Display name', { exact: true }).fill(group.name);
      await page.getByLabel('Telegram Chat ID', { exact: true }).fill(group.chatId);
      await page.getByRole('button', { name: 'Check group', exact: true }).click();
      await page.getByRole('button', { name: 'Recheck', exact: true }).waitFor();

      if (!patch) {
        await sendProof(page, backend, group);
        await page.getByRole('button', { name: 'Recheck', exact: true }).click();
        await page.getByText('Last checked just now').waitFor();
      }

      await page
        .locator('.drawer-check-row')
        .first()
        .evaluate((row) => row.scrollIntoView({ block: 'center' }));
    },
  };
}

// Walks the wizard like the mockup's capture does: a different backup for everyone, then Continue.
function onboardingAt(step: number) {
  return async (page: Page) => {
    const dialog = page.getByRole('dialog');

    await dialog.waitFor();
    await dialog.locator('select').evaluateAll((selects) => {
      selects.forEach((select) => {
        const field = select.closest('label')?.textContent ?? '';
        const option = [...(select as HTMLSelectElement).options].find(
          (entry) => entry.value && !field.startsWith(entry.textContent ?? '#'),
        );

        if (option) {
          (select as HTMLSelectElement).value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });

    for (let reached = 1; reached < step; reached += 1) {
      await dialog.getByRole('button', { name: /^(Continue|Finish)/ }).click();
    }
  };
}

// The mockup opens a drawer from a script, which leaves focus-visible on: use the keyboard.
async function openByKeyboard(page: Page, trigger: Locator) {
  // Without scrolling: focusing a far-right action would shift the table behind the drawer.
  await trigger.evaluate((element) => (element as HTMLElement).focus({ preventScroll: true }));
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
}

const openFirstWork = async (page: Page) => {
  // The mockup opens it from a script, which leaves focus-visible on: use the keyboard.
  const link = page.locator('tbody tr').first().getByRole('link').first();

  await link.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
};

export const appViews: AppView[] = [
  { view: 'work.ready', path: '/work', prepare: mockupWork },
  {
    view: 'work.detail',
    path: '/work',
    prepare: mockupWork,
    steps: openFirstWork,
  },
  {
    view: 'work.close',
    path: '/work',
    prepare: mockupWork,
    steps: async (page) => {
      await openFirstWork(page);
      await page.getByRole('button', { name: 'Close work', exact: true }).click();
      await page.getByRole('dialog', { name: 'Close work', exact: true }).waitFor();
    },
  },
  { view: 'queue.ready', path: '/queue', prepare: mockupQueue },
  {
    view: 'queue.review',
    path: '/queue',
    prepare: mockupQueue,
    steps: (page) =>
      openByKeyboard(page, page.getByRole('link', { name: 'Returns need a routing rule' })),
  },
  {
    view: 'queue.mapping',
    path: '/queue',
    prepare: mockupQueue,
    steps: (page) =>
      openByKeyboard(
        page,
        page
          .getByRole('row')
          .filter({ hasText: 'Pak Bud' })
          .getByRole('link', { name: 'Link name' }),
      ),
  },
  { view: 'rules.ready', path: '/rules' },
  {
    view: 'rules.edit',
    path: '/rules',
    steps: (page) =>
      openByKeyboard(
        page,
        page.getByRole('link', { name: 'New orders reach the warehouse', exact: true }),
      ),
  },
  {
    view: 'rules.create',
    path: '/rules',
    steps: (page) => openByKeyboard(page, page.getByRole('link', { name: 'Create rule' })),
  },
  {
    view: 'rules.create-field-error',
    path: '/rules',
    steps: async (page) => {
      await openByKeyboard(page, page.getByRole('link', { name: 'Create rule' }));
      const drawer = page.getByRole('dialog');

      await drawer.getByLabel('Rule name').fill('');
      await drawer.getByRole('button', { name: 'Save rule' }).click();
      await page.mouse.move(0, 0);
    },
    // The mockup shows the browser's own validation bubble; the product shows the specified
    // inline message, which moves everything below the field. Only the part above is compared.
    ignore: (width) => [{ x: 0, y: 335, width, height: 490 }],
  },
  { view: 'people.ready', path: '/people', prepare: mockupPeople },
  {
    view: 'people.role',
    path: '/people',
    prepare: mockupPeople,
    steps: (page) =>
      openByKeyboard(page, page.locator('tbody tr').first().getByRole('button').first()),
  },
  { view: 'channels.ready', path: '/channels' },
  {
    view: 'channels.configure',
    path: '/channels',
    steps: (page) =>
      openByKeyboard(page, page.locator('tbody tr').first().locator('.directory-title')),
  },
  {
    view: 'channels.add',
    path: '/channels',
    steps: (page) =>
      openByKeyboard(page, page.getByRole('button', { name: 'Add Telegram channel' })),
  },
  {
    view: 'channels.connection',
    path: '/channels',
    steps: (page) =>
      openByKeyboard(page, page.getByRole('button', { name: 'Manage Telegram connection' })),
  },
  {
    view: 'channels.pause',
    path: '/channels',
    steps: (page) =>
      openByKeyboard(
        page,
        page
          .locator('tbody tr')
          .first()
          .getByRole('button', { name: /^Pause / }),
      ),
  },
  { view: 'channels.verified', path: '/channels', ...checkedGroup() },
  {
    view: 'channels.needs-action',
    path: '/channels',
    ...checkedGroup((verification) => {
      const checks = verification.checks as Json[];

      checks[3] = { ...checks[3], status: 'fail', action: 'Disable privacy mode in BotFather' };
      verification.activationReady = false;
    }),
  },
  {
    view: 'channels.expired',
    path: '/channels',
    ...checkedGroup((verification) => {
      verification.expiresAt = '2026-10-10T03:00:00Z';
    }),
  },
  {
    view: 'database.setup',
    path: '/',
    prepare: async (page) => {
      await pendingWorkspace(page);
    },
  },
  {
    view: 'database.notice-not-accepted',
    path: '/setup/database',
    prepare: async (page) => {
      await pendingWorkspace(page);
    },
    steps: async (page) => {
      await page.getByLabel('Connection string', { exact: true }).fill(STRING);
      await page.getByRole('button', { name: 'Connect database', exact: true }).click();
      await page.evaluate(() => window.scrollTo(0, 0));
    },
  },
  {
    view: 'database.check-failed',
    // The mockup's "Demo only" line under the form is not built (FD-02): content below shifts.
    tolerance: 0.15,
    path: '/setup/database',
    prepare: async (page) => {
      await pendingWorkspace(page, { put: () => Promise.resolve(refused('E-DB-VECTOR-MISSING')) });
    },
    steps: async (page) => {
      await page.getByLabel('I understand that data availability is our responsibility.').check();
      await page.getByLabel('Connection string', { exact: true }).fill(STRING);
      await page.getByRole('button', { name: 'Connect database', exact: true }).click();
      await page.getByText(/extension is not available/).waitFor();
      await settleHeading(page);
    },
  },
  {
    view: 'database.connecting',
    path: '/setup/database',
    prepare: async (page) => {
      await pendingWorkspace(page, { put: () => new Promise(() => undefined) });
    },
    steps: async (page) => {
      await page.getByLabel('I understand that data availability is our responsibility.').check();
      await page.getByLabel('Connection string', { exact: true }).fill(STRING);
      await page.getByRole('button', { name: 'Connect database', exact: true }).click();
      await page.evaluate(() => window.scrollTo(0, 0));
    },
  },
  {
    view: 'database.unavailable',
    path: '/',
    prepare: async (page) => {
      await connectedWorkspace(page);
      await page.route(/\/api\/v1\/overview(\?|$)/, (route) =>
        route.fulfill({ status: 503, json: refused('E-DB-UNAVAILABLE').json }),
      );
    },
  },
  {
    view: 'settings.database.connected',
    path: '/settings/database',
    prepare: async (page) => connectedWorkspace(page),
  },
  {
    view: 'settings.database.update-refused',
    path: '/settings/database',
    prepare: async (page) => {
      await connectedWorkspace(page, () => refused('E-DB-WORKSPACE-MISMATCH'));
    },
    steps: async (page) => {
      const drawer = page.getByRole('dialog');

      await drawer.getByLabel('Connection string', { exact: true }).fill(STRING);
      await drawer.getByRole('button', { name: 'Update connection', exact: true }).click();
      await drawer.getByText(/does not contain/).waitFor();
    },
  },
  { view: 'audit.ready', path: '/audit' },
  {
    view: 'audit.trace',
    path: '/audit',
    steps: (page) =>
      openByKeyboard(page, page.locator('tbody tr').first().locator('button, a').first()),
  },
  { view: 'settings.ready', path: '/settings' },
  {
    view: 'settings.vocabulary.categories',
    path: '/settings/vocabulary?tab=categories',
    steps: (page) => page.getByRole('dialog').waitFor(),
  },
  {
    view: 'settings.vocabulary.aliases',
    path: '/settings/vocabulary?tab=aliases',
    steps: (page) => page.getByRole('dialog').waitFor(),
  },
  {
    view: 'settings.vocabulary.templates',
    path: '/settings/vocabulary?tab=templates',
    steps: (page) => page.getByRole('dialog').waitFor(),
  },
  {
    view: 'settings.preview.notification',
    path: '/settings/recipient-preview?tab=notification',
    tolerance: PREVIEW_TOLERANCE,
    steps: (page) => page.getByRole('dialog').waitFor(),
  },
  {
    view: 'settings.preview.clarification',
    path: '/settings/recipient-preview?tab=clarification',
    tolerance: PREVIEW_TOLERANCE,
    steps: (page) => page.getByRole('dialog').waitFor(),
  },
  {
    view: 'settings.preview.digest',
    path: '/settings/recipient-preview?tab=digest',
    tolerance: PREVIEW_TOLERANCE,
    steps: (page) => page.getByRole('dialog').waitFor(),
  },
  {
    view: 'settings.preview.voice-note',
    path: '/settings/recipient-preview?tab=voice',
    tolerance: PREVIEW_TOLERANCE,
    steps: (page) => page.getByRole('dialog').waitFor(),
  },
  ...[1, 2, 3, 4].map((step) => ({
    view: `settings.onboarding.${step}`,
    path: '/settings/onboarding',
    steps: onboardingAt(step),
  })),
  {
    view: 'settings.mail.empty',
    path: '/settings',
    steps: (page) => openByKeyboard(page, page.getByRole('link', { name: /^Configure/ })),
  },
  {
    view: 'settings.mail.saved',
    path: '/settings',
    steps: async (page) => {
      await page.getByRole('link', { name: /^Configure/ }).click();
      const drawer = page.getByRole('dialog');

      await drawer.getByLabel('Mail server host').fill('smtp.pointstar.example');
      await drawer.getByLabel('Port').fill('587');
      await drawer.getByLabel('Username').fill('simpul@pointstar.example');
      await drawer.getByLabel('Password').fill('secret');
      await drawer.getByLabel('Sender address').fill('simpul@pointstar.example');
      await drawer.getByRole('button', { name: /^Save/ }).click();
      await page.getByRole('dialog').waitFor({ state: 'detached' });
      await openByKeyboard(page, page.getByRole('link', { name: /^Configure/ }));
    },
  },
];
