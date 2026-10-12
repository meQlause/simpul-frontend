import { DirectoryEmpty } from '../../../shared/ui/Directory';
import type { Rule } from '../rules.schema';
import { rulesCopy as copy } from '../rules.copy';
import { RuleRow } from './RuleRow';

export function RuleTable({
  rules,
  disabled,
  onToggle,
}: {
  rules: Rule[];
  disabled: boolean;
  onToggle: (rule: Rule) => void;
}) {
  return (
    <div className="table-wrap directory-table-wrap">
      <table className="directory-table">
        <thead>
          <tr>
            {copy.columns.slice(0, -1).map((name) => (
              <th key={name} scope="col">
                {name}
              </th>
            ))}
            <th scope="col">
              <span className="sr-only">{copy.columns[copy.columns.length - 1]}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <RuleRow key={rule.id} rule={rule} disabled={disabled} onToggle={onToggle} />
          ))}
          {rules.length === 0 && <DirectoryEmpty columns={copy.columns.length} />}
        </tbody>
      </table>
    </div>
  );
}
