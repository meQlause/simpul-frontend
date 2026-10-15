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
  { id: 'FD-30', view: 'settings.ready', kind: 'tolerance' },
  { id: 'FD-24', view: 'database.unavailable', kind: 'tolerance' },
  { id: 'FD-24', view: 'settings.mail.saved', kind: 'tolerance' },
  { id: 'FD-29', view: 'channels.configure', kind: 'tolerance' },
  { id: 'FD-29', view: 'channels.add', kind: 'tolerance' },
  { id: 'FD-29', view: 'channels.verified', kind: 'tolerance' },
  { id: 'FD-29', view: 'channels.needs-action', kind: 'tolerance' },
  { id: 'FD-29', view: 'channels.expired', kind: 'tolerance' },
  { id: 'FD-28', view: 'overview.loading', kind: 'structural' },
  { id: 'FD-28', view: 'work.loading', kind: 'structural' },
  { id: 'FD-28', view: 'queue.loading', kind: 'structural' },
  { id: 'FD-28', view: 'rules.loading', kind: 'structural' },
  { id: 'FD-28', view: 'people.loading', kind: 'structural' },
  { id: 'FD-28', view: 'channels.loading', kind: 'structural' },
  { id: 'FD-28', view: 'audit.loading', kind: 'structural' },
  { id: 'FD-28', view: 'settings.loading', kind: 'structural' },
  { id: 'FD-28', view: 'drawer.loading', kind: 'structural' },
] as const;

export const usedIds = [...new Set([...allowed, ...exceptions].map((entry) => entry.id))];

// The per-view bars the +2px step needs (FD-26), keyed by view id or `shell.<route>`. P8 measures
// them; none may be above BAR_CAP.
export const BAR_CAP = 0.5;

export const fd26Bars: Record<string, number> = {
  'audit.ready': 0.17,
  'audit.trace': 0.18,
  'auth.set-password': 0.24,
  'auth.set-password-differs': 0.25,
  'auth.sign-in-failed': 0.23,
  'channels.connection': 0.14,
  'channels.empty': 0.16,
  'channels.offline': 0.15,
  'channels.pause': 0.23,
  'channels.ready': 0.15,
  'database.check-failed': 0.3,
  'database.unavailable': 0.19,
  'drawer.failed': 0.19,
  'drawer.saving': 0.14,
  'overview.empty': 0.14,
  'overview.error': 0.14,
  'overview.not-found': 0.16,
  'overview.offline': 0.14,
  'overview.ready': 0.26,
  'people.offline': 0.17,
  'people.ready': 0.16,
  'people.role': 0.14,
  'queue.mapping': 0.16,
  'queue.ready': 0.17,
  'queue.review': 0.19,
  'rules.create': 0.17,
  'rules.create-field-error': 0.26,
  'rules.edit': 0.17,
  'rules.ready': 0.14,
  'settings.database.connected': 0.15,
  'settings.database.update-refused': 0.21,
  'settings.mail.empty': 0.13,
  'settings.offline': 0.31,
  'settings.onboarding.1': 0.14,
  'settings.onboarding.2': 0.15,
  'settings.onboarding.3': 0.15,
  'settings.preview.notification': 0.31,
  'settings.ready': 0.24,
  'settings.vocabulary.aliases': 0.13,
  'settings.vocabulary.categories': 0.14,
  'settings.vocabulary.templates': 0.14,
  'shell.audit': 0.19,
  'shell.channels': 0.19,
  'shell.overview': 0.18,
  'shell.people': 0.19,
  'shell.queue': 0.19,
  'shell.rules': 0.19,
  'shell.settings': 0.19,
  'shell.work': 0.19,
  'work.close': 0.2,
  'work.detail': 0.14,
  'work.ready': 0.17,
};

export function barOf(view: string, base: number): number {
  return Math.max(base, fd26Bars[view] ?? 0);
}
