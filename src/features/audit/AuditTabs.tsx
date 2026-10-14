import { Link } from 'react-router';
import { messagesCopy as copy } from './audit.copy';

// The two page tabs, in the page heading's right-hand slot. Each is a URL, so a reload keeps it.
export function AuditTabs({ active }: { active: 'decisions' | 'messages' }) {
  return (
    <nav className="audit-page-tabs" aria-label="Audit pages" data-component="AuditTabs">
      <Link
        className={active === 'decisions' ? 'directory-tab active' : 'directory-tab'}
        to="/audit"
        aria-current={active === 'decisions' ? 'page' : undefined}
      >
        {copy.tabs.decisions}
      </Link>
      <Link
        className={active === 'messages' ? 'directory-tab active' : 'directory-tab'}
        to="/audit?tab=messages"
        aria-current={active === 'messages' ? 'page' : undefined}
      >
        {copy.tabs.messages}
      </Link>
    </nav>
  );
}

export function withParam(params: URLSearchParams, key: string, value: string): URLSearchParams {
  const next = new URLSearchParams(params);

  if (value) {
    next.set(key, value);
  } else {
    next.delete(key);
  }

  return next;
}
