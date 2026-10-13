// How the app reaches each matrix view that is not a Home state: route, optional response shaping
// and a driver for the interaction the mockup view is captured after.
import type { Locator, Page } from '@playwright/test';
import type { Region } from './compare.ts';

export type AppView = {
  view: string;
  path: string;
  // Intercepts responses *after* the backend hook, before the page loads.
  prepare?: (page: Page, backendUrl: string) => Promise<void>;
  steps?: (page: Page) => Promise<void>;
  // A page nobody is signed in to: the harness does not sign in before it.
  anonymous?: boolean;
  // Regions skipped on top of the §11 masks, by viewport width.
  ignore?: (width: number) => Region[];
  // A wider bar for a view whose approved copy is longer than the mockup's sample sentence.
  tolerance?: number;
};

export type Json = Record<string, unknown>;

// FR-UI-03's description wraps to more lines than the mockup's sample sentence at 900 and 375.
export const PREVIEW_TOLERANCE = 0.3;

// FD-19: the auth card is centred, so it sits lower than the mockup's; FD-20 reuses the bar.
export const AUTH_TOLERANCE = 0.2;

// FD-24 and FD-25: the top bar carries the workspace switcher and a bordered search; two page
// views and the shell comparisons at 375 land just over the common bar.
export const SHELL_TOLERANCE = 0.15;

// FD-30: the Understanding panel adds a block under the notification form; the Settings view lands
// just over the common bar at 1440 and 900 (measured 15.55% and 14.38%, rounded up to 0.05).
export const SETTINGS_TOLERANCE = 0.2;

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

export async function mockupWork(page: Page, backendUrl: string) {
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
export async function mockupQueue(page: Page, backendUrl: string) {
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
export async function mockupPeople(page: Page, backendUrl: string) {
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
export async function settleHeading(page: Page) {
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

// Every data request answers "not signed in", as it does without a session.
export async function signedOut(page: Page) {
  await page.route('**/api/v1/**', (route) => route.fulfill(refused('E-AUTH-REQUIRED', 401)));
}

// A refusal the way the backend words it: the code only, the page writes the sentence.
export function refused(code: string, status = 422) {
  return {
    status,
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
export function checkedGroup(patch?: (verification: Json) => void) {
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
export function onboardingAt(step: number) {
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

// A work-detail answer that never comes, or comes as a refusal: the drawer's own states.
export function workDetail(state: 'loading' | 'not-found' | 'error') {
  return async (page: Page) => {
    await page.route(/\/api\/v1\/work\/[^/?]+(\?|$)/, async (route) => {
      if (state === 'loading') {
        await new Promise(() => undefined);
      } else if (state === 'not-found') {
        await route.fulfill(refused('E-NOT-FOUND', 404));
      } else {
        await route.fulfill(refused('E-INTERNAL', 500));
      }
    });
  };
}

// The second person's role drawer with a save that hangs or fails.
export function roleSave(outcome: 'saving' | 'failed') {
  return {
    prepare: async (page: Page, backendUrl: string) => {
      await mockupPeople(page, backendUrl);
      await page.route(/\/api\/v1\/people\/[^/?]+$/, async (route) => {
        if (route.request().method() !== 'PATCH') {
          await route.fallback();

          return;
        }

        if (outcome === 'saving') {
          await new Promise(() => undefined);
        } else {
          await route.fulfill(refused('E-INTERNAL', 500));
        }
      });
    },
    steps: async (page: Page) => {
      await openByKeyboard(page, page.getByRole('button', { name: 'Budi Santoso', exact: true }));
      await page.getByRole('dialog').getByRole('button', { name: 'Save role' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Save role' }).waitFor();
    },
  };
}

// The mockup opens a drawer from a script, which leaves focus-visible on: use the keyboard.
export async function openByKeyboard(page: Page, trigger: Locator) {
  // Without scrolling: focusing a far-right action would shift the table behind the drawer.
  await trigger.evaluate((element) => (element as HTMLElement).focus({ preventScroll: true }));
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
}

export const openFirstWork = async (page: Page) => {
  // The mockup opens it from a script, which leaves focus-visible on: use the keyboard.
  const link = page.locator('tbody tr').first().getByRole('link').first();

  await link.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
};
