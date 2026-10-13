// Computed-style parity: every text signature the app renders exists in the mockup's text
// roles, and every box that carries a component class matches that component's baseline.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { startBackend } from '../e2e/helpers/backend.ts';
import { open } from './app.ts';
import { appViews } from './pages.ts';

const baseline = resolve(import.meta.dirname, 'baseline');
const roles = JSON.parse(readFileSync(resolve(baseline, 'text-roles.json'), 'utf8')) as Record<
  string,
  number
>;
const components = JSON.parse(readFileSync(resolve(baseline, 'components.json'), 'utf8')) as Record<
  string,
  Record<string, Record<string, number>>
>;
const allowedBoxes = new Map(
  Object.entries(components).map(([name, variants]) => [
    name,
    new Set(Object.values(variants).flatMap((signatures) => Object.keys(signatures))),
  ]),
);

let backend: Awaited<ReturnType<typeof startBackend>>;

test.beforeAll(async () => {
  test.setTimeout(180000);
  backend = await startBackend();
});
test.afterAll(() => backend?.stop());

const only = process.env.FIDELITY_VIEW ?? '';

const views = [{ view: 'overview.ready', path: '/' } as (typeof appViews)[number], ...appViews];

for (const entry of views.filter((candidate) => candidate.view.startsWith(only))) {
  test(`${entry.view} uses only the mockup's text and component styles`, async ({ page }) => {
    await open(page, backend.baseUrl, {
      path: entry.path,
      width: 1440,
      anonymous: entry.anonymous,
      prepare: () => entry.prepare?.(page, backend.baseUrl) ?? Promise.resolve(),
    });
    await entry.steps?.(page);
    // A pointer left over a control would measure its hover colours.
    await page.mouse.move(0, 0);

    const found = await page.evaluate(() => {
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);

        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== 'hidden' &&
          style.display !== 'none'
        );
      };

      const own = (element: Element) =>
        [...element.childNodes].some(
          (node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()),
        );
      const text = (style: CSSStyleDeclaration) =>
        [
          style.fontFamily.split(',')[0].replace(/['"]/g, ''),
          style.fontSize,
          style.fontWeight,
          style.lineHeight,
          style.letterSpacing,
          style.textTransform,
          style.color,
        ].join('|');
      const box = (style: CSSStyleDeclaration) =>
        [
          style.paddingTop,
          style.paddingRight,
          style.paddingBottom,
          style.paddingLeft,
          style.borderTopLeftRadius,
          style.borderTopWidth,
          style.fontSize,
          style.fontWeight,
          style.backgroundColor,
          style.color,
        ].join('|');
      const roots = ['.sidebar', '.topbar', '#page-content', 'dialog[open]', '.toast']
        .flatMap((selector) => [...document.querySelectorAll(selector)])
        .filter(visible);
      // FD-23: the error toast is a component the mockup never drew; its behaviour spec owns it.
      const elements = roots
        .flatMap((root) => [...root.querySelectorAll('*')])
        .filter(visible)
        .filter((element) => !element.closest('[data-component="ErrorToast"]'));

      return {
        texts: elements.filter(own).map((element) => ({
          signature: text(getComputedStyle(element)),
          sample: element.textContent?.trim().slice(0, 30) ?? '',
        })),
        boxes: elements
          .filter((element) => element.classList.length > 0)
          .map((element) => ({
            classes: [...element.classList],
            signature: box(getComputedStyle(element)),
            sample: element.textContent?.trim().slice(0, 30) ?? '',
          })),
      };
    });
    const badTexts = [
      ...new Set(
        found.texts
          .filter((item) => !(item.signature in roles))
          .map((item) => `${item.signature}  «${item.sample}»`),
      ),
    ];
    const badBoxes = [
      ...new Set(
        found.boxes.flatMap((item) =>
          item.classes
            .filter((name) => allowedBoxes.has(name))
            .filter((name) => !allowedBoxes.get(name)?.has(item.signature))
            .map((name) => `${name}: ${item.signature}  «${item.sample}»`),
        ),
      ),
    ];

    console.log(`STYLE ${entry.view} texts=${badTexts.length} boxes=${badBoxes.length}`);
    badTexts.slice(0, 6).forEach((line) => console.log(`  T ${line}`));
    badBoxes.slice(0, 6).forEach((line) => console.log(`  B ${line}`));
    expect(badTexts.length + badBoxes.length).toBe(0);
  });
}
