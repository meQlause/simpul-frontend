export type Shade = 'dark' | 'mid' | 'light';

// The sparkline box in its viewBox: values run from x 1 to 109, y 33 (bottom) to 2 (top).
const left = 1;
const right = 109;
const top = 2;
const bottom = 33;
const flat = `M${left} ${bottom} ${right} ${bottom}`;
const minimumPoints = 2;
const darkFrom = 0.8;
const midFrom = 0.5;

// One point per value, evenly spread, scaled to the largest; flat when there is nothing to scale.
export function sparklinePath(values: number[]) {
  const peak = Math.max(...values);

  if (values.length < minimumPoints || peak === 0) {
    return flat;
  }

  const step = (right - left) / (values.length - 1);
  const points = values.map(
    (value, index) => `${left + index * step} ${bottom - (value / peak) * (bottom - top)}`,
  );

  return `M${points.join(' ')}`;
}

function shadeOf(height: number): Shade {
  if (height >= darkFrom) {
    return 'dark';
  }

  return height >= midFrom ? 'mid' : 'light';
}

// Each bar is its share of the largest value; a flat set of zeros has no bars to raise.
export function barLevels(values: number[]) {
  const peak = Math.max(0, ...values);

  return values.map((value) => {
    const height = peak === 0 ? 0 : value / peak;

    return { height, shade: shadeOf(height) };
  });
}
