import { OfflineControls } from '../../shared/ui/OfflineControls';
import { navigation, shellCopy } from './shell.copy';
import { GlobalSearch } from './GlobalSearch';

export function TopBar({ expanded, onMenu }: { expanded: boolean; onMenu: () => void }) {
  const location = useLocation();
  const current = navigation.find((item) => item.path === location.pathname);
  return (
    <header className="topbar" data-component="TopBar">
      <div className="breadcrumb">
        <button
          className="icon-button mobile-menu"
          id="menu-toggle"
          type="button"
          aria-label={shellCopy.menu}
          aria-expanded={expanded}
          aria-controls="sidebar"
          onClick={onMenu}
        >
          <svg className="icon" aria-hidden="true">
            <use href="#i-menu" />
          </svg>
        </button>
        <span>{shellCopy.workspace}</span>
        <span className="breadcrumb-slash">/</span>
        <strong id="breadcrumb-current">{current?.label}</strong>
      </div>
      <div className="topbar-actions">
        <OfflineControls>
          <GlobalSearch />
        </OfflineControls>
      </div>
    </header>
  );
}
import { useLocation } from 'react-router';
