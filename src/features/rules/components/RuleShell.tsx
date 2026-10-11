import type { ReactNode } from 'react';
import { Drawer } from '../../../shared/ui/Drawer';
import { rulesCopy as copy } from '../rules.copy';

export function RuleShell({
  editing,
  onClose,
  footer,
  children,
}: {
  editing: boolean;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <Drawer
      title={editing ? copy.editTitle : copy.createTitle}
      eyebrow={copy.drawerEyebrow}
      description={copy.drawerDescription}
      closeLabel={copy.close}
      onClose={onClose}
      footer={footer}
    >
      {children}
    </Drawer>
  );
}
