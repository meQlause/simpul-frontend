export const reviewCopy = {
  title: 'Needs review',
  eyebrow: 'A LITTLE INPUT GOES A LONG WAY',
  description: 'Resolve the gaps that keep useful updates from reaching your team.',
  kinds: {
    unrouted: {
      badge: 'No matching rule',
      icon: 'route',
      color: 'amber',
      action: 'Create rule',
      reason: 'No notification rule defines who should receive this recognized update.',
    },
    alias: {
      badge: 'Unrecognized name',
      icon: 'users',
      color: 'blue',
      action: 'Link name',
      reason: 'The detected name is not linked to a team member.',
    },
    category: {
      badge: 'Category gap',
      icon: 'layers',
      color: 'gray',
      action: 'Choose category',
      reason: 'This update does not fit the available vocabulary.',
    },
  },
  failed: 'Your changes were not saved. Try again.',
};
