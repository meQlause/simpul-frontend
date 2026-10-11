import { rulesCopy as copy } from '../rules.copy';

export function RuleToolbar({
  filter,
  search,
  counts,
  online,
  onFilter,
  onSearch,
}: {
  filter: string;
  search: string;
  counts: Record<string, number>;
  online: boolean;
  onFilter: (value: string) => void;
  onSearch: (value: string) => void;
}) {
  const tabs = [
    ['all', copy.tabs.all],
    ['active', copy.tabs.active],
    ['paused', copy.tabs.paused],
  ] as const;

  return (
    <div className="directory-toolbar">
      <div className="directory-tabs">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            className={`directory-tab ${filter === value ? 'active' : ''}`}
            aria-pressed={filter === value}
            disabled={!online}
            onClick={() => onFilter(value)}
          >
            {label}
            <span>{counts[value]}</span>
          </button>
        ))}
      </div>
      <label className="directory-search">
        <input
          type="search"
          disabled={!online}
          aria-label={copy.search}
          placeholder={copy.search}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </label>
    </div>
  );
}
