// The fidelity matrix (docs/FE/fidelity.md §1) as data: each view is reached on the mockup by a
// list of steps. The same ids name the baseline images and the app's captures.

export type Step =
  | { click: string }
  | { nav: string }
  | { set: string; value: string }
  | { check: string }
  | { submit: string }
  | { eval: string }
  | { wait: number }
  | { scroll: string }
  | { closeDialog: true };

export type View = { id: string; steps: Step[] };

const PAGES = ['overview', 'work', 'queue', 'rules', 'people', 'channels', 'audit', 'settings'];
const STATES = ['ready', 'loading', 'empty', 'error', 'offline', 'not-found'];

// The mockup's sample group check answers after a short delay.
const CHECK_MS = 2500;

const nav = (route: string): Step => ({ nav: route });
const click = (selector: string): Step => ({ click: selector });

function pageStates(): View[] {
  return PAGES.flatMap((route) =>
    STATES.map((state) => ({
      id: `${route}.${state}`,
      steps: state === 'ready' ? [nav(route)] : [nav(route), click(`[data-view-state="${state}"]`)],
    })),
  );
}

function drawer(id: string, route: string, ...selectors: string[]): View {
  return { id, steps: [nav(route), ...selectors.map(click)] };
}

function drawers(): View[] {
  return [
    drawer('overview.guide', 'overview', '[data-action="help"]'),
    drawer('overview.workspace', 'overview', '[data-action="workspace"]'),
    drawer('work.detail', 'work', '#jobs-body [data-job]'),
    drawer('work.close', 'work', '#jobs-body [data-job]', '[data-complete]'),
    drawer('queue.review', 'queue', '[data-review]'),
    drawer('queue.mapping', 'queue', '[data-resolve="4"]'),
    drawer('rules.edit', 'rules', '[data-edit-rule]'),
    drawer('rules.create', 'rules', '[data-action="create-rule"]'),
    {
      id: 'rules.create-field-error',
      steps: [
        nav('rules'),
        click('[data-action="create-rule"]'),
        { set: '#rule-form [name="name"]', value: '' },
        { submit: '#rule-form' },
      ],
    },
    drawer('people.role', 'people', '[data-person]'),
    drawer('channels.configure', 'channels', '[data-channel]'),
    drawer('channels.add', 'channels', '[data-action="add-channel"]'),
    drawer('channels.connection', 'channels', '[data-action="manage-bot"]'),
    drawer('channels.pause', 'channels', '[data-toggle-channel]'),
    drawer('audit.trace', 'audit', '[data-audit]'),
    drawer('settings.vocabulary.categories', 'settings', '[data-action="vocabulary"]'),
    drawer(
      'settings.vocabulary.aliases',
      'settings',
      '[data-action="vocabulary"]',
      '[data-vocab-tab="aliases"]',
    ),
    drawer(
      'settings.vocabulary.templates',
      'settings',
      '[data-action="vocabulary"]',
      '[data-vocab-tab="templates"]',
    ),
    drawer('settings.preview.notification', 'settings', '[data-action="delivery"]'),
    drawer(
      'settings.preview.clarification',
      'settings',
      '[data-action="delivery"]',
      '[data-delivery-tab="clarification"]',
    ),
    drawer(
      'settings.preview.digest',
      'settings',
      '[data-action="delivery"]',
      '[data-delivery-tab="digest"]',
    ),
    drawer(
      'settings.preview.voice-note',
      'settings',
      '[data-action="delivery"]',
      '[data-delivery-tab="media"]',
    ),
    drawer('settings.mail.empty', 'settings', '[data-action="mail"]'),
  ];
}

function onboarding(): View[] {
  const open = [nav('settings'), click('[data-action="onboarding"]')];
  const fillBackups: Step = {
    eval: `document.querySelectorAll('#onboarding-form select').forEach((select) => {
      const option = [...select.options].find((entry) => entry.value && entry.value !== select.closest('.onboard-person').querySelector('strong').textContent);
      if (option) { select.value = option.value; select.dispatchEvent(new Event('change', { bubbles: true })); }
    })`,
  };
  const next = click('[data-action="onboard-next"]');

  return [
    { id: 'settings.onboarding.1', steps: open },
    { id: 'settings.onboarding.2', steps: [...open, fillBackups, next] },
    { id: 'settings.onboarding.3', steps: [...open, fillBackups, next, next] },
    { id: 'settings.onboarding.4', steps: [...open, fillBackups, next, next, next] },
  ];
}

