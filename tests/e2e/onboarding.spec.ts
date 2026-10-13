import { expect, test, type Locator } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

// The seed has no backups set, so every test that moves past step 1 chooses them first.
async function setAllBackups(drawer: Locator) {
  const choices: [string, string][] = [
    ['Andi Pratama', 'Budi Santoso'],
    ['Budi Santoso', 'Rina Anggraini'],
    ['Rina Anggraini', 'Siti Aminah'],
    ['Siti Aminah', 'Andi Pratama'],
  ];

  for (const [name, backup] of choices) {
    await drawer
      .getByRole('combobox', { name: new RegExp(`^${name} · `) })
      .selectOption({ label: backup });
  }
}

test.describe('reading the onboarding steps', () => {
  let backend: Awaited<ReturnType<typeof startBackend>>;

  test.beforeAll(async () => {
    test.setTimeout(120000);
    backend = await startBackend();
  });
  test.afterAll(() => backend?.stop());
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'wait' });
  });
  test.beforeEach(async ({ page }) => {
    await connectBackend(page, backend.baseUrl);
  });

  test('Onboarding acceptance 1: step 1 lists the four people, one backup choice each', async ({
    page,
  }) => {
    await page.goto('/settings/onboarding');

    const drawer = page.getByRole('dialog');

    await expect(
      drawer.getByRole('heading', { name: 'Step 1 of 4 · People & backups' }),
    ).toBeVisible();

    await expect(drawer.locator('select')).toHaveCount(4);
    await expect(drawer.getByRole('combobox', { name: /^Siti Aminah · / })).toBeVisible();
    await expect(drawer.getByRole('combobox', { name: /^Budi Santoso · / })).toBeVisible();
    await expect(drawer.getByRole('combobox', { name: /^Rina Anggraini · / })).toBeVisible();
    await expect(drawer.getByRole('combobox', { name: /^Andi Pratama · / })).toBeVisible();
  });

  test('Onboarding acceptance 2: a missing backup stops step 1 with the sentence', async ({
    page,
  }) => {
    await page.goto('/settings/onboarding');

    const drawer = page.getByRole('dialog');
    const siti = drawer.getByRole('combobox', { name: /^Siti Aminah · / });

    await siti.selectOption({ label: 'Choose a backup' });
    await drawer.getByRole('button', { name: 'Continue', exact: true }).click();

    await expect(
      drawer.getByRole('heading', { name: 'Step 1 of 4 · People & backups' }),
    ).toBeVisible();
    await expect(
      drawer.getByText('Choose a different backup for every person before continuing.', {
        exact: true,
      }),
    ).toBeVisible();
  });

  test('Onboarding acceptance 3: with backups set, step 3 lists eight rules', async ({ page }) => {
    await page.goto('/settings/onboarding');

    const drawer = page.getByRole('dialog');

    await setAllBackups(drawer);
    await drawer.getByRole('button', { name: 'Continue', exact: true }).click();
    await drawer.getByRole('button', { name: 'Continue', exact: true }).click();

    await expect(
      drawer.getByRole('heading', { name: 'Step 3 of 4 · Default rules' }),
    ).toBeVisible();
    await expect(drawer.locator('.onboard-rule')).toHaveCount(8);
    await expect(drawer.locator('.onboard-rule').first()).toContainText(
      '15 estimated notifications / week',
    );
  });

  test('Onboarding acceptance 4: a workspace with no active group stops step 2', async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/channels$/, (route) => route.fulfill({ json: { data: [] } }));
    await page.goto('/settings/onboarding');

    const drawer = page.getByRole('dialog');

    await setAllBackups(drawer);
    await drawer.getByRole('button', { name: 'Continue', exact: true }).click();
    await drawer.getByRole('button', { name: 'Continue', exact: true }).click();

    await expect(
      drawer.getByRole('heading', { name: 'Step 2 of 4 · Telegram groups' }),
    ).toBeVisible();
    await expect(
      drawer.getByText(
        'At least one group must pass checks and be explicitly activated in Channels.',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('Onboarding acceptance 5: step 4 reports the people, the safeguards and the quiet hours', async ({
    page,
  }) => {
    await page.goto('/settings/onboarding?step=4');

    const drawer = page.getByRole('dialog');

    await expect(
      drawer.getByText('4 responsibilities with backups', { exact: true }),
    ).toBeVisible();
    await expect(
      drawer.getByText('6 / person / hour · Quiet 21:00–07:00 WIB', { exact: true }),
    ).toBeVisible();
  });
});

