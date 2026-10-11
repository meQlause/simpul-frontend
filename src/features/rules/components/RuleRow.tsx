import { Link } from 'react-router';
import type { Rule } from '../rules.schema';
import { rulesCopy as copy } from '../rules.copy';

export function RuleRow({
  rule,
  disabled,
  onToggle,
}: {
  rule: Rule;
  disabled: boolean;
  onToggle: (rule: Rule) => void;
}) {
  return (
    <tr data-directory-row>
      <td data-label={copy.columns[0]}>
        <div className="directory-identity">
          <span className="directory-icon">
            <svg className="icon" aria-hidden="true">
              <use href="#i-route" />
            </svg>
          </span>
          <div>
            <Link className="directory-title" to={`/rules/${rule.id}`}>
              {rule.name}
            </Link>
            <p>{rule.conditionText}</p>
          </div>
        </div>
      </td>
      <td data-label={copy.columns[1]}>
        <span className="directory-category">{rule.category.name}</span>
      </td>
      <td data-label={copy.columns[2]}>
        <span className="directory-recipient">
          <svg className="icon" aria-hidden="true">
            <use href="#i-arrow-right" />
          </svg>
          {rule.recipient.holderName ?? copy.byRole}
        </span>
        <small>{rule.recipient.team || copy.byRole}</small>
      </td>
      <td data-label={copy.columns[3]}>
        <strong className="directory-number">{rule.matches30d}</strong>
        <small>{copy.matches}</small>
      </td>
      <td data-label={copy.columns[4]}>
        <strong className="directory-number">{rule.correctionRate}%</strong>
        <small>
          {rule.corrections30d} / {rule.matches30d} {copy.operations}
        </small>
      </td>
      <td data-label={copy.columns[5]}>
        <div className="directory-status">
          <button
            type="button"
            className={`toggle ${rule.active ? 'active' : ''}`}
            role="switch"
            aria-checked={rule.active}
            aria-label={`${rule.active ? copy.toggleLabel.off : copy.toggleLabel.on} ${rule.name}`}
            disabled={disabled}
            onClick={() => onToggle(rule)}
          />
          <span>{rule.active ? copy.active : copy.paused}</span>
        </div>
      </td>
      <td className="directory-actions">
        <Link className="icon-button" to={`/rules/${rule.id}`} aria-label={`Edit ${rule.name}`}>
          <svg className="icon" aria-hidden="true">
            <use href="#i-chevron-right" />
          </svg>
        </Link>
      </td>
    </tr>
  );
}
