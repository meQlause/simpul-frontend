// docs/FE/fidelity.md §11 as data: the regions of a mockup render that a comparison skips on
// both sides, because the product differs there on purpose. Nothing else is ever masked.
const allowed = [
  { id: 'FD-02', region: 'demo-text', note: 'demo markers and sample sentences are rewritten' },
  { id: 'FD-02', region: 'heading-actions', note: 'the button sits where the label was' },
  { id: 'FD-03', region: 'preview-states', note: 'prototype review controls are not built' },
  { id: 'FD-11', region: 'avatar-stack', note: 'real initials of the top recipients' },
  { id: 'FD-02', region: 'state-copy', note: 'sentences that say "sample" are rewritten' },
  { id: 'FD-02', region: 'state-action', note: '"Retry sample" is "Retry"' },
] as const;

// A region name matches an allowed entry exactly or by prefix (`demo-text-3` is `demo-text`).
export function isMasked(name: string): boolean {
  return allowed.some((entry) => name === entry.region || name.startsWith(`${entry.region}-`));
}

// Views compared with a wider bar or with a region skipped, each by an approved §11 row.
export const exceptions = [
  { id: 'FD-14', view: 'rules.create-field-error', kind: 'region' },
  { id: 'FD-15', view: 'settings.preview.notification', kind: 'tolerance' },
  { id: 'FD-15', view: 'settings.preview.clarification', kind: 'tolerance' },
  { id: 'FD-15', view: 'settings.preview.digest', kind: 'tolerance' },
  { id: 'FD-15', view: 'settings.preview.voice-note', kind: 'tolerance' },
  { id: 'FD-16', view: 'settings.offline', kind: 'tolerance' },
  { id: 'FD-17', view: 'database.check-failed', kind: 'tolerance' },
  { id: 'FD-19', view: 'auth.sign-in', kind: 'tolerance' },
  { id: 'FD-19', view: 'auth.sign-in-failed', kind: 'tolerance' },
  { id: 'FD-19', view: 'auth.set-password', kind: 'tolerance' },
  { id: 'FD-19', view: 'auth.set-password-differs', kind: 'tolerance' },
  { id: 'FD-19', view: 'auth.no-access', kind: 'tolerance' },
  { id: 'FD-19', view: 'database.setup', kind: 'tolerance' },
  { id: 'FD-19', view: 'database.notice-not-accepted', kind: 'tolerance' },
  { id: 'FD-19', view: 'database.check-failed', kind: 'tolerance' },
  { id: 'FD-19', view: 'database.connecting', kind: 'tolerance' },
  { id: 'FD-20', view: 'settings.onboarding.4', kind: 'tolerance' },
  { id: 'FD-24', view: 'database.unavailable', kind: 'tolerance' },
  { id: 'FD-24', view: 'settings.mail.saved', kind: 'tolerance' },
] as const;

export const usedIds = [...new Set([...allowed, ...exceptions].map((entry) => entry.id))];