test.describe('listing groups in step 2', () => {
  let backend: Awaited<ReturnType<typeof startBackend>>;

  test.beforeAll(async () => {
    test.setTimeout(120000);
    backend = await startBackend();
  });
  test.afterAll(() => backend?.stop());
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'wait' });
  });
  test.beforeEach(async ({ page }) => {
    await connectBackend(page, backend.baseUrl);
  });

  test('Onboarding AC27: step 2 lists each group by name, class and status, with no chat ID', async ({
    page,
  }) => {
    await page.goto('/settings/onboarding');
    const drawer = page.getByRole('dialog');

    await setAllBackups(drawer);
    await drawer.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(
      drawer.getByRole('heading', { name: 'Step 2 of 4 · Telegram groups' }),
    ).toBeVisible();

    const groups = (await (await page.request.get(backend.baseUrl + '/api/v1/channels')).json())
      .data as {
      displayName: string;
      providerChatId: string;
      providerChatTitle: string | null;
      class: string;
      connectionStatus: string;
    }[];

    for (const group of groups) {
      const name = group.providerChatTitle ?? group.displayName;
      const groupRow = drawer.locator('.drawer-check-row').filter({ hasText: name });

      await expect(groupRow).toContainText(group.class + ' · ' + group.connectionStatus);
      await expect(groupRow).not.toContainText(group.providerChatId);
    }
  });

  test('Onboarding AC27: a group with a Telegram title is listed by that title', async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/channels$/, async (route) => {
      const body = await (await page.request.get(backend.baseUrl + '/api/v1/channels')).json();
      const data = body.data.map((group: { displayName: string }) =>
        group.displayName === 'Operations' ? { ...group, providerChatTitle: 'Ops floor' } : group,
      );

      await route.fulfill({ json: { data } });
    });
    await page.goto('/settings/onboarding');
    const drawer = page.getByRole('dialog');

    await setAllBackups(drawer);
    await drawer.getByRole('button', { name: 'Continue', exact: true }).click();
    await drawer.getByRole('button', { name: 'Continue', exact: true }).click();

    await expect(
      drawer.locator('.drawer-check-row').filter({ hasText: 'Ops floor' }),
    ).toBeVisible();
    await expect(drawer.locator('.drawer-check-row').filter({ hasText: 'Operations' })).toHaveCount(
      0,
    );
  });
});

test.describe('finishing onboarding', () => {
  let backend: Awaited<ReturnType<typeof startBackend>> | undefined;

  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    backend = await startBackend();
    await connectBackend(page, backend.baseUrl);
  });
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'wait' });
    backend?.stop();
  });

  test('Onboarding acceptance 6: finishing closes the drawer on / and activates no draft group', async ({
    page,
  }) => {
    const activeGroups = async () => {
      const response = await page.request.get(`${backend?.baseUrl}/api/v1/channels`);
      const body = (await response.json()) as { data: { connectionStatus: string }[] };

      return body.data.filter((channel) => channel.connectionStatus === 'active').length;
    };

    const before = await activeGroups();

    await page.goto('/settings/onboarding');

    const drawer = page.getByRole('dialog');

    await setAllBackups(drawer);
    await drawer.getByRole('button', { name: 'Continue', exact: true }).click();
    await drawer.getByRole('button', { name: 'Continue', exact: true }).click();
    await drawer.getByRole('button', { name: 'Continue', exact: true }).click();
    await drawer.getByRole('button', { name: 'Finish setup', exact: true }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await activeGroups()).toBe(before);
  });
});
