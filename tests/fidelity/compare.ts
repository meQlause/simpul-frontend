// Pixel comparison, done by the browser's own PNG decoder so no image library is needed.
import type { Page } from '@playwright/test';

// User-approved visual difference floor (2026-10-18); structural and behavioral checks stay exact.
export const TOLERANCE = 0.25;

// Per-channel difference (0–255) below which two pixels count as equal.
const CHANNEL_NOISE = 12;

export type Region = { x: number; y: number; width: number; height: number };

type Cell = { x: number; y: number; pixels: number };

export type Comparison = { ratio: number; cells: Cell[] };

type Job = [string, string, number, Region[], number];

// Edge of the squares `cells` groups differences into, in pixels.
const CELL = 40;

// Runs in the page. Pixels inside an `ignore` region are skipped on both sides (a mask, §10).
// `cells` are the busiest 40px squares of difference, for reading a failure.
async function compareInPage([first, second, noise, ignore, size]: Job): Promise<Comparison> {
  const load = (source: string) =>
    new Promise<HTMLImageElement>((done) => {
      const image = new Image();

      image.onload = () => done(image);
      image.src = source;
    });
  const pixels = async (source: string) => {
    const image = await load(source);
    const canvas = document.createElement('canvas');

    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;

    context.drawImage(image, 0, 0);

    return context.getImageData(0, 0, image.width, image.height);
  };

  const [left, right] = await Promise.all([pixels(first), pixels(second)]);

  if (left.width !== right.width || left.height !== right.height) {
    return { ratio: 1, cells: [] };
  }

  const inside = (column: number, row: number) =>
    ignore.some(
      (region) =>
        column >= region.x &&
        column < region.x + region.width &&
        row >= region.y &&
        row < region.y + region.height,
    );
  const differs = (index: number) =>
    [0, 1, 2].some(
      // Backdrop blur is rasterised with ±1–2 level noise; that is not a visual difference.
      (channel) => Math.abs(left.data[index + channel] - right.data[index + channel]) > noise,
    );
  const cells = new Map<string, Cell>();
  let different = 0;
  let counted = 0;

  const visit = (index: number) => {
    const pixel = index / 4;
    const column = pixel % left.width;
    const row = Math.floor(pixel / left.width);

    if (inside(column, row)) {
      return;
    }

    counted += 1;

    if (!differs(index)) {
      return;
    }

    const key = `${Math.floor(column / size)}:${Math.floor(row / size)}`;
    const cell = cells.get(key) ?? {
      x: Math.floor(column / size) * size,
      y: Math.floor(row / size) * size,
      pixels: 0,
    };

    cell.pixels += 1;
    cells.set(key, cell);
    different += 1;
  };

  for (let index = 0; index < left.data.length; index += 4) {
    visit(index);
  }

  const busiest = [...cells.values()].sort((one, other) => other.pixels - one.pixels);

  return { ratio: counted === 0 ? 0 : different / counted, cells: busiest.slice(0, 12) };
}

const url = (image: Buffer) => `data:image/png;base64,${image.toString('base64')}`;

export async function compareImages(
  page: Page,
  expected: Buffer,
  actual: Buffer,
  ignore: Region[] = [],
): Promise<Comparison> {
  return page.evaluate(compareInPage, [
    url(expected),
    url(actual),
    CHANNEL_NOISE,
    ignore,
    CELL,
  ] as Job);
}

export async function diffRatio(
  page: Page,
  expected: Buffer,
  actual: Buffer,
  ignore: Region[] = [],
): Promise<number> {
  return (await compareImages(page, expected, actual, ignore)).ratio;
}
