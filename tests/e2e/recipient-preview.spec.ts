import { expect, test, type Page } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

function tab(page: Page, label: string) {
  return page.getByRole('tab', { name: label, exact: true });
}

test.describe('reading the recipient preview', () => {
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

  test('Recipient preview acceptance 1: opens on Notification, addressed to Budi', async ({
    page,
  }) => {
    await page.goto('/settings/recipient-preview');

    await expect(tab(page, 'Notification')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Simpul · Sample to Budi Santoso', { exact: true })).toBeVisible();
  });

  test('Recipient preview acceptance 2: reopening starts on Notification again', async ({
    page,
  }) => {
    await page.goto('/settings/recipient-preview?tab=voice');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Close preview', exact: true })
      .click();
    await page.getByRole('link', { name: 'Open preview', exact: true }).click();

    await expect(tab(page, 'Notification')).toHaveAttribute('aria-selected', 'true');
    await expect(
      page.getByRole('button', { name: 'Reset sample operation', exact: true }),
    ).toBeVisible();
  });

  test('Recipient preview acceptance 3: Already shipped records Completed and leaves the work as it was', async ({
    page,
  }) => {
    await page.goto('/settings/recipient-preview');

    const drawer = page.getByRole('dialog');

    await drawer.getByRole('button', { name: 'Already shipped', exact: true }).click();

    await expect(drawer.getByRole('status')).toContainText('Completed');

    await page.goto('/work/ORD-0091');

    await expect(page.getByText('Stalled').filter({ visible: true }).first()).toBeVisible();
  });

  test('Recipient preview acceptance 4: Not this work restores the prior state and disables the statuses', async ({
    page,
  }) => {
    await page.goto('/settings/recipient-preview');

    const drawer = page.getByRole('dialog');

    await drawer.getByRole('button', { name: 'Already shipped', exact: true }).click();
    await drawer.getByRole('button', { name: 'Not this work', exact: true }).click();

    await expect(drawer.getByRole('status')).toContainText('Prior state restored');

    for (const label of ['Already shipped', 'In progress', 'There is a blocker']) {
      await expect(drawer.getByRole('button', { name: label, exact: true })).toBeDisabled();
    }
  });

  test('Recipient preview acceptance 5: Clarification offers three candidates and a silent close', async ({
    page,
  }) => {
    await page.goto('/settings/recipient-preview?tab=clarification');

    const drawer = page.getByRole('dialog');
    const options = drawer.locator('.clarification-options button');

    await expect(options).toHaveCount(4);
    await expect(options.last()).toHaveText('None of these');

    await drawer.getByRole('button', { name: 'Preview 10-minute silence', exact: true }).click();

    await expect(drawer.getByRole('status')).toContainText('Closed silently');
  });

  test('Recipient preview acceptance 6: the digest names Mr. Hendra and lists four updates', async ({
    page,
  }) => {
    await page.goto('/settings/recipient-preview?tab=digest');

    const drawer = page.getByRole('dialog');

    await expect(
      drawer.getByText('Daily operations digest · Mr. Hendra', { exact: true }),
    ).toBeVisible();
    await expect(drawer.locator('.email-preview li')).toHaveCount(4);
  });

  test('Recipient preview acceptance 7: the voice note says transcription is unavailable', async ({
    page,
  }) => {
    await page.goto('/settings/recipient-preview?tab=voice');

    await expect(
      page.getByRole('dialog').getByText('Transcription unavailable', { exact: true }),
    ).toBeVisible();
  });
});

test.describe('changing who is on leave', () => {
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

  test('Recipient preview acceptance 8: with Budi on leave, the preview is addressed to the backup', async ({
    page,
  }) => {
    await page.goto('/people');

    const budi = page.getByRole('row').filter({ hasText: 'Budi Santoso' });

    await budi.getByRole('button', { name: 'Edit role' }).click();

    const drawer = page.getByRole('dialog');

    await drawer.getByRole('combobox', { name: 'Availability', exact: true }).selectOption('leave');
    await drawer
      .getByLabel('Backup person', { exact: true })
      .selectOption({ label: 'Siti Aminah' });
    await drawer.getByRole('button', { name: 'Save role', exact: true }).click();

    await expect(page.locator('.toast')).toHaveText('Role and backup saved.');

    await page.goto('/settings/recipient-preview');

    await expect(
      page.getByText('Simpul · Sample to Siti Aminah · Backup for Budi', { exact: true }),
    ).toBeVisible();
  });
});
