import { Link, useLocation } from 'react-router';
import { OfflineControls } from '../../shared/ui/OfflineControls';
import { navigation, pageTitles, shellCopy } from './shell.copy';
import { GlobalSearch } from './GlobalSearch';
import { useShellData } from './shell.api';

export function TopBar({
  expanded,
  onMenu,
  onGuide,
}: {
  expanded: boolean;
  onMenu: () => void;
  onGuide: () => void;
}) {
  const location = useLocation();
  const { attentionCount } = useShellData();
  // `/work/ORD-0091` is still the Work page.
  const section = `/${location.pathname.split('/')[1] ?? ''}`;
  const current = navigation.find((item) => item.path === section);

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
        <strong id="breadcrumb-current">{pageTitles[section] ?? current?.label}</strong>
      </div>
      <div className="topbar-actions">
        <OfflineControls>
          <GlobalSearch />
        </OfflineControls>
        <span className="topbar-divider" />
        <button
          className="icon-button help-button"
          type="button"
          aria-label={shellCopy.guide}
          onClick={onGuide}
        >
          <svg className="icon" aria-hidden="true">
            <use href="#i-help" />
          </svg>
        </button>
        <Link
          className="icon-button notification-button"
          to="/queue"
          aria-label={
            attentionCount === undefined
              ? shellCopy.attentionNone
              : shellCopy.attention(attentionCount)
          }
        >
          <svg className="icon" aria-hidden="true">
            <use href="#i-bell" />
          </svg>
          <span />
        </Link>
      </div>
    </header>
  );
}
