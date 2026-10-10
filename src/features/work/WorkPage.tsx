import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { useWork } from './work.api';

export function WorkPage() {
  const query = useWork();
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
