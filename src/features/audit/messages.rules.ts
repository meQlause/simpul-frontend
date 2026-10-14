import { messagesCopy as copy } from './audit.copy';
import type { MessageRow } from './audit.schema';

type Step = MessageRow['steps'][number];
type ReadStep = Extract<Step, { key: 'read' }>;
type MatchedStep = Extract<Step, { key: 'matched' }>;
type OutcomeStep = Extract<Step, { key: 'outcome' }>;

export type Choice = 'create' | 'attach' | 'move';

const CHOICES: Record<string, Choice[]> = {
  rejected: ['create', 'attach'],
  held: ['create', 'attach'],
  ignored: ['create', 'attach'],
  attached: ['move', 'create'],
};

const DECIDED_BY: Record<string, string> = {
  score: copy.matchedLines.byScore,
  reference: copy.matchedLines.byReference,
  question: copy.matchedLines.asked,
};

function lookup<Value>(table: Record<string, Value>, key: string, fallback: Value): Value {
  return Object.hasOwn(table, key) ? table[key] : fallback;
}

// The WIB clock of an instant, as the rows write it: "19:56".
export function clockOf(instant: string): string {
  return new Date(instant).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
}

export function reasonSentence(reason: string): string {
  return lookup<string>(copy.reasons, reason, '');
}

export function readLine(step: ReadStep): string {
  return lookup<string>(copy.readLines, step.triageClass, '');
}

// Two lines at most: what the match was, and who decided it. The work an attach named is the
// row's work item; a GREY unit lists its candidates.
export function matchedLines(step: MatchedStep, row: Pick<MessageRow, 'work' | 'correction'>) {
  const lines = [
    verdictLine(step, row.work?.displayId ?? ''),
    decidedLine(step, row.correction?.correctedBy.name ?? ''),
  ];

  return lines.filter((line) => line !== '');
}

function verdictLine(step: MatchedStep, workId: string): string {
  if (step.verdict === 'CREATE') {
    return copy.matchedLines.created;
  }

  if (step.verdict === 'GREY') {
    const ids = step.candidates.map((candidate) => candidate.displayId).join(', ');

    return `${copy.matchedLines.unclear} ${ids}`;
  }

  if (step.verdict === 'ATTACH') {
    const lead =
      step.decidedBy === 'reference' ? copy.matchedLines.reference : copy.matchedLines.clear;

    return `${lead} ${workId}`;
  }

  return '';
}

function decidedLine(step: MatchedStep, correctedBy: string): string {
  if (step.decidedBy === 'model_context') {
    return copy.matchedLines.byAi(step.contextMessages);
  }

  if (step.decidedBy === 'admin') {
    return copy.matchedLines.corrected(correctedBy);
  }

  return lookup<string>(DECIDED_BY, step.decidedBy, '');
}

// The Outcome step's line: the work it made or joined, the wait for a question, or the reason.
export function outcomeLine(row: MessageRow): string {
  if (row.outcome === 'held') {
    return heldLine(row);
  }

  if (row.outcome === 'created' || row.outcome === 'attached') {
    return workLine(row);
  }

  return row.outcome === 'pending' ? '' : reasonSentence(row.reason ?? '');
}

function workLine(row: MessageRow): string {
  const label = row.outcome === 'created' ? copy.outcomeLines.created : copy.outcomeLines.attached;

  return `${label} ${row.work?.displayId ?? ''}`;
}

function heldLine(row: MessageRow): string {
  const step = row.steps.find((candidate): candidate is OutcomeStep => candidate.key === 'outcome');

  return step?.expiresAt ? copy.outcomeLines.waiting(clockOf(step.expiresAt)) : '';
}

export function choicesFor(outcome: string): Choice[] {
  return lookup<Choice[]>(CHOICES, outcome, []);
}
