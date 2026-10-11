import { expect, test } from '@playwright/test';
import { connectBackend, startBackend } from './helpers/backend';

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
  await page.goto('/settings/vocabulary');
});

test('Vocabulary acceptance 1–3: six categories, required description, and a persisted new category', async ({
  page,
}) => {
  const drawer = page.getByRole('dialog');

  for (const name of ['Order', 'Finance', 'Stock', 'Returns', 'Quality', 'Product samples']) {
    await expect(drawer.getByRole('button', { name, exact: true })).toBeVisible();
  }

  await drawer.getByLabel('Category name', { exact: true }).fill('Procurement');
  await drawer.getByLabel('ID prefix', { exact: true }).fill('PRC');
  await drawer
    .getByLabel('Example message', { exact: true })
    .fill('Please order two cases from the supplier.');
  await drawer.getByRole('button', { name: 'Save category', exact: true }).click();
  await expect(drawer.getByRole('alert')).toHaveText(
    'Provide a category, description and example.',
  );
  await drawer.getByLabel('Description', { exact: true }).fill('Supplier purchase requests');
  await drawer.getByRole('button', { name: 'Save category', exact: true }).click();
  await expect(drawer.getByRole('button', { name: 'Procurement', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Procurement', exact: true })).toBeVisible();
});

test('Vocabulary acceptance 4: saved aliases link to the selected person', async ({ page }) => {
  await page.getByRole('tab', { name: 'Aliases', exact: true }).click();
  await page.getByLabel('Name or alias', { exact: true }).fill('Bu Rin');
  await page.getByLabel('Person', { exact: true }).selectOption({ label: 'Rina Anggraini' });
  await page.getByRole('button', { name: 'Save alias', exact: true }).click();
  await expect(page.getByTestId('alias-row').filter({ hasText: 'Bu Rin' })).toContainText(
    'Linked to Rina Anggraini',
  );
});

test('Vocabulary acceptance 5–7: live preview, forbidden fields, and fixed external template', async ({
  page,
}) => {
  await page.getByRole('tab', { name: 'Templates', exact: true }).click();
  const template = page.getByLabel('Template', { exact: true });

  await template.fill('{{work_id}} for {{customer}}');
  await expect(page.getByTestId('template-preview')).toHaveText('ORD-0091 for Mrs. Sri');
  await template.fill('{{cost}}');
  await page.getByRole('button', { name: 'Save template', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText(
    'Use only work_id, customer and summary template fields.',
  );
  await expect(page.getByTestId('external-template').locator('input, textarea')).toHaveCount(0);
});

test('The category form shows the ID prefix under Category name, read-only once the category has work', async ({
  page,
}) => {
  const drawer = page.getByRole('dialog');

  await drawer.getByRole('button', { name: 'Order', exact: true }).click();

  const name = drawer.getByLabel('Category name', { exact: true });
  const prefix = drawer.getByLabel('ID prefix', { exact: true });

  await expect(prefix).toHaveAttribute('readonly', '');
  const under = await name.evaluate(
    (node, other) => (node.compareDocumentPosition(other) & 4) !== 0,
    await prefix.elementHandle(),
  );

  expect(under).toBe(true);
});
