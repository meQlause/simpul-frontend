import { Link, NavLink } from 'react-router';
import { shellCopy, navigation } from './shell.copy';
import { useShellData } from './shell.api';

export function initials(name?: string) {
  return (
    name
      ?.split(' ')
      .map((part) => part[0])
      .join('') ?? ''
  );
}

function QuietCard({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="quiet-card" data-testid="sidebar-quiet">
      <span className="quiet-symbol">
        <svg className="icon" aria-hidden="true">
          <use href="#i-leaf" />
        </svg>
      </span>
      <strong>
        {shellCopy.quietTitle}
        <br />
        {shellCopy.quietAccent}
      </strong>
      <p>
        {shellCopy.quietLead}
        <br />
        {shellCopy.quietPeople}
      </p>
      <Link to="/rules" onClick={onNavigate}>
        {shellCopy.rules}
        <svg className="icon" aria-hidden="true">
          <use href="#i-arrow-up-right" />
        </svg>
      </Link>
    </div>
  );
}

export function Sidebar({ expanded, onNavigate }: { expanded: boolean; onNavigate: () => void }) {
  const { me, workCount, attentionCount } = useShellData();

  return (
    <aside
      className={expanded ? 'sidebar open' : 'sidebar'}
      id="sidebar"
      aria-label={shellCopy.navigation}
      data-component="Sidebar"
    >
      <Link
        className="brand"
        to="/"
        aria-label={shellCopy.home}
        onClick={onNavigate}
        data-testid="brand"
      >
        <span className="brand-mark">
          <img className="brand-logo" src="/assets/simpul-mark.png" alt="" />
        </span>
        <span>
          {shellCopy.brand}
          <span className="brand-period">.</span>
        </span>
      </Link>
      <div className="nav-label">{shellCopy.workspaceHeading}</div>
      <nav>
        {navigation.map((item) => (
          <div key={item.path}>
            {item.path === '/rules' && (
              <div className="nav-label second">{shellCopy.configuration}</div>
            )}
            <NavLink
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              to={item.path}
              end={item.path === '/'}
              onClick={onNavigate}
            >
              <svg className="icon" aria-hidden="true">
                <use href={`#i-${item.icon}`} />
              </svg>
              {item.label}
              {item.path === '/work' && <span className="nav-count">{workCount}</span>}
              {item.path === '/queue' && (
                <span className="nav-count attention-count">{attentionCount}</span>
              )}
              {item.path === '/channels' && <span className="nav-dot" />}
            </NavLink>
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <QuietCard onNavigate={onNavigate} />
        <Link className="profile" to="/people" onClick={onNavigate}>
          <span className="avatar profile-avatar">{initials(me?.person.name)}</span>
          <span>
            <strong>{me?.person.name}</strong>
            <small>{me?.person.roleName}</small>
          </span>
          <svg className="icon" aria-hidden="true">
            <use href="#i-chevron-down" />
          </svg>
        </Link>
      </div>
    </aside>
  );
}
