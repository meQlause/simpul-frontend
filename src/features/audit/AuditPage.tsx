import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { useAudit } from './audit.api';

export function AuditPage() {
  const query = useAudit();
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
