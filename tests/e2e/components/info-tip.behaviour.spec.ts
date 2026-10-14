import { expect, test, type Page } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';
import { connectedWorkspace } from '../helpers/database';

type Row = {
  name: string;
  path: string;
  open?: (page: Page) => Promise<void>;
  tip: string | RegExp;
  sentence: string;
};

const SENTENCE = 'One Telegram connection. A clear policy for every group.';
const WORK = 'The full picture, from the first update to the next step.';
const EVIDENCE =
  'Raw conversations are restricted. The recorded summaries remain visible according to your role.';
const NOTICE =
  'High confidence comes first. Ambiguity is clarified in the original group; corrections improve calibration.';
const PRIVACY = 'Raw chat access remains restricted. Notifications follow configured rules.';
const SETUP_CODE = 'The command identifies a candidate group. It never starts monitoring.';
const DECISION = 'Decisions are shown as summaries. Source message content is not exposed.';
const CONNECT =
  'Add the bot to your group, verify ordinary messages, then activate monitoring. Saving a draft never starts ingestion.';
const CALLOUT =
  'These are routing and vocabulary gaps. Questions about ambiguous work stay in the original conversation with the people who know.';
const BUDGET = 'Additional updates are combined into a digest.';
const CONTEXT =
  "When a message is unclear, Simpul reads the group's recent messages to understand it. 0 turns this off: Simpul then reads only the message itself, and asks the group when that is not enough.";
const PREFIX = 'Three letters, used in work IDs such as ORD-0091. Fixed once work exists.';
const CONDITION = 'Use an event or condition, rather than a message to send.';

const about = (page: Page) => page.getByRole('button', { name: 'About Channels', exact: true });
const tip = (page: Page) => page.getByRole('tooltip');
const byName = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name, exact: typeof name === 'string' }).first();
// The tip that holds this sentence: it is the button in the info tip whose tooltip says it.
const tipOf = (page: Page, sentence: string) =>
  page
    .locator('.info-tip', { has: page.locator('[role="tooltip"]', { hasText: sentence }) })
    .getByRole('button')
    .first();

const openFirstTrace = async (page: Page) => {
  await page.locator('a[href^="/audit/"]').first().click();
  await page.getByRole('tab', { name: 'Linked context', exact: true }).click();
};

const openFirstPerson = async (page: Page) => {
  await page.locator('tr[data-component="PersonRow"] button.directory-title').first().click();
};

const openFirstReview = async (page: Page) => {
  await page.locator('a.directory-title').first().click();
};

const openFirstMapping = async (page: Page) => {
  await page.goto('/queue?kind=alias');
  const href = await page.locator('a.directory-title').first().getAttribute('href');

  await page.goto(`${href}/resolve`);
};

const openTab = (index: number) => async (page: Page) => {
  await page.getByRole('tab').nth(index).click();
};

const openConnection = async (page: Page) => {
  await page
    .getByRole('button', { name: 'Manage Telegram connection', exact: true })
    .first()
    .click();
};

const openDatabase = async (page: Page) => {
  await connectedWorkspace(page);
  await page.goto('/settings/database');
};

const openWorkspace = async (page: Page) => {
  await page.locator('button.workspace').click();
};