function authViews(): View[] {
  const state = (name: string): Step[] => [nav('overview'), click(`[data-view-state="${name}"]`)];

  return [
    { id: 'auth.sign-in', steps: state('sign-in') },
    {
      id: 'auth.sign-in-failed',
      steps: [
        ...state('sign-in'),
        { set: '#sign-in-form [name="email"]', value: 'siti@pointstar.example' },
        { set: '#sign-in-form [name="password"]', value: 'wrong' },
        { submit: '#sign-in-form' },
      ],
    },
    { id: 'auth.set-password', steps: state('set-password') },
    {
      id: 'auth.set-password-differs',
      steps: [
        ...state('set-password'),
        { set: '#set-password-form [name="password"]', value: 'one-password' },
        { set: '#set-password-form [name="confirm"]', value: 'another' },
        { submit: '#set-password-form' },
      ],
    },
    { id: 'auth.no-access', steps: state('no-access') },
    { id: 'database.setup', steps: state('database-setup') },
    {
      id: 'database.notice-not-accepted',
      steps: [
        ...state('database-setup'),
        {
          set: '#database-form [name="connection"]',
          value: 'postgres://u:p@db.example:5432/simpul',
        },
        { submit: '#database-form' },
      ],
    },
    {
      id: 'database.check-failed',
      steps: [
        ...state('database-setup'),
        { check: '#database-form [name="ack"]' },
        {
          set: '#database-form [name="connection"]',
          value: 'postgres://u:p@db.example:5432/novector',
        },
        { submit: '#database-form' },
      ],
    },
    {
      id: 'database.connecting',
      steps: [
        ...state('database-setup'),
        { check: '#database-form [name="ack"]' },
        { set: '#database-form [name="connection"]', value: 'postgres://u:p@db.example:5432/slow' },
        { submit: '#database-form' },
      ],
    },
    { id: 'database.unavailable', steps: state('database-unavailable') },
  ];
}

function databaseSettings(): View[] {
  const connect: Step[] = [
    nav('overview'),
    click('[data-view-state="database-setup"]'),
    { check: '#database-form [name="ack"]' },
    { set: '#database-form [name="connection"]', value: 'postgres://u:p@db.example:5432/simpul' },
    { submit: '#database-form' },
    nav('settings'),
    click('[data-action="database"]'),
  ];

  return [
    { id: 'settings.database.connected', steps: connect },
    {
      id: 'settings.database.update-refused',
      steps: [
        ...connect,
        {
          set: '#database-update-form [name="connection"]',
          value: 'postgres://u:p@db.example:5432/empty',
        },
        { submit: '#database-update-form' },
      ],
    },
  ];
}

function mailSaved(): View[] {
  return [
    {
      id: 'settings.mail.saved',
      steps: [
        nav('settings'),
        click('[data-action="mail"]'),
        { set: '#mail-form [name="host"]', value: 'smtp.pointstar.example' },
        { set: '#mail-form [name="port"]', value: '587' },
        { set: '#mail-form [name="username"]', value: 'simpul@pointstar.example' },
        { set: '#mail-form [name="password"]', value: 'secret' },
        { set: '#mail-form [name="from"]', value: 'simpul@pointstar.example' },
        { submit: '#mail-form' },
        nav('settings'),
        click('[data-action="mail"]'),
      ],
    },
  ];
}

function drawerStates(): View[] {
  return ['loading', 'not-found', 'error', 'saving', 'failed'].map((state) => ({
    id: `drawer.${state}`,
    steps: [nav('work'), click('#jobs-body [data-job]'), click(`[data-drawer-state="${state}"]`)],
  }));
}

function channelForms(): View[] {
  const open: Step[] = [
    nav('channels'),
    click('[data-action="add-channel"]'),
    { set: '#channel-form [name="name"]', value: 'Sales & Order' },
    { set: '#channel-form [name="chatId"]', value: '-1001234567890' },
  ];
  const check: Step[] = [click('[data-action="check-channel"]'), { wait: CHECK_MS }];
  const verified: Step[] = [...open, ...check, click('[data-action="check-inbound"]')];
  const show: Step = { scroll: '#channel-form .drawer-check-row' };

  return [
    { id: 'channels.verified', steps: [...verified, show] },
    {
      id: 'channels.needs-action',
      steps: [
        ...open,
        { set: '#channel-form [name="scenario"]', value: 'privacy' },
        ...check,
        show,
      ],
    },
    {
      id: 'channels.expired',
      steps: [...verified, click('[data-action="expire-check"]'), { wait: CHECK_MS }, show],
    },
  ];
}

export const views: View[] = [
  ...pageStates(),
  ...drawers(),
  ...onboarding(),
  ...authViews(),
  ...databaseSettings(),
  ...mailSaved(),
  ...drawerStates(),
  ...channelForms(),
];

export const widths = [1440, 900, 375];
