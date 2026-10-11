import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Drawer } from '../../shared/ui/Drawer';
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
  return (
    <dl className="trace-facts" data-component="TraceFacts" data-variant="default">
      <div>
        <dt>{copy.host}</dt>
        <dd>{database.host}</dd>
      </div>
      <div>
        <dt>{copy.port}</dt>
        <dd>{database.port}</dd>
      </div>
      <div>
        <dt>{copy.databaseName}</dt>
        <dd>{database.databaseName}</dd>
      </div>
      <div>
        <dt>{copy.schemaVersion}</dt>
        <dd>{database.schemaVersion}</dd>
      </div>
    </dl>
  );
}

function Identity({ database }: { database: Database }) {
  const badge = badges[database.status];

  return (
    <div className="drawer-identity" data-component="DrawerIdentity" data-variant="default">
      <div>
        <strong>{database.host ?? copy.notConnected}</strong>
        <span className={`badge ${badge.color}`}>{badge.label}</span>
        {database.status === 'unreachable' && database.unreachableSince && (
          <small>{copy.since(database.unreachableSince)}</small>
        )}
      </div>
    </div>
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
        <button className="button" onClick={close}>
          {copy.close}
        </button>
      }
    >
      {database ? (
        <>
          <Identity database={database} />
          <section className="drawer-section">
            <h3>{copy.storedSection}</h3>
            <Facts database={database} />
          </section>
          <section className="drawer-section">
            <h3>{copy.updateSection}</h3>
            <DatabaseConnectionForm
              firstConnect={false}
              placeholder={copy.hidden}
              submitLabel={copy.update}
              onConnected={() => setToast(copy.updated)}
            />
          </section>
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
