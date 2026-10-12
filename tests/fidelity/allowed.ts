// docs/FE/fidelity.md §11 as data: the regions of a mockup render that a comparison skips on
// both sides, because the product differs there on purpose. Nothing else is ever masked.
const allowed = [
  { id: 'FD-02', region: 'demo-label', note: '"DEMO WORKSPACE" is removed' },
  { id: 'FD-02', region: 'heading-actions', note: 'the button sits where the label was' },
  { id: 'FD-02', region: 'sample-note', note: '"Sample data" is removed' },
  { id: 'FD-03', region: 'preview-states', note: 'prototype review controls are not built' },
  { id: 'FD-11', region: 'avatar-stack', note: 'real initials of the top recipients' },
  { id: 'FD-02', region: 'state-copy', note: 'sentences that say "sample" are rewritten' },
  { id: 'FD-02', region: 'state-action', note: '"Retry sample" is "Retry"' },
] as const;

export const maskedRegions: string[] = allowed.map((entry) => entry.region);
