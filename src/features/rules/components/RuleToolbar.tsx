import { DirectoryToolbar } from '../../../shared/ui/Directory';
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
  return (
    <DirectoryToolbar
      tabs={[
        { key: 'all', label: copy.tabs.all, count: counts.all },
        { key: 'active', label: copy.tabs.active, count: counts.active },
        { key: 'paused', label: copy.tabs.paused, count: counts.paused },
      ]}
      active={filter}
      onTab={onFilter}
      search={search}
      onSearch={onSearch}
      placeholder={copy.search}
      disabled={!online}
    />
  );
}