const ROWS: Row[] = [
  { name: 'the work drawer header', path: '/work/ORD-0091', tip: /^About /, sentence: WORK },
  {
    name: 'the work drawer section',
    path: '/work/ORD-0091',
    tip: 'About Ownership',
    sentence: 'Who is responsible for the next step.',
  },
  {
    name: 'the work drawer evidence card',
    path: '/work/ORD-0091',
    tip: 'About Evidence summaries only',
    sentence: EVIDENCE,
  },
  {
    name: 'the onboarding notice card',
    path: '/settings/onboarding?step=4',
    tip: 'About Expect fewer notifications at first',
    sentence: NOTICE,
  },
  {
    name: 'the onboarding step 1 section',
    path: '/settings/onboarding',
    tip: 'About A person for every responsibility',
    sentence: 'These people are observed members or admin input, not a complete Telegram roster.',
  },
  {
    name: 'the onboarding step 2 section',
    path: '/settings/onboarding?step=2',
    tip: 'About Know which conversations are monitored',
    sentence: 'Activation is separate from this wizard. Each group must pass its own checks.',
  },
  {
    name: 'the onboarding step 3 section',
    path: '/settings/onboarding?step=3',
    tip: 'About Start with useful defaults',
    sentence: 'Turn off what your team does not need. Estimates cover the last 30 days.',
  },
  {
    name: 'the onboarding step 4 section',
    path: '/settings/onboarding?step=4',
    tip: 'About A deliberately quiet first week',
    sentence: 'Monitoring never means every update becomes a notification.',
  },
  {
    name: 'the channel setup step two',
    path: '/channels/new',
    tip: 'About Send the code in the group',
    sentence: SETUP_CODE,
  },
  {
    name: 'the channel audience card',
    path: '/channels/new',
    tip: /^About (External|Internal) audience/,
    sentence: PRIVACY,
  },
  {
    name: 'the trace drawer card',
    path: '/audit',
    open: openFirstTrace,
    tip: 'About Raw conversation access is restricted',
    sentence: DECISION,
  },
  {
    name: 'the person responsibility section',
    path: '/people',
    open: openFirstPerson,
    tip: 'About Responsibility',
    sentence: 'This role determines which updates are relevant.',
  },
  {
    name: 'the person backup section',
    path: '/people',
    open: openFirstPerson,
    tip: 'About A reliable backup',
    sentence: 'Keep information moving when the owner is away.',
  },
  {
    name: 'the person delivery section',
    path: '/people',
    open: openFirstPerson,
    tip: 'About Delivery preferences',
    sentence: 'Configured at workspace level.',
  },
  {
    name: 'the rule section "When should this rule apply?"',
    path: '/rules/new',
    tip: 'About When should this rule apply?',
    sentence: 'Describe the update in everyday language.',
  },
  {
    name: 'the rule section "Who needs to know?"',
    path: '/rules/new',
    tip: 'About Who needs to know?',
    sentence: 'Keep updates focused on the responsible person.',
  },
  {
    name: 'the rule section "What about past events?"',
    path: '/rules/new',
    tip: 'About What about past events?',
    sentence: 'Choose how this rule handles existing updates.',
  },
  {
    name: 'the categories section',
    path: '/settings/vocabulary',
    tip: /^About (Add a category|Edit )/,
    sentence: 'Description and examples make the label useful; they never choose a recipient.',
  },
  {
    name: 'the aliases section',
    path: '/settings/vocabulary',
    open: openTab(1),
    tip: 'About Link an everyday name',
    sentence: 'Aliases resolve a person; routing still follows their role.',
  },
  {
    name: 'the templates section',
    path: '/settings/vocabulary',
    open: openTab(2),
    tip: 'About Internal update template',
    sentence: 'Only approved summary fields can be used.',
  },
  {
    name: 'the workspace drawer section',
    path: '/',
    open: openWorkspace,
    tip: 'About Your workspace',
    sentence: 'The people and conversations connected here.',
  },
  {
    name: 'the Home flow card',
    path: '/',
    tip: 'About Busy conversations. Clear next steps.',
    sentence: 'Simpul connects updates, context, and the people who need to know.',
  },
  {
    name: 'the channels callout',
    path: '/channels',
    tip: 'About Connect deliberately',
    sentence: CONNECT,
  },
  {
    name: 'the settings callout',
    path: '/settings',
    tip: 'About Vocabulary & message templates',
    sentence: 'Categories, aliases and approved notification wording.',
  },
  {
    name: 'the review drawer section "The detected update"',
    path: '/queue',
    open: openFirstReview,
    tip: 'About The detected update',
    sentence: 'A safe summary from its source conversation.',
  },
  {
    name: 'the review drawer section "Your next step"',
    path: '/queue',
    open: openFirstReview,
    tip: 'About Your next step',
    sentence: 'Resolve the configuration gap, once.',
  },
  {
    name: 'the mapping form section',
    path: '/queue',
    open: openFirstMapping,
    tip: /^About (Link to the right person|Choose the right category)$/,
    sentence: 'Your decision applies to similar future updates.',
  },
  {
    name: 'the queue callout',
    path: '/queue',
    tip: 'About Resolve the configuration, improve the next update',
    sentence: CALLOUT,
  },
  {
    name: 'the connection drawer section',
    path: '/channels',
    open: openConnection,
    tip: 'About Connection details',
    sentence: 'The credential is stored separately and never shown again.',
  },
  {
    name: 'the database drawer section',
    path: '/settings/database',
    open: openDatabase,
    tip: 'About Connection',
    sentence: 'Where this workspace’s data is stored.',
  },
];

