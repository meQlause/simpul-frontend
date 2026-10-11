export const onboardingCopy = {
  eyebrow: 'WORKSPACE / ONBOARDING',
  description: 'A short setup for the conversations your team already uses.',
  steps: ['People & backups', 'Telegram groups', 'Default rules', 'First week'],
  title: (step: number, label: string) => `Step ${step} of 4 · ${label}`,
  close: 'Close',
  closeLabel: 'Close onboarding',
  back: 'Back',
  next: 'Continue',
  finish: 'Finish setup',
  progress: 'Onboarding progress',
  people: {
    title: 'A person for every responsibility',
    description:
      'These people are observed members or admin input, not a complete Telegram roster.',
    backup: 'Backup',
    choose: 'Choose a backup',
  },
  groups: {
    title: 'Know which conversations are monitored',
    description: 'Activation is separate from this wizard. Each group must pass its own checks.',
    history:
      'No earlier Telegram history is available in a new Bot API connection. Imported or stored history is processed silently.',
    ready: 'Ready',
    needsSetup: 'Needs setup',
    configure: 'Configure',
  },
  rules: {
    title: 'Start with useful defaults',
    description: 'Turn off what your team does not need. Estimates cover the last 30 days.',
    estimate: (count: number) => `${count} estimated notifications / week`,
  },
  first: {
    title: 'A deliberately quiet first week',
    description: 'Monitoring never means every update becomes a notification.',
    noticeTitle: 'Expect fewer notifications at first',
    noticeBody:
      'High confidence comes first. Ambiguity is clarified in the original group; corrections improve calibration.',
    people: (count: number) => `${count} responsibilities with backups`,
    groups: (count: number) => `${count} active groups`,
    history: 'Backfill never sends notifications',
    safeguards: (budget: number, start: string, end: string) =>
      `${budget} / person / hour · Quiet ${start}–${end} WIB`,
  },
  backupMissing: 'Choose a different backup for every person before continuing.',
  noActiveGroup: 'At least one group must pass checks and be explicitly activated in Channels.',
  saveFailed: 'Your changes were not saved. Try again.',
  finished: 'Onboarding complete. No notifications were sent.',
  loading: 'Loading onboarding',
};
