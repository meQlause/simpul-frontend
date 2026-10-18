import { expect, test } from 'vitest';
import {
  activationOffered,
  canRetry,
  channelName,
  dueCall,
  draftBody,
  pollAgain,
  pollDelay,
  setupFacts,
  setupSteps,
  shouldRecheck,
  staleNotice,
  type SetupFacts,
} from '../../../../src/features/channels/channels.rules';
import type {
  Channel,
  CodeSession,
  Verification,
} from '../../../../src/features/channels/channels.schema';

const sevenFacts = [
  'saved',
  'active',
  'codeIssued',
  'identified',
  'checked',
  'inbound',
  'ready',
] as const;

function facts(overrides: Partial<SetupFacts> = {}): SetupFacts {
  return {
    saved: false,
    active: false,
    codeIssued: false,
    identified: false,
    checked: false,
    inbound: false,
    ready: false,
    sessionIdentified: false,
    sessionId: null,
    received: false,
    ...overrides,
  };
}

const draft: Channel = {
  id: 'channel-1',
  displayName: 'Ops',
  providerChatId: '-100',
  providerChatTitle: 'Ops floor',
  providerChatType: 'supergroup',
  memberCount: 3,
  class: 'internal',
  primaryLanguage: 'auto',
  connectionStatus: 'draft',
  monitored: false,
  configVersion: 1,
  lastVerification: null,
  monitoringStartedAt: null,
};

function verification(inbound: 'pass' | 'pending', ready: boolean): Verification {
  return {
    id: 'verification-1',
    checkedAt: '2026-10-10T04:00:00.000Z',
    expiresAt: '2026-10-10T04:10:00.000Z',
    activationReady: ready,
    checks: [{ key: 'inbound', status: inbound, message: 'Test check', action: null }],
  };
}

function session(state: string, chatId?: string, receivedAt: string | null = null): CodeSession {
  return {
    id: 'session-1',
    expiresAt: '2026-10-10T04:16:00.000Z',
    state,
    command: '/simpul_connect 00000000000000000000000000000000',
    candidate: chatId
      ? { providerChatId: chatId, title: 'Ops floor', chatType: 'supergroup' }
      : null,
    receivedAt,
  };
}

test('AC18: every combination of the seven facts leaves exactly one Now, or four Done, and no Done after a Now', () => {
  for (let mask = 0; mask < 2 ** sevenFacts.length; mask += 1) {
    const overrides = Object.fromEntries(
      sevenFacts.map((key, bit) => [key, Boolean(mask & (1 << bit))]),
    ) as Partial<SetupFacts>;
    const steps = setupSteps(facts(overrides));
    const now = steps.indexOf('now');
    const exactlyOneNow = steps.filter((step) => step === 'now').length === 1;

    expect(exactlyOneNow || steps.every((step) => step === 'done')).toBe(true);

    if (now !== -1) {
      expect(steps.slice(now).includes('done')).toBe(false);
    }
  }
});

test('AC9, AC10, AC11, AC16, AC17: the named rows of the setup order, built from a channel, a session and a verification', () => {
  expect(setupSteps(setupFacts(undefined, null, null))).toEqual(['now', 'next', 'next', 'next']);
  expect(setupSteps(setupFacts(undefined, session('pending'), null))).toEqual([
    'done',
    'now',
    'next',
    'next',
  ]);
  expect(
    setupSteps(setupFacts(draft, session('identified', '-100'), verification('pending', false))),
  ).toEqual(['done', 'done', 'now', 'next']);
  expect(
    setupSteps(setupFacts(draft, session('identified', '-100'), verification('pass', true))),
  ).toEqual(['done', 'done', 'done', 'now']);
  expect(setupSteps(setupFacts(draft, null, verification('pending', false)))).toEqual([
    'done',
    'now',
    'next',
    'next',
  ]);
  expect(
    setupSteps(setupFacts(draft, session('identified', '-999'), verification('pending', false))),
  ).toEqual(['done', 'now', 'next', 'next']);
});

test('AC22: an active group shows four Done whatever the other facts', () => {
  const active: Channel = { ...draft, connectionStatus: 'active' };

  expect(setupSteps(setupFacts(active, null, null))).toEqual(['done', 'done', 'done', 'done']);
  expect(
    setupSteps(setupFacts(active, session('expired'), verification('pending', false))),
  ).toEqual(['done', 'done', 'done', 'done']);
});

