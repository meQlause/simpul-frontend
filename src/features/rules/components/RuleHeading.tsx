import { Link } from 'react-router';
import { DirectoryContext, PageHeading } from '../../../shared/ui/Directory';
import { Icon } from '../../../shared/ui/Icon';
import { rulesCopy as copy } from '../rules.copy';

export function RuleHeading({ active }: { active: number }) {
  return (
    <>
      <PageHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.description}>
        <Link className="button button-primary" to="/rules/new">
          <Icon name="plus" />
          {copy.createRule}
        </Link>
      </PageHeading>
      <DirectoryContext
        icon="route"
        headline={
          <>
            <strong>{active} active rules</strong> {copy.context}
          </>
        }
        note={copy.contextSecond}
      />
    </>
  );
}
