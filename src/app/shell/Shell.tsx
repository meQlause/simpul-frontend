import { Outlet } from 'react-router';
import { OfflineControls } from '../../shared/ui/OfflineControls';
import { TopBar } from './TopBar';

export function Shell() {
  return (
    <>
      <TopBar />
      <main id="page-content" tabIndex={-1}>
        <OfflineControls>
          <Outlet />
        </OfflineControls>
      </main>
    </>
  );
}
