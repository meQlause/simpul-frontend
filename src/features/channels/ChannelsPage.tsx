import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { useChannels } from './channels.api';

export function ChannelsPage() {
  const query = useChannels();
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
