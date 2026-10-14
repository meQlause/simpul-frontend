// The views the app is compared on; how each is reached is in pages.helpers.ts.
import { connectedWorkspace, pendingWorkspace, STRING } from '../e2e/helpers/database';
import {
  AUTH_TOLERANCE,
  SETTINGS_TOLERANCE,
  SETUP_TOLERANCE,
  SHELL_TOLERANCE,
  PREVIEW_TOLERANCE,
  checkedGroup,
  mockupPeople,
  mockupQueue,
  mockupWork,
  onboardingAt,
  openByKeyboard,
  openFirstWork,
  refused,
  roleSave,
  settleHeading,
  signedOut,
  workDetail,
} from './pages.helpers.ts';
import type { AppView, Json } from './pages.helpers.ts';

export type { AppView } from './pages.helpers.ts';

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
    tolerance: SETUP_TOLERANCE,
    path: '/channels',
    steps: (page) =>
      openByKeyboard(page, page.locator('tbody tr').first().locator('.directory-title')),
  },
  {
    view: 'channels.add',
    tolerance: SETUP_TOLERANCE,
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
  { view: 'channels.verified', path: '/channels', tolerance: SETUP_TOLERANCE, ...checkedGroup() },
  {
    view: 'channels.needs-action',
    tolerance: SETUP_TOLERANCE,
    path: '/channels',
    ...checkedGroup((verification) => {
      const checks = verification.checks as Json[];

      checks[3] = { ...checks[3], status: 'fail', action: 'Disable privacy mode in BotFather' };
      verification.activationReady = false;
    }),
  },
  {
    view: 'channels.expired',
    tolerance: SETUP_TOLERANCE,
    path: '/channels',
    ...checkedGroup((verification) => {
      verification.expiresAt = '2026-10-10T03:00:00Z';
    }, true),
  },
  {
    view: 'database.setup',
    tolerance: AUTH_TOLERANCE,
    path: '/',
    prepare: async (page) => {
      await pendingWorkspace(page);
    },
  },
  {
    view: 'database.notice-not-accepted',
    tolerance: AUTH_TOLERANCE,
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
    // The mockup's "Demo only" line under the form is not built (FD-17), and the card is centred
    // (FD-19): content below shifts.
    tolerance: AUTH_TOLERANCE,
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
    tolerance: AUTH_TOLERANCE,
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
    tolerance: SHELL_TOLERANCE,
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
  {
    view: 'drawer.not-found',
    path: '/work',
    prepare: async (page, backendUrl) => {
      await mockupWork(page, backendUrl);
      await workDetail('not-found')(page);
    },
    steps: (page) => openFirstWork(page),
  },
  {
    view: 'drawer.error',
    path: '/work',
    prepare: async (page, backendUrl) => {
      await mockupWork(page, backendUrl);
      await workDetail('error')(page);
    },
    steps: (page) => openFirstWork(page),
  },
  { view: 'drawer.saving', path: '/people', ...roleSave('saving') },
  { view: 'drawer.failed', path: '/people', ...roleSave('failed') },
  {
    view: 'auth.sign-in',
    path: '/sign-in',
    anonymous: true,
    tolerance: AUTH_TOLERANCE,
    prepare: signedOut,
  },
  {
    view: 'auth.sign-in-failed',
    path: '/sign-in',
    anonymous: true,
    tolerance: AUTH_TOLERANCE,
    prepare: async (page) => {
      await signedOut(page);
      await page.route('**/api/auth/sign-in/email', (route) =>
        route.fulfill(refused('E-AUTH-INVALID', 401)),
      );
    },
    steps: async (page) => {
      await page.getByLabel('Email', { exact: true }).fill('siti@pointstar.example');
      await page.getByLabel('Password', { exact: true }).fill('wrong');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: /./ }).first().waitFor();
      await page.evaluate(() => window.scrollTo(0, 0));
    },
  },
  {
    view: 'auth.set-password',
    path: '/set-password',
    anonymous: true,
    tolerance: AUTH_TOLERANCE,
    prepare: signedOut,
  },
  {
    view: 'auth.set-password-differs',
    path: '/set-password',
    anonymous: true,
    tolerance: AUTH_TOLERANCE,
    prepare: signedOut,
    steps: async (page) => {
      await page.getByLabel('New password', { exact: true }).fill('one-password');
      await page.getByLabel('Confirm password', { exact: true }).fill('another');
      await page.getByRole('button', { name: /^(Set|Save|Create)/ }).click();
      await page.getByRole('alert').filter({ hasText: /./ }).first().waitFor();
      await page.evaluate(() => window.scrollTo(0, 0));
    },
  },
  {
    view: 'auth.no-access',
    path: '/',
    tolerance: AUTH_TOLERANCE,
    prepare: async (page) => {
      await page.route('**/api/v1/**', (route) => {
        if (route.request().url().endsWith('/me')) {
          return route.fulfill({
            json: { data: { person: { name: 'Budi Santoso', roleName: 'Warehouse Lead' } } },
          });
        }

        return route.fulfill(refused('E-FORBIDDEN', 403));
      });
    },
  },
  { view: 'audit.ready', path: '/audit' },
  {
    view: 'audit.trace',
    path: '/audit',
    steps: (page) =>
      openByKeyboard(page, page.locator('tbody tr').first().locator('button, a').first()),
  },
  { view: 'settings.ready', path: '/settings', tolerance: SETTINGS_TOLERANCE },
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
    // FD-20: the body is 32px wider than the mockup's, so the last step's text wraps differently.
    tolerance: step === 4 ? AUTH_TOLERANCE : undefined,
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
    tolerance: SHELL_TOLERANCE,
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
