import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '../../shared/api/error';
import { useCompleteOnboarding } from './onboarding.api';
import { onboardingCopy as copy } from './onboarding.copy';
import {
  backupsMissing,
  hasActiveGroup,
  type Channel,
  type PersonRow,
  type Rule,
} from './onboarding.rules';
import { LAST_STEP, STEP, stepOf } from './onboarding.steps';

export type Person = {
  id: string;
  name: string;
  role: { id: string; name: string } | null;
  backup: { id: string; name: string } | null;
};

export function useOnboardingWizard({
  people,
  channels,
  rules,
}: {
  people: Person[];
  channels: Channel[];
  rules: Rule[];
}) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const complete = useCompleteOnboarding();
  const [backups, setBackups] = useState<Record<string, string>>(() => initialBackups(people));
  const [active, setActive] = useState<string[]>(() =>
    rules.filter((rule) => rule.active).map((rule) => rule.id),
  );
  const [error, setError] = useState('');
  const step = stepOf(params.get('step'));
  const rows = rowsOf(people, backups);

  function goTo(target: number) {
    setError('');
    void setParams({ step: String(target) });
  }

  async function finish() {
    try {
      await complete.mutateAsync({
        backups: rows.map((row) => ({ roleId: row.roleId, personId: row.backupId })),
        activeRuleIds: active,
      });
      void navigate('/', { state: { toast: copy.finished } });
    } catch (cause) {
      const failure = failureOf(cause);

      if (failure.step) {
        void setParams({ step: String(failure.step) });
      }

      setError(failure.message);
    }
  }

  function next() {
    const gate = firstGate(rows, channels);

    if (gate && gate.step <= step) {
      void setParams({ step: String(gate.step) });
      setError(gate.message);

      return;
    }

    if (step === LAST_STEP) {
      void finish();
    } else {
      goTo(step + 1);
    }
  }

  return {
    step,
    rows,
    backups,
    active,
    error,
    saving: complete.isPending,
    goTo,
    next,
    setBackup: (roleId: string, personId: string) => setBackups({ ...backups, [roleId]: personId }),
    toggleRule: (id: string) =>
      setActive(active.includes(id) ? active.filter((ruleId) => ruleId !== id) : [...active, id]),
  };
}

// Each role starts with the backup the workspace already has, so a saved choice is kept.
function initialBackups(people: Person[]): Record<string, string> {
  return Object.fromEntries(
    people.flatMap((person) =>
      person.role ? [[person.role.id, person.backup?.id ?? ''] as const] : [],
    ),
  );
}

function rowsOf(people: Person[], backups: Record<string, string>): PersonRow[] {
  return people.flatMap((person) =>
    person.role
      ? [
          {
            roleId: person.role.id,
            personId: person.id,
            name: person.name,
            role: person.role.name,
            backupId: backups[person.role.id] ?? '',
          },
        ]
      : [],
  );
}

// The first step whose rule is broken, so a deep link cannot skip past it.
function firstGate(
  rows: PersonRow[],
  channels: Channel[],
): { message: string; step: number } | null {
  if (backupsMissing(rows)) {
    return { message: copy.backupMissing, step: STEP.people };
  }

  if (!hasActiveGroup(channels)) {
    return { message: copy.noActiveGroup, step: STEP.groups };
  }

  return null;
}

function failureOf(cause: unknown): { message: string; step?: number } {
  if (cause instanceof ApiError && cause.code === 'E-ONBOARDING-BACKUP-MISSING') {
    return { message: copy.backupMissing, step: STEP.people };
  }

  if (cause instanceof ApiError && cause.code === 'E-ONBOARDING-NO-ACTIVE-GROUP') {
    return { message: copy.noActiveGroup, step: STEP.groups };
  }

  return { message: copy.saveFailed };
}
