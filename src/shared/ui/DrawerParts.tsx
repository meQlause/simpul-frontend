import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { InfoTip } from './InfoTip';

// The mockup's drawerIdentity(): an icon, a title and line, and a status on the right.
export function DrawerIdentity({
  icon,
  title,
  description,
  status,
  tone = '',
}: {
  icon: string;
  title: string;
  description: string;
  status?: ReactNode;
  tone?: string;
}) {
  return (
    <div
      className={`drawer-identity ${tone}`.trim()}
      data-component="DrawerIdentity"
      data-variant={tone || 'default'}
    >
      <span className="drawer-identity-icon">
        <Icon name={icon} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {status}
    </div>
  );
}

// The mockup's drawerSection(): a numbered heading above its content.
export function DrawerSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="drawer-section" data-component="DrawerSection" data-variant="default">
      <div className="drawer-section-heading">
        <span>{number}</span>
        <div>
          <h3 data-role="section-title">{title}</h3>
          <InfoTip title={title} text={description ?? ''} />
        </div>
      </div>
      <div className="drawer-section-content">{children}</div>
    </section>
  );
}
