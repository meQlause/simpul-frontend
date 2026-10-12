import { Link } from 'react-router';
import { Drawer } from '../../shared/ui/Drawer';
import { shellCopy as copy } from './shell.copy';

const steps = [
  [
    '01',
    'grid',
    'Start with the overview',
    'See active work and the updates that need attention.',
    '/',
  ],
  [
    '02',
    'inbox',
    'Resolve the gaps',
    'Link names, choose categories, and define destinations.',
    '/queue',
  ],
  [
    '03',
    'route',
    'Preview before saving',
    'Check a routing rule’s expected impact on the team.',
    '/rules',
  ],
  [
    '04',
    'history',
    'Follow the decision',
    'Understand why an update was sent, held, or stopped.',
    '/audit',
  ],
] as const;

export function GuideDrawer({ onClose }: { onClose: () => void }) {
  return (
    <Drawer
      title={copy.guideTitle}
      eyebrow={copy.guideEyebrow}
      description={copy.guideDescription}
      closeLabel={copy.close}
      onClose={onClose}
      footer={
        <button className="button button-primary" onClick={onClose}>
          {copy.guideDone}
          <svg className="icon" aria-hidden="true">
            <use href="#i-check" />
          </svg>
        </button>
      }
    >
      <div className="drawer-identity" data-component="DrawerIdentity" data-variant="default">
        <span className="drawer-identity-icon">
          <svg className="icon" aria-hidden="true">
            <use href="#i-leaf" />
          </svg>
        </span>
        <div>
          <strong>{copy.guideIdentityTitle}</strong>
          <p>{copy.guideIdentityDescription}</p>
        </div>
      </div>
      <div className="drawer-guide">
        {steps.map(([number, icon, title, description, path]) => (
          <Link key={path} to={path} onClick={onClose}>
            <span className="drawer-guide-number">{number}</span>
            <span className="drawer-guide-icon">
              <svg className="icon" aria-hidden="true">
                <use href={`#i-${icon}`} />
              </svg>
            </span>
            <span>
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
            <svg className="icon" aria-hidden="true">
              <use href="#i-arrow-up-right" />
            </svg>
          </Link>
        ))}
      </div>
    </Drawer>
  );
}