test('AC20: the Telegram title wins, and a missing title falls back to the display name', () => {
  expect(channelName({ providerChatTitle: 'Ops floor', displayName: 'Ops' })).toBe('Ops floor');
  expect(channelName({ providerChatTitle: null, displayName: 'Ops' })).toBe('Ops');
});

test('AC10, AC11: dueCall saves once per session id, verifies once per proof, and is null while pending', () => {
  const identified = setupFacts(undefined, session('identified', '-100'), null);
  const proved = setupFacts(draft, session('identified', '-100', '2026-10-10T04:01:00.000Z'), null);
  const pending = setupFacts(draft, session('pending'), null);

  expect(dueCall(identified, { savedFor: '', provedFor: '', opened: true })).toBe('save');
  expect(dueCall(identified, { savedFor: 'session-1', provedFor: '', opened: true })).toBeNull();
  expect(dueCall(proved, { savedFor: 'session-1', provedFor: '', opened: true })).toBe('verify');
  expect(
    dueCall(proved, { savedFor: 'session-1', provedFor: 'session-1', opened: true }),
  ).toBeNull();
  expect(dueCall(pending, { savedFor: 'session-1', provedFor: '', opened: true })).toBeNull();
});

test('AC19, AC22: dueCall on open verifies a draft and a paused group, never an active one, and only once', () => {
  const none = { savedFor: '', provedFor: '', opened: false };
  const paused: Channel = { ...draft, connectionStatus: 'paused' };
  const active: Channel = { ...draft, connectionStatus: 'active' };

  expect(dueCall(setupFacts(draft, null, null), none)).toBe('verify');
  expect(dueCall(setupFacts(paused, null, null), none)).toBe('verify');
  expect(dueCall(setupFacts(active, null, null), none)).toBeNull();
  expect(dueCall(setupFacts(draft, null, null), { ...none, opened: true })).toBeNull();
});

test('AC12, AC13, AC14: canRetry is false for a duplicate, a chat type and an expired session; true for a timeout and a rate limit', () => {
  expect(canRetry('E-TG-CHANNEL-DUPLICATE')).toBe(false);
  expect(canRetry('E-TG-CHAT-TYPE-UNSUPPORTED')).toBe(false);
  expect(canRetry('E-TG-SESSION-EXPIRED')).toBe(false);
  expect(canRetry('E-TG-SETUP-TIMEOUT')).toBe(true);
  expect(canRetry('E-TG-RATE-LIMITED')).toBe(true);
});

test('AC24: draftBody cuts a 130-character title to 120 and never carries a session id', () => {
  const body = draftBody(
    { providerChatId: '-100', title: 'x'.repeat(130), chatType: 'supergroup' },
    { class: 'external', primaryLanguage: 'en' },
    'connection-1',
  );

  expect(body).toEqual({
    botConnectionId: 'connection-1',
    providerChatId: '-100',
    displayName: 'x'.repeat(120),
    class: 'external',
    primaryLanguage: 'en',
  });
  expect(Object.keys(body)).not.toContain('sessionId');
});

test('AC19, AC23: pollAgain stops at a received proof and at expiry; shouldRecheck fires only from fresh to stale; pollDelay doubles from 750 ms up to 10 000 ms', () => {
  expect(pollAgain(session('pending'))).toBe(true);
  expect(pollAgain(session('identified', '-100'))).toBe(true);
  expect(pollAgain(session('identified', '-100', '2026-10-10T04:01:00.000Z'))).toBe(false);
  expect(pollAgain(session('expired'))).toBe(false);
  expect(pollAgain(null)).toBe(false);

  expect(shouldRecheck(true, false)).toBe(true);
  expect(shouldRecheck(false, false)).toBe(false);
  expect(shouldRecheck(true, true)).toBe(false);

  expect(pollDelay(0)).toBe(750);
  expect(pollDelay(750)).toBe(1500);
  expect(pollDelay(6000)).toBe(10000);
  expect(pollDelay(10000)).toBe(10000);
});

test('an active group offers no activation and never says its old check expired', () => {
  expect(activationOffered('active')).toBe(false);
  expect(activationOffered('draft')).toBe(true);
  expect(activationOffered('paused')).toBe(true);
  expect(staleNotice({ status: 'active', ready: true, fresh: false })).toBe(false);
  expect(staleNotice({ status: 'paused', ready: true, fresh: false })).toBe(true);
  expect(staleNotice({ status: 'draft', ready: true, fresh: true })).toBe(false);
  expect(staleNotice({ status: 'draft', ready: false, fresh: false })).toBe(false);
});
