import { expect, test, type Page } from '@playwright/test';
import { connectBackend, startBackend } from '../helpers/backend';

let backend: Awaited<ReturnType<typeof startBackend>> | undefined;

test.beforeEach(async ({ page }) => {
  test.setTimeout(120000);
  backend = await startBackend();
  await connectBackend(page, backend.baseUrl);
  await page.goto('/channels');
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
  backend?.stop();
});

test('B-16: a group is saved as a draft and listed without being monitored', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Telegram channel' }).click();
  await page.getByRole('button', { name: 'Generate code', exact: true }).click();
  const command = page.getByLabel('Connection command', { exact: true });

  await expect(command).toHaveValue(/\/simpul_connect /);
  await sendGroupMessage(page, '-1009100000001', 'Flow draft', await command.inputValue());
  await expect(page.getByRole('row').filter({ hasText: 'Flow draft' })).toContainText('Draft');
});

// One message from a group, as the webhook receives it.
async function sendGroupMessage(page: Page, chatId: string, title: string, text: string) {
  const base = backend?.baseUrl;

  if (!base) {
    throw new Error('The backend is not running');
  }

  const connection = (await (await page.request.get(base + '/api/v1/telegram/connections')).json())
    .data[0];
  const receipt = await page.request.post(base + '/api/v1/webhooks/telegram/' + connection.id, {
    headers: { 'X-Telegram-Bot-Api-Secret-Token': Buffer.alloc(32, 8).toString('base64url') },
    data: {
      update_id: Date.now(),
      message: {
        message_id: Date.now(),
        date: Math.floor(Date.now() / 1000),
        from: { id: 1, is_bot: false, first_name: 'Tester' },
        chat: { id: Number(chatId), type: 'supergroup', title },
        text,
      },
    },
  });

  expect(receipt.ok()).toBe(true);
}

test('B-20: a group is paused after its confirmation and the others keep running', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Pause Warehouse & Shipping', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Pause Warehouse & Shipping?' })
    .getByRole('button', { name: 'Pause group', exact: true })
    .click();
  await expect(page.getByRole('row').filter({ hasText: 'Warehouse & Shipping' })).toContainText(
    'Paused',
  );
  await expect(page.getByRole('row').filter({ hasText: 'Operations' })).toContainText('Active');
});
