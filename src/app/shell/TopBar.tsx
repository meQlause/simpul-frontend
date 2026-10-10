import { OfflineControls } from '../../shared/ui/OfflineControls';
import { shellCopy } from './shell.copy';

export function TopBar() {
  return (
    <header className="topbar" data-component="TopBar">
      <div className="breadcrumb">
        <span>{shellCopy.workspace}</span>
      </div>
      <div className="topbar-actions">
        <OfflineControls>
          <label className="global-search">
            <svg className="icon" aria-hidden="true">
              <use href="#i-search" />
            </svg>
            <input
              type="search"
              id="global-search"
              placeholder={shellCopy.searchPlaceholder}
              aria-label={shellCopy.search}
            />
            <kbd>{shellCopy.shortcut}</kbd>
          </label>
        </OfflineControls>
      </div>
    </header>
  );
}
