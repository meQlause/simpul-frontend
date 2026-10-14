import type { ReactNode } from 'react';
import { Icon } from '../../../shared/ui/Icon';
import { InfoTip } from '../../../shared/ui/InfoTip';
import type { StepStatus } from '../channels.rules';
import { pollAgain } from '../channels.rules';
import type { Verification } from '../channels.schema';
import { channelsCopy as copy } from '../channels.copy';
import type { useCodeSession } from '../useCodeSession';
import { Checklist } from './Checklist';
import { ConnectionCode } from './ConnectionCode';

const BADGES = { done: 'green', now: 'blue', next: 'gray' } as const;

// One step of the setup. Only the Now step shows its body; only a Done step shows its result.
export function SetupStep({
  number,
  title,
  status,
  result,
  description,
  children,
}: {
  number: string;
  title: string;
  status: StepStatus;
  result?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="drawer-section setup-step" data-component="SetupStep" data-status={status}>
      <div className="drawer-section-heading">
        <span>{number}</span>
        <div>
          <h3 data-role="section-title">{title}</h3>
          {description && <InfoTip title={title} text={description} />}
          {status === 'done' && result && <p className="setup-step-result">{result}</p>}
        </div>
        <span className={'badge ' + BADGES[status]}>
          {status === 'done' && <Icon name="check-circle" />}
          {copy.stepStatus[status]}
        </span>
      </div>
      {status === 'now' && <div className="drawer-section-content">{children}</div>}
    </section>
  );
}

type Code = ReturnType<typeof useCodeSession>;

export function BotBody({
  botUsername,
  onManage,
  code,
}: {
  botUsername: string;
  onManage: () => void;
  code: Code;
}) {
  return (
    <>
      <div className="channel-bot-reference">
        <Icon name="link" />
        <div>
          <strong>@{botUsername}</strong>
          <small>Token stored separately · Never required for each group</small>
        </div>
        <button
          className="button"
          data-component="Button"
          data-variant="default"
          data-size="drawer"
          onClick={onManage}
        >
          Manage
        </button>
      </div>
      <div className="drawer-inline-note">
        <Icon name="help" />
        {copy.botNote}
      </div>
      <ConnectionCode
        session={code.session}
        issuing={code.issuing}
        onGenerate={() => void code.generate()}
      />
    </>
  );
}

export function CodeBody({ code }: { code: Code }) {
  return (
    <>
      <ConnectionCode
        session={code.session}
        issuing={code.issuing}
        onGenerate={() => void code.generate()}
      />
    </>
  );
}

export function MessageBody({
  verification,
  code,
}: {
  verification: Verification | null;
  code: Code;
}) {
  return (
    <>
      <p>{copy.checkHelp[5]}</p>
      {pollAgain(code.session) && <p className="setup-waiting">{copy.waitingMessage}</p>}
      <Checklist verification={verification} unpassedOnly />
    </>
  );
}

export function ConfirmBody({
  fresh,
  consent,
  onConsent,
}: {
  fresh: boolean;
  consent: boolean;
  onConsent: (value: boolean) => void;
}) {
  return (
    <>
      {fresh && <p className="setup-freshness">{copy.freshness}</p>}
      <div className="drawer-inline-note" data-component="InlineNote">
        <Icon name="clock" />
        {copy.historyNote}
      </div>
      <label className="channel-consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => onConsent(event.target.checked)}
        />
        <span>{copy.consent}</span>
      </label>
    </>
  );
}
