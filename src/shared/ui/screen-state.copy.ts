export const screenStateCopy = {
  loading: {
    description: 'Your workspace data is loading.',
  },
  empty: {
    title: 'No data yet',
    description: 'Connect a group or adjust your filters to get started.',
    icon: 'inbox',
  },
  error: {
    title: 'Workspace could not be loaded',
    description: 'Your settings were not changed. Retry when the service is available.',
    icon: 'alert',
  },
  offline: {
    title: 'You are offline',
    description: 'Editing and activation are unavailable until connectivity returns.',
    icon: 'inbox',
  },
  'not-found': {
    title: 'This page is unavailable',
    description: 'Return to Home to continue.',
    icon: 'inbox',
  },
  databaseUnavailable:
    'Your database cannot be reached. Nothing is lost on our side, but new messages are not being recorded. Retry when it is back.',
  retry: 'Retry',
  home: 'Back to workspace',
};
