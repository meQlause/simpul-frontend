import { useQuery } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { responseSchema } from './people.schema';

export function usePeople() {
  return useQuery({
    queryKey: queryKeys.page('people'),
    queryFn: () => getResponse('/people', responseSchema),
  });
}