const HINTS = [
  {
    name: 'the rule condition',
    path: '/rules/new',
    label: 'When this rule applies',
    hint: CONDITION,
  },
  {
    name: 'the category ID prefix',
    path: '/settings/vocabulary',
    label: 'ID prefix',
    hint: PREFIX,
  },
  {
    name: 'the hourly limit',
    path: '/settings',
    label: 'Notifications per person / hour',
    hint: BUDGET,
  },
  {
    name: 'the context window',
    path: '/settings',
    label: 'Conversation context window (minutes)',
    hint: CONTEXT,
  },
];

const PAGES = [
  {
    path: '/',
    tip: 'About Good morning',
    sentence: 'Conversations keep moving. Important updates reach the right people.',
  },
  {
    path: '/work',
    tip: 'About Work',
    sentence: 'Commitments from conversations, tracked through completion.',
  },
  {
    path: '/queue',
    tip: 'About Needs review',
    sentence: 'Resolve the gaps that keep useful updates from reaching your team.',
  },
  {
    path: '/rules',
    tip: 'About Notification rules',
    sentence: 'Define when an update matters, and who should receive it.',
  },
  {
    path: '/people',
    tip: 'About People & structure',
    sentence: 'Clear ownership, reliable backups, and fewer missed updates.',
  },
  { path: '/channels', tip: 'About Channels', sentence: SENTENCE },
  {
    path: '/audit',
    tip: 'About History & audit',
    sentence: 'Follow an update from its source to the rule, recipient, and final outcome.',
  },
  {
    path: '/settings',
    tip: 'About Settings',
    sentence: 'Keep information flowing without overwhelming your team.',
  },
];

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  test.setTimeout(60000);
  backend = await startBackend();
});
test.afterAll(() => {
  backend?.stop();
});
test.beforeEach(async ({ page }) => {
  await connectBackend(page, backend.baseUrl);
});

test.describe('the Channels heading tip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/channels');
  });

  test('T5: hovering About Channels shows the sentence, and moving away hides it', async ({
    page,
  }) => {
    await expect(page.locator('.page-description')).toHaveCount(0);
    await about(page).hover();
    await expect(tip(page)).toHaveText(SENTENCE);
    await page.mouse.move(0, 0);
    await expect(tip(page)).toBeHidden();
  });

  test('T9: the button is named About Channels and is described by the sentence while closed', async ({
    page,
  }) => {
    await expect(tip(page)).toBeHidden();
    await expect(about(page)).toHaveAccessibleDescription(SENTENCE);
  });

  test('T7: focus shows the sentence, and Tab away hides it', async ({ page }) => {
    await about(page).focus();
    await expect(tip(page)).toHaveText(SENTENCE);
    await page.keyboard.press('Tab');
    await expect(tip(page)).toBeHidden();
  });

  test('T8: Escape hides the sentence and leaves focus on the button', async ({ page }) => {
    await about(page).focus();
    await expect(tip(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tip(page)).toBeHidden();
    await expect(about(page)).toBeFocused();
  });

  test.describe('on a 375px phone', () => {
    test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

    test('T6: a tap shows the sentence, and a tap outside hides it', async ({ page }) => {
      await about(page).tap();
      await expect(tip(page)).toHaveText(SENTENCE);
      await page.locator('h1').tap();
      await expect(tip(page)).toBeHidden();
    });

    test('T11: an open tip is at most 280px wide and inside the viewport', async ({ page }) => {
      await about(page).tap();
      // No box means no open tip: the sentinel fails every check below.
      const box = (await tip(page).boundingBox()) ?? { x: -1, y: 0, width: Infinity, height: 0 };

      expect(box.width).toBeLessThanOrEqual(280);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(375);
    });
  });
});

