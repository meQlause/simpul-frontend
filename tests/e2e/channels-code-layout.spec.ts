import { expect, test, type Locator, type Page } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

// Step 2 of channel setup keeps its controls in one column (ticket ui-empty-layout, AC10).
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

for (const width of [1440, 375]) {
  test(`Channels AC10: the pending code controls stack in one column at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await connectBackend(page, backend.baseUrl);
    await page.goto('/channels');
    const command = await pendingCode(page);
    const code = page.locator('[data-component="ConnectionCode"]');

    await expectOneColumn(code);
    await expect(code.getByRole('button', { name: 'Generate code', exact: true })).toBeDisabled();
    await expect(page.getByLabel('Connection command', { exact: true })).toHaveAttribute(
      'readonly',
      '',
    );
    await code.getByRole('button', { name: 'Copy', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(command);
  });
}

async function pendingCode(page: Page) {
  await page.getByRole('button', { name: 'Add Telegram channel', exact: true }).click();
  await page.getByRole('button', { name: 'Generate code', exact: true }).click();
  const command = page.getByLabel('Connection command', { exact: true });

  await expect(command).toHaveValue(/\/simpul_connect /);

  return command.inputValue();
}

// Generate code, the command field, Copy and the waiting line, each below the one before;
// the field spans the column and nothing overflows it.
async function expectOneColumn(code: Locator) {
  const parts = [
    code.getByRole('button', { name: 'Generate code', exact: true }),
    code.locator('label.field'),
    code.getByRole('button', { name: 'Copy', exact: true }),
    code.locator('.setup-waiting'),
  ];

  await expect(parts[3]).toBeVisible();
  const boxes = await Promise.all(parts.map(async (part) => (await part.boundingBox())!));
  const area = (await code.boundingBox())!;

  for (let index = 1; index < boxes.length; index += 1) {
    expect(boxes[index].y).toBeGreaterThanOrEqual(boxes[index - 1].y + boxes[index - 1].height);
  }

  expect(boxes[1].width).toBeGreaterThanOrEqual(area.width - 1);
  expect(await code.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
}
