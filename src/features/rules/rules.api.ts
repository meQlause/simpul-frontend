import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getResponse } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import {
  estimateSchema,
  responseSchema,
  reviewItemSchema,
  savedRuleSchema,
  type Rule,
} from './rules.schema';

type RulesResponse = { data: Rule[] };
type RuleInput = Record<string, unknown>;

const json = { 'Content-Type': 'application/json' };

export function useRules() {
  return useQuery({
    queryKey: queryKeys.page('rules'),
    queryFn: () => getResponse('/rules', responseSchema),
  });
}

export function useSaveRule(ruleId?: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: RuleInput) =>
      getResponse(ruleId ? `/rules/${ruleId}` : '/rules', savedRuleSchema, {
        method: ruleId ? 'PATCH' : 'POST',
        headers: json,
        body: JSON.stringify(input),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.page('rules') }),
  });
}

export function useToggleRule() {
  const client = useQueryClient();
  const key = queryKeys.page('rules');

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      getResponse(`/rules/${id}`, savedRuleSchema, {
        method: 'PATCH',
        headers: json,
        body: JSON.stringify({ active }),
      }),
    onMutate: async ({ id, active }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<RulesResponse>(key);

      client.setQueryData<RulesResponse>(
        key,
        (old) =>
          old && { data: old.data.map((rule) => (rule.id === id ? { ...rule, active } : rule)) },
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      client.setQueryData<RulesResponse>(key, context?.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
}

export function useEstimate(
  input: { categoryId: string; eventType: string; recipientRoleId: string } | null,
) {
  return useQuery({
    queryKey: ['rules-estimate', input],
    queryFn: () =>
      getResponse('/rules/estimate', estimateSchema, {
        method: 'POST',
        headers: json,
        body: JSON.stringify(input),
      }),
    enabled: input !== null,
    placeholderData: (previous) => previous,
    retry: false,
  });
}

export function useReviewItem(itemId: string | null) {
  return useQuery({
    queryKey: ['review-item', itemId],
    queryFn: () => getResponse(`/review-items/${itemId}`, reviewItemSchema),
    enabled: itemId !== null,
  });
}
