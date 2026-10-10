export const screenStateCopy = {
  loading: {
    title: 'Loading workspace',
    description: 'Your workspace data is loading.',
    icon: 'refresh',
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
  retry: 'Retry',
  home: 'Back to workspace',
};
