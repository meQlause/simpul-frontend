import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from './Icon';
import { InfoTip } from './InfoTip';

// The mockup's heading(): eyebrow, title and description, with an optional action on the right.
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading" data-component="PageHeading" data-variant="default">
      <div>
        <div className="eyebrow" data-role="eyebrow">
          {eyebrow}
        </div>
        <h1 className="page-title" data-role="page-title">
          {title}
        </h1>
        <InfoTip title={title} text={description} />
      </div>
      {children}
    </div>
  );
}

// The line under a directory's heading: an icon, a headline figure and a quieter sentence.
export function DirectoryContext({
  icon,
  headline,
  note,
}: {
  icon: string;
  headline: ReactNode;
  note: ReactNode;
}) {
  return (
    <div className="directory-context" data-component="DirectoryContext">
      <Icon name={icon} />
      <span>{headline}</span>
      <span className="context-divider" />
      <span>{note}</span>
    </div>
  );
}

export type Tab = { key: string; label: string; count: number };

// Tabs that filter, and a search field, on one bar.
export function DirectoryToolbar({
  tabs,
  active,
  onTab,
  search,
  onSearch,
  placeholder,
  disabled = false,
}: {
  tabs: Tab[];
  active: string;
  onTab: (key: string) => void;
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="directory-toolbar" data-component="DirectoryToolbar">
      <div className="directory-tabs" aria-label="Filter list">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={tab.key === active ? 'directory-tab active' : 'directory-tab'}
            aria-pressed={tab.key === active}
            disabled={disabled}
            onClick={() => onTab(tab.key)}
          >
            {tab.label}
            <span>{tab.count}</span>
          </button>
        ))}
      </div>
      <div className="search-field directory-search">
        <Icon name="search" />
        <input
          type="search"
          aria-label={placeholder}
          placeholder={placeholder}
          maxLength={100}
          value={search}
          disabled={disabled}
          onChange={(event) => onSearch(event.target.value)}
        />
      </div>
    </div>
  );
}

export function DirectoryFooter({
  status,
  loadMore,
  pending = false,
}: {
  status: string;
  loadMore?: () => void;
  pending?: boolean;
}) {
  return (
    <div className="directory-footer">
      <span role="status">{status}</span>
      {loadMore && (
        <button className="button button-soft" type="button" disabled={pending} onClick={loadMore}>
          Load more
        </button>
      )}
      <span>
        <Icon name="shield" />
        Changes follow your workspace rules
      </span>
    </div>
  );
}

export function DirectoryEmpty({ columns }: { columns: number }) {
  return (
    <tr className="directory-empty">
      <td colSpan={columns}>
        <div className="empty-state">
          <Icon name="search" />
          <h3>No matches found</h3>
          <p>Try another name or filter.</p>
        </div>
      </td>
    </tr>
  );
}

export function DirectoryCallout({
  icon,
  title,
  description,
  to,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  to: string;
  action: string;
}) {
  return (
    <div className="directory-callout" data-component="Callout" data-variant="default">
      <span className="directory-icon">
        <Icon name={icon} />
      </span>
      <div>
        <h3>{title}</h3>
        <InfoTip title={title} text={description} />
      </div>
      <Link className="text-button" to={to}>
        {action}
        <Icon name="arrow-right" />
      </Link>
    </div>
  );
}
