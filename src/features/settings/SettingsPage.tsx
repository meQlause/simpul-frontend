import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { useSettings } from './settings.api';

export function SettingsPage() {
  const query = useSettings();
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
