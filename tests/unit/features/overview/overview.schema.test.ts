import { expect, test } from 'vitest';
import { responseSchema } from '../../../../src/features/overview/overview.schema';

const overview = {
  data: {
    messagesUnderstood: { count: 3, trendPercent: '12.8' },
    activeWork: { count: 2, completedToday: 1 },
    updatesDelivered: { count: 0, recipients: 0, topRecipients: [] },
    needsReview: { count: 0, areas: 0, byKind: { unrouted: 0, alias: 0, category: 0 } },
  },
};

// T9 — AC7: a response without series still parses, and the series are empty; a series is kept as sent.
test('FR-UI-22 (AC7): the series default to an empty list when the response omits them', () => {
  const parsed = responseSchema.parse(overview);

  expect(parsed.data.messagesUnderstood.series).toEqual([]);
  expect(parsed.data.activeWork.series).toEqual([]);

  const withSeries = responseSchema.parse({
    data: {
      ...overview.data,
      messagesUnderstood: { ...overview.data.messagesUnderstood, series: [1, 2] },
      activeWork: { ...overview.data.activeWork, series: [0, 1] },
    },
  });

  expect(withSeries.data.messagesUnderstood.series).toEqual([1, 2]);
  expect(withSeries.data.activeWork.series).toEqual([0, 1]);
});
