export const databaseCopy = {
  eyebrow: 'SIMPUL / DATABASE',
  title: 'Connect your database',
  lead: 'Simpul will create its tables in the PostgreSQL database you provide.',
  noticeTitle: 'Your database, your responsibility',
  noticeBody:
    'Your workspace data will be stored only in the database you connect. Its availability, backups and recovery are your responsibility, not Simpul’s.',
  noticeOutage:
    'While your database is unreachable, new messages are not recorded. Messages that arrive during an outage longer than 24 hours are lost.',
  acknowledge: 'I understand that data availability is our responsibility.',
  field: 'Connection string',
  hint: 'postgres://user:password@host:5432/database — PostgreSQL 15 or later with pgvector, encryption required.',
  connect: 'Connect database',
  connecting: 'Preparing your database. This can take up to a minute.',
  needString: 'Enter a PostgreSQL connection string.',
  needAck: 'Confirm the notice before connecting.',
  signOut: 'Sign out',
  calloutTitle: 'Database',
  calloutDescription: 'Where this workspace’s data is stored.',
  view: 'View',
  drawerEyebrow: 'SIMPUL / DATABASE',
  drawerTitle: 'Database',
  drawerDescription: 'Where this workspace’s data is stored.',
  storedSection: 'Stored in',
  updateSection: 'Update connection',
  host: 'Host',
  port: 'Port',
  databaseName: 'Database name',
  schemaVersion: 'Schema version',
  connected: 'Connected',
  unreachable: 'Unreachable',
  migrationFailed: 'Migration failed',
  notConnected: 'Not connected',
  since: (time: string) => `Unreachable since ${time}`,
  update: 'Update connection',
  hidden: 'Existing connection is hidden',
  updated: 'Database connection updated.',
  close: 'Close',
  failed: 'Your changes were not saved. Try again.',
  failures: {
    'E-DB-CONNECTION-FAILED':
      'The database could not be reached with these details. Check the host, the password and that encryption is enabled. Nothing was saved.',
    'E-DB-VERSION-UNSUPPORTED':
      'This database server is too old. PostgreSQL 15 or later is required. Nothing was saved.',
    'E-DB-PERMISSION-MISSING':
      'This database user cannot create tables or extensions. Grant those permissions and try again. Nothing was saved.',
    'E-DB-VECTOR-MISSING':
      'The pgvector extension is not available on this server. Install it and try again. Nothing was saved.',
    'E-DB-IN-USE': 'This database already belongs to another workspace. Use an empty database.',
    'E-DB-WORKSPACE-MISMATCH':
      'This database does not contain this workspace’s data. The connection was not changed.',
    'E-DB-MIGRATION-FAILED':
      'The database could not be prepared. It was left unchanged. Try again.',
  } as Record<string, string>,
};
