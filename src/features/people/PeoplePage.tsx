import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { usePeople } from './people.api';

export function PeoplePage() {
  const query = usePeople();
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
