import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { useOverview } from './overview.api';

export function OverviewPage() {
  const query = useOverview();
  const state = useScreenState(query, false);
  return (
    <ScreenState
      state={state}
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
