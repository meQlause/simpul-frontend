// Drives the mockup through a view's steps.
import type { Page } from '@playwright/test';
import type { Step } from './views.ts';

type StepKinds = {
  nav: Extract<Step, { nav: string }>;
  click: Extract<Step, { click: string }>;
  set: Extract<Step, { set: string }>;
  check: Extract<Step, { check: string }>;
  submit: Extract<Step, { submit: string }>;
  eval: Extract<Step, { eval: string }>;
  wait: Extract<Step, { wait: number }>;
  scroll: Extract<Step, { scroll: string }>;
};

async function navigate(page: Page, route: string) {
  await page.evaluate((target) => {
    (document.querySelector('#detail-dialog') as HTMLDialogElement | null)?.close();
    (document.querySelector(`[data-nav="${target}"]`) as HTMLElement).click();
  }, route);
}

async function clickElement(page: Page, selector: string) {
  const found = await page.evaluate((target) => {
    const element = document.querySelector(target) as HTMLElement | null;

    element?.click();

    return element !== null;
  }, selector);

  if (!found) {
    throw new Error(`no element for ${selector}`);
  }
}

async function setValue(page: Page, selector: string, value: string) {
  await page.evaluate(
    ({ target, text }) => {
      const input = document.querySelector(target) as HTMLInputElement;

      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    { target: selector, text: value },
  );
}

async function check(page: Page, selector: string) {
  await page.evaluate((target) => {
    const input = document.querySelector(target) as HTMLInputElement;

    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector);
}

async function submit(page: Page, selector: string) {
  await page.evaluate((target) => {
    (document.querySelector(target) as HTMLFormElement).requestSubmit();
  }, selector);
}

async function scroll(page: Page, selector: string) {
  await page.evaluate((target) => {
    document.querySelector(target)?.scrollIntoView({ block: 'center' });
  }, selector);
}

type Handlers = { [Key in keyof StepKinds]: (page: Page, step: StepKinds[Key]) => Promise<void> };

export async function run(page: Page, step: Step) {
  const handlers: Handlers = {
    nav: (target, { nav }) => navigate(target, nav),
    click: (target, { click: selector }) => clickElement(target, selector),
    set: (target, { set, value }) => setValue(target, set, value),
    check: (target, { check: selector }) => check(target, selector),
    submit: (target, { submit: selector }) => submit(target, selector),
    eval: (target, { eval: code }) => target.evaluate(code).then(() => undefined),
    wait: (target, { wait }) => target.waitForTimeout(wait),
    scroll: (target, { scroll: selector }) => scroll(target, selector),
  };
  const kind = Object.keys(step)[0] as keyof Handlers;

  await (handlers[kind] as (page: Page, step: Step) => Promise<void>)(page, step);
}
