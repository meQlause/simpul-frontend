import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '../../shared/ui/Icon';
import { Drawer } from '../../shared/ui/Drawer';
import { ScreenState } from '../../shared/ui/ScreenState';
import { useOnline } from '../../shared/useOnline';
import { usePeople } from '../people';
import { useChannels } from '../channels';
import { useRules } from '../rules';
import { useSettingsQuery } from '../settings';
import { onboardingCopy as copy } from './onboarding.copy';
import { isReady, type Channel, type Rule } from './onboarding.rules';
import { LAST_STEP, STEP } from './onboarding.steps';
import { useOnboardingWizard, type Person } from './onboarding.wizard';
import { FirstWeekStep, GroupsStep, PeopleStep, RulesStep } from './OnboardingSteps';

type Settings = { budgetPerHour: number; quietStart: string; quietEnd: string };
type Wizard = ReturnType<typeof useOnboardingWizard>;

export function OnboardingDrawer() {
  const people = usePeople();
  const channels = useChannels();
  const rules = useRules();
  const settings = useSettingsQuery();
  const navigate = useNavigate();
  const queries = [people, channels, rules, settings];
  const close = () => {
    void navigate('/settings');
  };

  if (!queries.every((query) => query.isSuccess)) {
    return <OnboardingLoading queries={queries} onClose={close} />;
  }

  return (
    <Loaded people={people} channels={channels} rules={rules} settings={settings} onClose={close} />
  );
}

function Loaded({
  people,
  channels,
  rules,
  settings,
  onClose,
}: {
  people: ReturnType<typeof usePeople>;
  channels: ReturnType<typeof useChannels>;
  rules: ReturnType<typeof useRules>;
  settings: ReturnType<typeof useSettingsQuery>;
  onClose: () => void;
}) {
  return (
    <Wizard
      people={people.data?.data ?? []}
      channels={channels.data?.data ?? []}
      rules={rules.data?.data ?? []}
      settings={settings.data?.data as Settings}
      onClose={onClose}
    />
  );
}

function OnboardingLoading({
  queries,
  onClose,
}: {
  queries: { isError: boolean; refetch: () => unknown }[];
  onClose: () => void;
}) {
  const failed = queries.some((query) => query.isError);

  return (
    <Shell
      step={STEP.people}
      onClose={onClose}
      footer={
        <button type="button" className="button" onClick={onClose}>
          {copy.close}
        </button>
      }
    >
      <ScreenState
        state={failed ? 'error' : 'loading'}
        onRetry={() => {
          queries.forEach((query) => {
            void query.refetch();
          });
        }}
      />
    </Shell>
  );
}

function Wizard({
  people,
  channels,
  rules,
  settings,
  onClose,
}: {
  people: Person[];
  channels: Channel[];
  rules: Rule[];
  settings: Settings;
  onClose: () => void;
}) {
  const online = useOnline();
  const wizard = useOnboardingWizard({ people, channels, rules });
  const { step } = wizard;

  return (
    <Shell
      step={step}
      onClose={onClose}
      footer={
        <WizardFooter
          step={step}
          disabled={!online || wizard.saving}
          onBack={() => wizard.goTo(step - 1)}
          onClose={onClose}
          onNext={wizard.next}
        />
      }
    >
      <OnboardingProgress step={step} />
      <StepBody wizard={wizard} channels={channels} rules={rules} settings={settings} />
      <p id="onboarding-error" role="alert" className="channel-error">
        {wizard.error}
      </p>
    </Shell>
  );
}

function StepBody({
  wizard,
  channels,
  rules,
  settings,
}: {
  wizard: Wizard;
  channels: Channel[];
  rules: Rule[];
  settings: Settings;
}) {
  if (wizard.step === STEP.people) {
    return <PeopleStep rows={wizard.rows} backups={wizard.backups} onBackup={wizard.setBackup} />;
  }

  if (wizard.step === STEP.groups) {
    return <GroupsStep channels={channels} />;
  }

  if (wizard.step === STEP.rules) {
    return <RulesStep rules={rules} active={wizard.active} onToggle={wizard.toggleRule} />;
  }

  return (
    <FirstWeekStep
      people={wizard.rows.length}
      groups={channels.filter(isReady).length}
      budget={settings.budgetPerHour}
      quietStart={settings.quietStart}
      quietEnd={settings.quietEnd}
    />
  );
}

function WizardFooter({
  step,
  disabled,
  onBack,
  onClose,
  onNext,
}: {
  step: number;
  disabled: boolean;
  onBack: () => void;
  onClose: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <button type="button" className="button" onClick={step === STEP.people ? onClose : onBack}>
        {step === STEP.people ? copy.close : copy.back}
      </button>
      <button type="button" className="button button-primary" disabled={disabled} onClick={onNext}>
        {step === LAST_STEP ? copy.finish : copy.next}
        {step !== LAST_STEP && <Icon name="arrow-right" />}
      </button>
    </>
  );
}

function OnboardingProgress({ step }: { step: number }) {
  return (
    <ol className="onboarding-progress" aria-label={copy.progress}>
      {copy.steps.map((label, index) => {
        const number = index + STEP.people;

        return (
          <li
            key={label}
            className={stateOf(number, step)}
            aria-current={number === step ? 'step' : undefined}
          >
            <span>
              {number < step ? (
                <svg className="icon" aria-hidden="true">
                  <use href="#i-check" />
                </svg>
              ) : (
                number
              )}
            </span>
            <small>{label}</small>
          </li>
        );
      })}
    </ol>
  );
}

function stateOf(number: number, step: number): string {
  if (number === step) {
    return 'current';
  }

  return number < step ? 'done' : '';
}

function Shell({
  step,
  onClose,
  footer,
  children,
}: {
  step: number;
  onClose: () => void;
  footer: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Drawer
      title={copy.title(step, copy.steps[step - STEP.people] ?? '')}
      eyebrow={copy.eyebrow}
      description={copy.description}
      closeLabel={copy.closeLabel}
      onClose={onClose}
      footer={footer}
    >
      {children}
    </Drawer>
  );
}
