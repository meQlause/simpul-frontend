// The +2px step (FD-26): the app draws every font size FONT_STEP_PX larger than the mockup. The
// comparison reads that step back off the app's signatures, so both sides land on the same scale.
// P1 keeps the step at 0 (no visible change); P7 sets it to 2.
export const FONT_STEP_PX = 0;

const round2 = (value: number) => Math.round(value * 100) / 100;
const round3 = (value: number) => Math.round(value * 1000) / 1000;
const shrink = (size: number, step: number) => `${round2(size - step)}px`;

// Text signature: family|size|weight|lineHeight|letterSpacing|transform|colour (style.spec.ts).
// The line height is a ratio of the unshifted size, so a 2px step keeps it comparable.
export function textKey(signature: string, step: number): string {
  const fields = signature.split('|');
  const size = parseFloat(fields[1]);

  if (size === 0) {
    return signature;
  }

  fields[1] = shrink(size, step);

  const line = parseFloat(fields[3]);

  if (!Number.isNaN(line)) {
    fields[3] = String(round3(line / size));
  }

  return fields.join('|');
}

// Box signature: padding ×4, radius, border width, font size (index 6), weight, background, colour.
export function boxKey(signature: string, step: number): string {
  const fields = signature.split('|');
  const size = parseFloat(fields[6]);

  if (size === 0) {
    return signature;
  }

  fields[6] = shrink(size, step);

  return fields.join('|');
}
