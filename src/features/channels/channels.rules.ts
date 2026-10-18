import type { Channel, CodeSession, Verification } from './channels.schema';

export type StepStatus = 'done' | 'now' | 'next';

// Seven facts describe the steps. The last three drive the automatic calls: the session's
// identity, its id, and whether its proof has arrived.
export type SetupFacts = {
  saved: boolean;
  active: boolean;
  codeIssued: boolean;
  identified: boolean;
  checked: boolean;
  inbound: boolean;
  ready: boolean;
  sessionIdentified: boolean;
  sessionId: string | null;
  received: boolean;
};

type Candidate = NonNullable<CodeSession['candidate']>;

const FIRST_POLL_MS = 750;
const MAX_POLL_MS = 10_000;
const DISPLAY_NAME_MAX = 120;
const NO_RETRY = new Set([
  'E-TG-CHANNEL-DUPLICATE',
  'E-TG-CHAT-TYPE-UNSUPPORTED',
  'E-TG-SESSION-EXPIRED',
]);

export function channelName(channel: { providerChatTitle: string | null; displayName: string }) {
  return channel.providerChatTitle ?? channel.displayName;
}

function identifiedIn(channel: Channel | undefined, session: CodeSession | null) {
  const chat = session?.candidate?.providerChatId;

  return chat !== undefined && chat === channel?.providerChatId && session?.state === 'identified';
}

function sessionFacts(session: CodeSession | null) {
  return {
    codeIssued: session !== null,
    sessionIdentified: session?.state === 'identified',
    sessionId: session?.id ?? null,
    received: Boolean(session?.receivedAt),
  };
}

function proofFacts(verification: Verification | null) {
  return {
    checked: verification !== null,
    inbound:
      verification?.checks.some((check) => check.key === 'inbound' && check.status === 'pass') ??
      false,
    ready: verification?.activationReady ?? false,
  };
}

export function setupFacts(
  channel: Channel | undefined,
  session: CodeSession | null,
  verification: Verification | null,
): SetupFacts {
  return {
    saved: channel !== undefined,
    active: channel?.connectionStatus === 'active',
    identified: identifiedIn(channel, session),
    ...sessionFacts(session),
    ...proofFacts(verification),
  };
}

function statusOf(done: boolean, index: number, now: number): StepStatus {
  if (done) {
    return 'done';
  }

  return index === now ? 'now' : 'next';
}

// Step 2 needs a saved draft that was checked and has a proof, by the message or by the candidate.
export function setupSteps(facts: SetupFacts): StepStatus[] {
  if (facts.active) {
    return ['done', 'done', 'done', 'done'];
  }

  const reached = facts.saved && facts.checked && (facts.inbound || facts.identified);
  const flags = [facts.codeIssued || facts.saved, reached, reached && facts.ready, false];
  const now = flags.indexOf(false);

  return flags.map((flag, index) => statusOf(flag, index, now));
}

function openDue(facts: SetupFacts, opened: boolean) {
  return !opened && facts.saved && !facts.active;
}

// Each call is due once per session id, or once per open of a group that is not active (D15).
export function dueCall(
  facts: SetupFacts,
  done: { savedFor: string; provedFor: string; opened: boolean },
): 'save' | 'verify' | null {
  if (facts.sessionIdentified && !facts.saved && done.savedFor !== facts.sessionId) {
    return 'save';
  }

  if (facts.received && done.provedFor !== facts.sessionId) {
    return 'verify';
  }

  return openDue(facts, done.opened) ? 'verify' : null;
}

export function canRetry(code: string) {
  return !NO_RETRY.has(code);
}

export function pollAgain(session: CodeSession | null) {
  return (
    session !== null &&
    (session.state === 'pending' || session.state === 'identified') &&
    !session.receivedAt
  );
}

export function pollDelay(previous: number) {
  return Math.min(Math.max(previous * 2, FIRST_POLL_MS), MAX_POLL_MS);
}

// An active group is already monitored: there is nothing to activate.
export function activationOffered(status: string | undefined) {
  return status !== 'active';
}

// "The check expired" is news only while activation is still offered.
export function staleNotice(facts: { status: string | undefined; ready: boolean; fresh: boolean }) {
  return activationOffered(facts.status) && facts.ready && !facts.fresh;
}

export function shouldRecheck(wasFresh: boolean, fresh: boolean) {
  return wasFresh && !fresh;
}

export function draftBody(
  candidate: Candidate,
  input: { class: Channel['class']; primaryLanguage: Channel['primaryLanguage'] },
  connectionId: string,
) {
  return {
    botConnectionId: connectionId,
    providerChatId: candidate.providerChatId,
    displayName: candidate.title.slice(0, DISPLAY_NAME_MAX),
    class: input.class,
    primaryLanguage: input.primaryLanguage,
  };
}
