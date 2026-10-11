export const previewCopy = {
  eyebrow: 'PRODUCT / RECIPIENT PREVIEW',
  title: 'A useful update, where people work',
  description:
    'What a person receives in Telegram and by email: a notification with its actions, a clarification question, an executive digest, a voice note. It previews; it sends nothing and changes no work item.',
  tablist: 'Recipient preview',
  tabs: {
    notification: 'Notification',
    clarification: 'Clarification',
    digest: 'Digest',
    voice: 'Voice note',
  },
  close: 'Close',
  closePreview: 'Close preview',
  empty: 'Nothing to preview',
  header: (recipient: string) => `Simpul · Sample to ${recipient}`,
  reminder: (count: number, hold: number) =>
    `Reminder ${count} · Owner contacted first · ${hold}-second hold completed`,
  facts: {
    operation: (opId: string) => `Operation: ${opId} · Corrections apply to this operation only`,
    escalation: 'Escalation: Owner → direct supervisor once → executive digest',
    source: 'Source: Recorded summary, never an ungrounded fact',
  },
  actions: {
    completed: 'Already shipped',
    active: 'In progress',
    stalled: 'There is a blocker',
    correct: 'Not this work',
    reset: 'Reset sample operation',
    silence: 'Preview 10-minute silence',
  },
  outcome: {
    completed: 'Recorded: Completed · Reminder threshold reset',
    active: 'Recorded: Active',
    stalled: 'Recorded: Stalled',
    corrected:
      'Correction recorded · Link removed · Prior state restored · Correction preview to the same recipient',
    silence: 'Closed silently after 10 minutes · No guessing, notification or new work.',
    none: 'No known match. The question is routed to the responsible role; no work item is created.',
    selected: (displayId: string) => `Selected ${displayId} · Latest recorded status used.`,
  },
  clarification: {
    question: 'Which order did you mean?',
    help: 'Choose one of the known candidates. A question never creates a new work item.',
    none: 'None of these',
    limits: (perWork: number, perChannel: number) =>
      `At most 3 candidates + “none”. ${perWork} question / work / day; ${perChannel} / group / day.`,
  },
  digest: {
    title: (recipient: string) => `Daily operations digest · ${recipient}`,
    summary: (count: number) => `${count} updates. One useful summary.`,
    scheduled: (time: string) =>
      `Scheduled ${time} WIB · Quiet hours and hourly limits combine non-critical updates. No email is sent.`,
  },
  voice: {
    title: 'Incoming voice note · Warehouse',
    transcript: 'Sample transcript',
    normalized: 'Text enters the same normalization path as ordinary messages.',
    unavailable: 'Transcription unavailable',
    noStatus: 'No work status is inferred from missing audio.',
  },
};
