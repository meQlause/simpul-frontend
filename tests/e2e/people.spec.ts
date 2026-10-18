import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  test.setTimeout(60000);
  backend = await startBackend();
});
test.afterAll(() => {
  backend?.stop();
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});
test.beforeEach(async ({ page }) => {
  await connectBackend(page, backend.baseUrl);
  await page.goto('/people');
});

test('People acceptance 1–2: four role holders and Budi’s responsibility are listed', async ({
  page,
}) => {
  const rows = page.getByRole('row');

  await expect(rows).toHaveCount(5);
  await expect(page.getByText('4 team members with defined roles.', { exact: true })).toBeVisible();
  const budi = rows.filter({
    has: page.getByRole('button', { name: 'Budi Santoso', exact: true }),
  });

  for (const name of ['Warehouse Lead', 'Reports to Siti Aminah', 'Available']) {
    await expect(budi.getByText(name, { exact: true })).toBeVisible();
  }

  await expect(budi.locator('.backup-person')).toHaveText('SASiti Aminah');

  await expect(page.getByRole('button', { name: 'Mr. Hendra', exact: true })).toHaveCount(0);
});

test('People acceptance 3–5: availability persists and all eligible people are offered', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Budi Santoso', exact: true }).click();
  const drawer = page.getByRole('dialog');

  for (const label of ['Backup person', 'Direct supervisor']) {
    const select = drawer.getByLabel(label, { exact: true });

    await expect(select.getByRole('option', { name: 'Mr. Hendra', exact: true })).toHaveCount(1);
    await expect(select.getByRole('option', { name: 'Budi Santoso', exact: true })).toHaveCount(0);
  }

  await drawer.getByLabel('Availability', { exact: true }).selectOption('leave');
  await drawer.getByRole('button', { name: 'Save role', exact: true }).click();
  await expect(drawer).toHaveCount(0);
  const budi = page
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: 'Budi Santoso', exact: true }) });

  await expect(budi.getByText('On leave', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Budi Santoso', exact: true }).click();
  await expect(page.getByRole('dialog').getByLabel('Availability', { exact: true })).toHaveValue(
    'leave',
  );
});

test('People acceptance 6: clearing Role saves nothing and focuses its field error', async ({
  page,
}) => {
  let writes = 0;

  page.on('request', (request) => {
    if (request.method() === 'PATCH') {
      writes += 1;
    }
  });
  await page.getByRole('button', { name: 'Budi Santoso', exact: true }).click();
  const drawer = page.getByRole('dialog');
  const role = drawer.getByLabel('Role', { exact: true });

  await role.fill('');
  await drawer.getByRole('button', { name: 'Save role', exact: true }).click();
  await expect(drawer.getByText('Enter a role name first.', { exact: true })).toBeVisible();
  await expect(role).toHaveAttribute('aria-invalid', 'true');
  await expect(role).toBeFocused();
  expect(writes).toBe(0);
});
