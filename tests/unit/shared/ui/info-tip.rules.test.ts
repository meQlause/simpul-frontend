import { expect, test } from 'vitest';
import { placeTip } from '../../../../src/shared/ui/info-tip.rules';

const screen = { left: 0, top: 0, right: 1440, bottom: 900 };
const tip = { width: 280, height: 40 };

test('the tip opens under its button, on the button’s left edge, when it fits to the right', () => {
  const anchor = { left: 100, top: 50, right: 120, bottom: 70 };

  expect(placeTip(anchor, tip, screen)).toEqual({ left: 100, top: 76 });
});

test('the tip is pulled inside a 375px viewport when its button sits near the right edge', () => {
  const anchor = { left: 340, top: 50, right: 360, bottom: 70 };
  const phone = { left: 0, top: 0, right: 375, bottom: 812 };

  expect(placeTip(anchor, tip, phone).left).toBe(87);
});

test('the tip never starts left of the dialog’s edge plus 8px', () => {
  const anchor = { left: 900, top: 50, right: 920, bottom: 70 };
  const dialog = { left: 900, top: 0, right: 1440, bottom: 900 };

  expect(placeTip(anchor, tip, dialog).left).toBe(908);
});

test('a tip wider than its bounds sits 8px inside the bounds’ left edge', () => {
  const anchor = { left: 50, top: 50, right: 70, bottom: 70 };
  const narrow = { left: 0, top: 0, right: 300, bottom: 900 };

  expect(placeTip(anchor, { width: 400, height: 40 }, narrow).left).toBe(8);
});
