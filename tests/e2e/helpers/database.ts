import type { Page } from '@playwright/test';

const SETUP_REQUIRED = {
  error: {
    code: 'E-DB-SETUP-REQUIRED',
    message: '',
    details: [],
    requestId: 'database-setup',
  },
};

export type Options = { put?: (body: unknown) => Promise<{ status: number; json: unknown }> };

const EMPTY_PAGE = { nextCursor: null, total: 0 };
const CONNECTED_AFTER = { mode: 'own', status: 'connected', host: 'db.pointstar.example' };

function dataOf(path: string, connected: boolean) {
  if (!path.endsWith('/database')) {
    return {};
  }

  return { mode: 'own', status: connected ? 'connected' : 'pending' };
}

// A pending own-database workspace: every admin endpoint but /database answers
// E-DB-SETUP-REQUIRED until a PUT succeeds, then the workspace is connected and empty.
export async function pendingWorkspace(page: Page, options: Options = {}) {
  const writes: unknown[] = [];
  let connected = false;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (!path.endsWith('/database') && !connected) {
      await route.fulfill({ status: 409, json: SETUP_REQUIRED });

      return;
    }

    if (path.endsWith('/database') && request.method() === 'PUT') {
      writes.push(request.postDataJSON());
      const answer = (await options.put?.(request.postDataJSON())) ?? {
        status: 200,
        json: { data: CONNECTED_AFTER },
      };

      connected = answer.status === 200;
      await route.fulfill({ status: answer.status, json: answer.json });

      return;
    }

    await route.fulfill({ json: { data: dataOf(path, connected), page: EMPTY_PAGE } });
  });

  return writes;
}

export const STRING =
  'postgres://simpul:secret-pass@db.pointstar.example:5432/simpul?sslmode=require';

const CONNECTED = {
  mode: 'own',
  status: 'connected',
  host: 'db.pointstar.example',
  port: 5432,
  databaseName: 'simpul',
  schemaVersion: '0007',
  unreachableSince: null,
};
const IDENTITY = {
  person: { name: 'Siti Aminah', roleName: 'Operations Manager' },
  workspace: {
    name: 'Point Star',
    descriptor: 'Operations workspace',
    timezone: 'Asia/Jakarta',
    counts: { members: 4, channels: 3, activeRules: 3 },
  },
};
const SETTINGS = {
  quietStart: '21:00',
  quietEnd: '07:00',
  budgetPerHour: 6,
  digestTime: '08:30',
  holdSeconds: 60,
  timezone: 'Asia/Jakarta',
  contextWindowMinutes: 30,
  contextMaxMessages: 10,
  messageTextAccess: false,
};

// A connected own-database workspace with the Settings page's own data.
type Answer = { status: number; json: unknown };

export async function connectedWorkspace(page: Page, put?: () => Answer, hosted = false) {
  const pages: Record<string, unknown> = {
    '/me': IDENTITY,
    '/settings': SETTINGS,
    '/overview': { activeWork: { count: 0 } },
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api/v1', '');

    if (path === '/database') {
      await route.fulfill(databaseAnswer(request.method(), hosted, put));

      return;
    }

    await route.fulfill({
      json: { data: pages[path] ?? [], page: { nextCursor: null, total: 0 } },
    });
  });
}

function databaseAnswer(method: string, hosted: boolean, put?: () => Answer) {
  if (hosted) {
    return {
      status: 404,
      json: { error: { code: 'E-NOT-FOUND', message: '', details: [], requestId: 'hosted' } },
    };
  }

  if (method === 'PUT') {
    return put?.() ?? { status: 200, json: { data: CONNECTED } };
  }

  return { status: 200, json: { data: CONNECTED } };
}
