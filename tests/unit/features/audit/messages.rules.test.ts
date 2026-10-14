import { expect, test } from 'vitest';
import {
  choicesFor,
  matchedLines,
  outcomeLine,
  readLine,
  reasonSentence,
} from '../../../../src/features/audit/messages.rules';

const reasons: [string, string][] = [
  ['G1', 'A question or acknowledgement, not new work.'],
  ['query', 'A question or acknowledgement, not new work.'],
  ['G2', 'Describes a plan, not something that happened.'],
  ['G3', 'Does not say who or what it is about.'],
  ['G4', 'Does not say when the work would be done.'],
  ['G5', 'Looks like work that already exists.'],
  ['empty_evidence', 'Not clear enough to create work.'],
  ['low_genesis_confidence', 'Not clear enough to create work.'],
  ['model_invalid_json', 'The AI could not read this message. The operator has been alerted.'],
  ['question_expired', 'Nobody answered the question in the group.'],
  ['question_quota', "Unclear, and today's questions for this group are used up."],
  ['noise', 'Not about work.'],
];

const codes = [...reasons.map(([code]) => code), 'question_open', 'NOISE'];

const none = { work: null, correction: null };
const candidates = [
  { displayId: 'ORD-0091', summary: 'Toko Berkah, 12 pcs', score: '0.58' },
  { displayId: 'ORD-0095', summary: 'Toko Sari', score: '0.41' },
];
const matched = (decidedBy: string, extra = {}) => ({
  key: 'matched' as const,
  verdict: 'ATTACH',
  decidedBy,
  contextMessages: 0,
  candidates: [],
  ...extra,
});

test.each(reasons)('FR-UI-19: reason %s reads its sentence', (code, sentence) => {
  expect(reasonSentence(code)).toBe(sentence);
});

test('D5: no sentence and no line shows a reason code', () => {
  const lines = [
    outcomeLine({
      outcome: 'held',
      work: null,
      steps: [
        {
          key: 'outcome',
          status: 'held',
          reason: 'question_open',
          expiresAt: '2026-10-10T12:56:45Z',
        },
      ],
    } as never),
    ...reasons.map(([, sentence]) => sentence),
  ];

  for (const text of lines) {
    for (const code of codes) {
      expect(text).not.toContain(code);
    }
  }
});

test('AC27: a held outcome reads the WIB time its question expires', () => {
  const held = {
    outcome: 'held',
    work: null,
    steps: [
      {
        key: 'outcome',
        status: 'held',
        reason: 'question_open',
        expiresAt: '2026-10-10T12:56:45Z',
      },
    ],
  };

  expect(outcomeLine(held as never)).toBe('Waiting for an answer in the group until 19:56');
  expect(readLine({ key: 'read', triageClass: 'NOISE' })).toBe('Not about work');
});

test('AC27: score, reference, admin and question decisions read their line', () => {
  expect(
    matchedLines(matched('score') as never, { ...none, work: { displayId: 'ORD-0098' } }),
  ).toEqual(expect.arrayContaining(['Clear match with ORD-0098', 'Decided by score']));
  expect(
    matchedLines(matched('reference') as never, { ...none, work: { displayId: 'ORD-0098' } }),
  ).toEqual(expect.arrayContaining(['Explicit reference to ORD-0098', 'Decided by reference']));
  expect(matchedLines(matched('question') as never, none)).toContain('Asked the group');
  expect(
    matchedLines(matched('admin') as never, {
      work: null,
      correction: {
        workDisplayId: 'ORD-0098',
        action: 'attach',
        correctedBy: { name: 'Siti Aminah' },
        correctedAt: '2026-10-14T04:00:00Z',
      },
    }),
  ).toContain('Corrected by Siti Aminah');
});

test('AC27: model context with two messages lists both candidates', () => {
  const step = matched('model_context', { verdict: 'GREY', contextMessages: 2, candidates });

  expect(matchedLines(step as never, none)).toEqual([
    'Unclear: looks like ORD-0091, ORD-0095',
    'Decided by AI using 2 recent messages',
  ]);
  expect(matchedLines(matched('score', { verdict: 'CREATE' }) as never, none)).toContain(
    'Nothing similar — treated as new',
  );
});

test('AC30: the correction choices follow the outcome', () => {
  for (const outcome of ['rejected', 'held', 'ignored']) {
    expect(choicesFor(outcome as never)).toEqual(['create', 'attach']);
  }

  expect(choicesFor('attached')).toEqual(['move', 'create']);
  expect(choicesFor('created')).toEqual([]);
  expect(choicesFor('pending')).toEqual([]);
});
