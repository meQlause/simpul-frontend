import { expect, test } from 'vitest';
import { barLevels, sparklinePath } from '../../../../src/features/overview/stat-charts.rules';

// T6 — AC5: values spread evenly across x 1–109 and scale to the largest value (y 33 bottom, 2 top).
test('FR-UI-22 (AC5): the sparkline spreads its values evenly and scales them to the largest', () => {
  expect(sparklinePath([0, 5, 10])).toBe('M1 33 55 17.5 109 2');
});

// T7 — AC5 edge: fewer than two values, or only zeros, draw a flat line.
test('FR-UI-22 (AC5 edge): an empty series, one value or only zeros draw a flat line', () => {
  expect(sparklinePath([])).toBe('M1 33 109 33');
  expect(sparklinePath([4])).toBe('M1 33 109 33');
  expect(sparklinePath([0, 0, 0])).toBe('M1 33 109 33');
});

// T8 — AC6: each bar is its share of the largest value; the shade follows the share.
test('FR-UI-22 (AC6): bars take their share of the largest value and a shade from it', () => {
  expect(barLevels([10, 8, 5, 4, 0])).toEqual([
    { height: 1, shade: 'dark' },
    { height: 0.8, shade: 'dark' },
    { height: 0.5, shade: 'mid' },
    { height: 0.4, shade: 'light' },
    { height: 0, shade: 'light' },
  ]);
  expect(barLevels([0, 0])).toEqual([
    { height: 0, shade: 'light' },
    { height: 0, shade: 'light' },
  ]);
});
