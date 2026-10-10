import { OfflineControls } from '../../shared/ui/OfflineControls';
import { shellCopy } from './shell.copy';
import { GlobalSearch } from './GlobalSearch';

export function TopBar() {
  return (
    <header className="topbar" data-component="TopBar">
      <div className="breadcrumb">
        <span>{shellCopy.workspace}</span>
      </div>
      <div className="topbar-actions">
        <OfflineControls>
          <GlobalSearch />
        </OfflineControls>
      </div>
    </header>
  );
}
