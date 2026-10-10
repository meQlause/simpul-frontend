import { Outlet } from 'react-router';
import { OfflineControls } from '../../shared/ui/OfflineControls';
import { TopBar } from './TopBar';
import { shellCopy } from './shell.copy';

export function Shell() {
  return (
    <>
      <a className="skip-link" href="#page-content">
        {shellCopy.skip}
      </a>
      <TopBar />
      <main id="page-content" tabIndex={-1}>
        <OfflineControls>
          <Outlet />
        </OfflineControls>
      </main>
    </>
  );
}
