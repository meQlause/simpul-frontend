import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { useRules } from './rules.api';

export function RulesPage() {
  const query = useRules();
  const state = useScreenState(query, query.data?.data.length === 0);
  return (
    <ScreenState
      state={state}
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
