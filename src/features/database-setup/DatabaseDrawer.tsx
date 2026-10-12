import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Drawer } from '../../shared/ui/Drawer';
import { DrawerIdentity, DrawerSection } from '../../shared/ui/DrawerParts';
import { Icon } from '../../shared/ui/Icon';
import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { useDatabase } from './database.api';
import { databaseCopy as copy } from './database.copy';
import type { Database } from './database.schema';
import { DatabaseConnectionForm } from './DatabaseConnectionForm';

const badges = {
  connected: { label: copy.connected, color: 'green' },
  unreachable: { label: copy.unreachable, color: 'red' },
  migration_failed: { label: copy.migrationFailed, color: 'red' },
  pending: { label: copy.notConnected, color: 'gray' },
} as const;

function Facts({ database }: { database: Database }) {
  const facts = [
    [copy.host, database.host],
    [copy.port, database.port],
    [copy.databaseName, database.databaseName],
    [copy.schemaVersion, database.schemaVersion],
  ];

  return (
    <>
      {facts.map(([label, value]) => (
        <label className="field" key={label}>
          {label}
          <input readOnly value={value ?? ''} />
        </label>
      ))}
    </>
  );
}

function Identity({ database }: { database: Database }) {
  const badge = badges[database.status];

  return (
    <DrawerIdentity
      icon="link"
      title={database.host ?? copy.notConnected}
      description={
        database.status === 'unreachable' && database.unreachableSince
          ? copy.since(database.unreachableSince)
          : 'PostgreSQL · your own database'
      }
      status={<span className={`badge ${badge.color}`}>{badge.label}</span>}
    />
  );
}

export function DatabaseDrawer() {
  const navigate = useNavigate();
  const query = useDatabase();
  const state = useScreenState(query, false);
  const [toast, setToast] = useState('');
  const close = () => void navigate('/settings');
  const database = query.data?.data;

  return (
    <Drawer
      title={copy.drawerTitle}
      eyebrow={copy.drawerEyebrow}
      description={copy.drawerDescription}
      closeLabel={copy.close}
      onClose={close}
      footer={
        <>
          <button className="button" onClick={close}>
            {copy.close}
          </button>
          {database && (
            <button className="button button-primary" type="submit" form="database-form">
              {copy.update}
              <Icon name="arrow-right" />
            </button>
          )}
        </>
      }
    >
      {database ? (
        <>
          <Identity database={database} />
          <DrawerSection number="01" title="Connection" description={copy.drawerDescription}>
            <Facts database={database} />
          </DrawerSection>
          <DrawerSection number="02" title={copy.updateSection}>
            <DatabaseConnectionForm
              firstConnect={false}
              externalSubmit
              placeholder={copy.hidden}
              submitLabel={copy.update}
              onConnected={() => setToast(copy.updated)}
            />
          </DrawerSection>
          {toast && (
            <p role="status" className="toast visible">
              {toast}
            </p>
          )}
        </>
      ) : (
        <ScreenState state={state} onRetry={() => void query.refetch()} />
      )}
    </Drawer>
  );
}
