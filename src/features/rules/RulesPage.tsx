import { useEffect, useState } from 'react';
import { useMatch, useNavigate, useParams, useSearchParams } from 'react-router';
import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { useRules } from './rules.api';
import { rulesCopy as copy } from './rules.copy';
import { RuleDrawer } from './components/RuleDrawer';
import { RuleList } from './components/RuleList';

const toastDuration = 4800;

export function RulesPage() {
  const query = useRules();
  const state = useScreenState(query, query.data?.data.length === 0);
  const { ruleId } = useParams();
  const creating = useMatch('/rules/new') !== null;
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [toast, setToast] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setToast(''), toastDuration);

    return () => clearTimeout(timer);
  }, [toast]);

  // An empty list still renders the heading, so "Create rule" stays reachable.
  if (!query.data || !['ready', 'empty'].includes(state)) {
    return (
      <ScreenState
        state={state}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  }

  const rules = query.data.data;
  const editing = ruleId !== undefined;
  const close = () => {
    void navigate('/rules');
  };

  return (
    <section data-component="RulesPage" data-variant="default">
      <RuleList rules={rules} onToast={setToast} />
      {(creating || editing) && (
        <RuleDrawer
          key={ruleId ?? 'new'}
          rule={rules.find((candidate) => candidate.id === ruleId)}
          editing={editing}
          reviewItemId={params.get('reviewItemId')}
          onClose={close}
          onSaved={() => {
            setToast(copy.saved);
            close();
          }}
        />
      )}
      {toast && (
        <p role="status" className="toast visible">
          {toast}
        </p>
      )}
    </section>
  );
}
