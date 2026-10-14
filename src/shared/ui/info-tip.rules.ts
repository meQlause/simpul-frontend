export type Box = { left: number; top: number; right: number; bottom: number };

export type Size = { width: number; height: number };

// The gap between a button and its open tip, and the margin a tip keeps from its bounds.
const GAP = 6;
const EDGE = 8;

// The tip sits under its button and is pulled inside the box it belongs to (the dialog around it,
// or the viewport). A tip wider than its bounds pins to the bounds' left edge.
// ponytail: no flip above the button and no wrap; the sentences are short and the tip is 280px at most.
export function placeTip(anchor: Box, tip: Size, bounds: Box): { left: number; top: number } {
  const low = bounds.left + EDGE;
  const high = bounds.right - EDGE - tip.width;

  return { left: Math.max(low, Math.min(anchor.left, high)), top: anchor.bottom + GAP };
}
