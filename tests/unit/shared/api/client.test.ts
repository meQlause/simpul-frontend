import { afterEach, expect, test, vi } from 'vitest';
import { z as schema } from 'zod';
import { getResponse } from '../../../../src/shared/api/client';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('An error envelope with an unknown code renders as E-INTERNAL (error-handling §5)', async () => {
  const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: 'E-FUTURE-CODE',
            message: 'untrusted upstream copy',
            details: [],
            requestId: 'correlation-id',
          },
        }),
        { status: 500 },
      ),
    ),
  );

  await expect(
    getResponse('/people', schema.object({ data: schema.array(schema.unknown()) })),
  ).rejects.toMatchObject({ code: 'E-INTERNAL', requestId: 'correlation-id' });
  expect(report).toHaveBeenCalledWith('Unknown API error code', 'E-FUTURE-CODE');
});
