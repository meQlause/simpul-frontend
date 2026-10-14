// The +2px step (FD-26) is undone on the app's signatures before they meet the mockup's baseline:
// textKey and boxKey move a signature onto the baseline's scale. No browser needed.
import { expect, test } from '@playwright/test';
import { boxKey, textKey } from './scale.ts';

const text = (size: string, line: string) => `DM Sans|${size}|400|${line}|0px|none|rgb(0, 0, 0)`;
const box = (size: string) => `0px|0px|0px|0px|0px|0px|${size}|400|rgb(1, 1, 1)|rgb(2, 2, 2)`;

test('textKey keeps the size at step 0 and turns the line height into a ratio', () => {
  expect(textKey(text('13px', '19.5px'), 0)).toBe(text('13px', '1.5'));
});

test('textKey maps a size 2px larger onto the key of the mockup size', () => {
  expect(textKey(text('15px', '22.5px'), 2)).toBe(textKey(text('13px', '19.5px'), 0));
});

test('textKey leaves a 0px size unchanged', () => {
  expect(textKey(text('0px', '15px'), 2)).toBe(text('0px', '15px'));
});

test('textKey rounds a fractional mockup size to two decimals', () => {
  expect(textKey(text('10.33333px', '15px'), 2).split('|')[1]).toBe('8.33px');
});

test('boxKey shifts the font size only, and leaves a 0px size unchanged', () => {
  expect(boxKey(box('13px'), 2)).toBe(box('11px'));
  expect(boxKey(box('0px'), 2)).toBe(box('0px'));
});
