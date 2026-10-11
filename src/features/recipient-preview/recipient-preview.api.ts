import { useQuery } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { responseSchema } from './recipient-preview.schema';

export function useRecipientPreview() {
  return useQuery({
    queryKey: ['recipient-preview'],
    queryFn: () => getResponse('/previews/recipient', responseSchema),
  });
}