test.describe('in a drawer, at 1440px', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('T10: the drawer title tip is inside the dialog; Escape hides it, and a second Escape closes the drawer', async ({
    page,
  }) => {
    await page.goto('/work/ORD-0091');
    const dialog = page.getByRole('dialog');

    await dialog
      .locator('.drawer-screen-header')
      .getByRole('button', { name: /^About / })
      .focus();
    await expect(dialog.getByRole('tooltip')).toBeVisible();
    await expect(dialog.getByRole('tooltip')).toHaveText(WORK);
    await page.keyboard.press('Escape');
    await expect(dialog.getByRole('tooltip')).toBeHidden();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('T11: an open tip in the drawer sits inside the dialog box at 1440px', async ({ page }) => {
    await page.goto('/work/ORD-0091');
    const dialog = page.getByRole('dialog');

    await dialog
      .locator('.drawer-screen-header')
      .getByRole('button', { name: /^About / })
      .hover();
    await expect(dialog.getByRole('tooltip')).toBeVisible();
    // No box means no open tip: the sentinels fail the containment checks below.
    const box = (await dialog.getByRole('tooltip').boundingBox()) ?? {
      x: -1,
      y: -1,
      width: Infinity,
      height: Infinity,
    };
    const frame = (await dialog.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };

    expect(box.x).toBeGreaterThanOrEqual(frame.x);
    expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width);
    expect(box.y + box.height).toBeLessThanOrEqual(frame.y + frame.height);
  });

  test('T12: the trace drawer, held while loading, shows no info tip in its header', async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/decisions\/[^/?]+(\?|$)/, () => undefined);
    await page.goto('/audit/DEC-HELD');
    const dialog = page.getByRole('dialog');

    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.drawer-screen-header')).toBeVisible();
    await expect(
      dialog.locator('.drawer-screen-header').getByRole('button', { name: /^About/ }),
    ).toHaveCount(0);
  });
});

for (const row of ROWS) {
  test(`T14: ${row.name} keeps its sentence in a tip, not on screen`, async ({ page }) => {
    await page.goto(row.path);

    if (row.open) {
      await row.open(page);
    }

    await expect(byName(page, row.tip)).toBeVisible();
    await expect(tipOf(page, row.sentence)).toBeVisible();
    // Only what is drawn counts: a sentence also held by a tip elsewhere on the page is not a line.
    await expect(
      page.getByText(row.sentence, { exact: true }).filter({ visible: true }),
    ).toHaveCount(0);
  });
}

for (const hint of HINTS) {
  test(`T15: ${hint.name} hint is behind a tip, and the field is still found by its label`, async ({
    page,
  }) => {
    await page.goto(hint.path);
    await expect(page.getByText(hint.hint, { exact: true })).toBeHidden();
    await expect(
      page.getByRole('button', { name: `About ${hint.label}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel(hint.label, { exact: true })).toBeVisible();
  });
}

for (const entry of PAGES) {
  test(`T13: ${entry.path} keeps its description in a tip after the title, not on screen`, async ({
    page,
  }) => {
    await page.goto(entry.path);
    await expect(page.locator('.page-description')).toHaveCount(0);
    const heading = page.locator('h1 + [data-component="InfoTip"]');

    await expect(heading).toHaveCount(1);
    await expect(heading.getByRole('button', { name: entry.tip, exact: true })).toHaveCount(1);
    await expect(heading.locator('[role="tooltip"]')).toHaveText(entry.sentence);
    await expect(page.getByText(entry.sentence, { exact: true })).toBeHidden();
  });
}

test('T16: the role help and the channel identity line stay on screen, with no tip beside them', async ({
  page,
}) => {
  await page.goto('/people');
  await page.locator('tr[data-component="PersonRow"] button.directory-title').first().click();
  await expect(page.getByText('Use the role your team recognizes.', { exact: true })).toBeVisible();
  await page.goto('/channels/new');
  await expect(page.getByText('Telegram groups & supergroups only', { exact: true })).toBeVisible();
});

test('T16: a field error stays under its field and is drawn', async ({ page }) => {
  await page.goto('/rules/new');
  const drawer = page.getByRole('dialog');

  // The heading's "Create rule" is a link to this page; the form saves with "Save rule".
  await drawer.getByLabel('Rule name', { exact: true }).fill('');
  await drawer.getByRole('button', { name: 'Save rule', exact: true }).click();
  await expect(page.getByRole('alert').filter({ visible: true }).first()).toBeVisible();
});
