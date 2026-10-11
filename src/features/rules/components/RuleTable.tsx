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
    <>
      <div className="directory-table-wrap">
        <table className="directory-table">
          <thead>
            <tr>
              {copy.columns.map((name) => (
                <th key={name} scope="col">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <RuleRow key={rule.id} rule={rule} disabled={disabled} onToggle={onToggle} />
            ))}
          </tbody>
        </table>
      </div>
      {rules.length === 0 && (
        <div className="screen-state">
          <h2>{copy.noMatch}</h2>
          <p>{copy.noMatchHelp}</p>
        </div>
      )}
    </>
  );
}
