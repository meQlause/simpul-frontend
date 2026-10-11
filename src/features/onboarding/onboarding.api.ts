import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z as schema } from 'zod';
import { getResponse } from '../../shared/api/client';

export type OnboardingInput = {
  backups: { roleId: string; personId: string }[];
  activeRuleIds: string[];
};

export function useCompleteOnboarding() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: OnboardingInput) =>
      getResponse('/onboarding/complete', schema.object({ data: schema.unknown() }), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => client.invalidateQueries(),
  });
}
