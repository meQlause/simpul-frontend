import type { ReactNode } from 'react';
import { useOnline } from '../useOnline';

export function OfflineControls({ children }: { children: ReactNode }) {
  const online = useOnline();

  return (
    <fieldset className="offline-controls" disabled={!online} data-component="OfflineControls">
      {children}
    </fieldset>
  );
}
