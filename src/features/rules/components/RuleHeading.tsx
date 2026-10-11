import { Link } from 'react-router';
import { rulesCopy as copy } from '../rules.copy';

export function RuleHeading({ active }: { active: number }) {
  return (
    <>
      <header className="page-heading" data-component="PageHeading" data-variant="default">
        <div>
          <div className="eyebrow" data-role="eyebrow">
            {copy.eyebrow}
          </div>
          <h1 className="page-title" data-role="title">
            {copy.title}
          </h1>
          <p className="page-description" data-role="description">
            {copy.description}
          </p>
        </div>
        <Link className="button button-primary" to="/rules/new">
          <svg className="icon" aria-hidden="true">
            <use href="#i-plus" />
          </svg>
          {copy.createRule}
        </Link>
      </header>
      <div className="directory-context">
        <svg className="icon" aria-hidden="true">
          <use href="#i-route" />
        </svg>
        <span>
          <strong>{active} active rules</strong> {copy.context}
        </span>
        <span className="context-divider" />
        <span>{copy.contextSecond}</span>
      </div>
    </>
  );
}
