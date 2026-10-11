// Pixel comparison, done by the browser's own PNG decoder so no image library is needed.
import type { Page } from '@playwright/test';

export const TOLERANCE = 0.001;

// Per-channel difference (0–255) below which two pixels count as equal.
const CHANNEL_NOISE = 12;

// Runs in the page.
async function compareInPage([first, second, noise]: [string, string, number]): Promise<number> {
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

  const left = await pixels(first);
  const right = await pixels(second);

  if (left.width !== right.width || left.height !== right.height) {
    return 1;
  }

  let different = 0;

  for (let index = 0; index < left.data.length; index += 4) {
    // Backdrop blur is rasterised with ±1–2 level noise; that is not a visual difference.
    const same =
      Math.abs(left.data[index] - right.data[index]) <= noise &&
      Math.abs(left.data[index + 1] - right.data[index + 1]) <= noise &&
      Math.abs(left.data[index + 2] - right.data[index + 2]) <= noise;

    different += same ? 0 : 1;
  }

  return different / (left.width * left.height);
}

const url = (image: Buffer) => `data:image/png;base64,${image.toString('base64')}`;

export async function diffRatio(page: Page, expected: Buffer, actual: Buffer): Promise<number> {
  return page.evaluate(compareInPage, [url(expected), url(actual), CHANNEL_NOISE] as [
    string,
    string,
    number,
  ]);
}
