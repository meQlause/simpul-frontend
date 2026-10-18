import { useSearchParams } from 'react-router';
import { DirectoryFooter } from '../../../shared/ui/Directory';
import { ScreenState } from '../../../shared/ui/ScreenState';
import { useOnline } from '../../../shared/useOnline';
import { useToggleRule } from '../rules.api';
import { rulesCopy as copy } from '../rules.copy';
import type { Rule } from '../rules.schema';
import { RuleHeading } from './RuleHeading';
import { RuleTable } from './RuleTable';
import { RuleToolbar } from './RuleToolbar';

export function RuleList({
  rules,
  onToast,
}: {
  rules: Rule[];
  onToast: (message: string) => void;
}) {
  const [params, setParams] = useSearchParams();
  const online = useOnline();
  const toggle = useToggleRule();
  const filter = params.get('state') ?? 'all';
  const search = params.get('q') ?? '';
  const active = rules.filter((rule) => rule.active).length;
  const visible = rules.filter(
    (rule) =>
      (filter === 'all' || (filter === 'active') === rule.active) &&
      `${rule.name} ${rule.conditionText} ${rule.category.name} ${rule.recipient.holderName ?? ''} ${rule.recipient.team}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);

    if (value && value !== 'all') {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    void setParams(next);
  }

  function flip(rule: Rule) {
    toggle.mutate(
      { id: rule.id, active: !rule.active },
      {
        onSuccess: () => onToast(rule.active ? copy.toggled.off : copy.toggled.on),
        onError: () => onToast(copy.saveFailed),
      },
    );
  }

  // No rules yet: the heading keeps "Create rule" reachable above the empty state.
  if (rules.length === 0) {
    return (
      <>
        <RuleHeading active={0} />
        <ScreenState state="empty" />
      </>
    );
  }

  return (
    <>
      <RuleHeading active={active} />
      <section className="panel directory-panel" data-component="Panel" data-variant="directory">
        <RuleToolbar
          filter={filter}
          search={search}
          counts={{ all: rules.length, active, paused: rules.length - active }}
          online={online}
          onFilter={(value) => setParam('state', value)}
          onSearch={(value) => setParam('q', value)}
        />
        <RuleTable rules={visible} disabled={!online || toggle.isPending} onToggle={flip} />
        <DirectoryFooter status={`Showing ${visible.length} of ${rules.length} rules`} />
      </section>
      <p className="directory-note">
        <svg className="icon" aria-hidden="true">
          <use href="#i-clock" />
        </svg>
        {copy.footnote}
      </p>
    </>
  );
}
