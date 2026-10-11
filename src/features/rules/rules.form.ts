import { ApiError } from '../../shared/api/error';
import { rulesCopy as copy } from './rules.copy';
import type { Rule } from './rules.schema';

export type RuleErrors = Record<string, string>;

export type Category = { id: string; name: string };

export type StaffMember = {
  id: string;
  name: string;
  role: { id: string; name: string; team: string } | null;
};

export type ReviewPrefill = { suggested: string | null; detail?: string };

type ReviewResponse = {
  data: { detail: string; detected: { suggestedCategoryId: string | null } };
};

function messageFor(field: string): string {
  return field === 'name' || field === 'conditionText' ? copy.invalid : copy.invalidField;
}

export function fieldErrors(issues: readonly { path: readonly PropertyKey[] }[]): RuleErrors {
  return Object.fromEntries(
    issues.map((issue) => [String(issue.path[0]), messageFor(String(issue.path[0]))]),
  );
}

export function validationFields(error: unknown): RuleErrors {
  if (!(error instanceof ApiError) || error.code !== 'E-VALIDATION') {
    return {};
  }

  return Object.fromEntries(
    error.details.flatMap((detail) => {
      if (
        typeof detail !== 'object' ||
        detail === null ||
        !('field' in detail) ||
        typeof detail.field !== 'string'
      ) {
        return [];
      }

      const message =
        'message' in detail && typeof detail.message === 'string'
          ? detail.message
          : messageFor(detail.field);

      return [[detail.field, message]];
    }),
  );
}

export function estimateInput(categoryId: string, eventType: string, recipientRoleId: string) {
  return categoryId && eventType && recipientRoleId
    ? { categoryId, eventType, recipientRoleId }
    : null;
}

export function prefillFrom(response?: ReviewResponse): ReviewPrefill {
  return {
    suggested: response?.data.detected.suggestedCategoryId ?? null,
    detail: response?.data.detail,
  };
}

function orderOrFirst(categories: Category[]): string {
  return (categories.find((category) => category.name === 'Order') ?? categories[0])?.id ?? '';
}

function categoryFor(rule: Rule | undefined, categories: Category[], suggested: string | null) {
  return rule?.category.id ?? suggested ?? orderOrFirst(categories);
}

function nameFor(rule: Rule | undefined, categories: Category[], categoryId: string): string {
  const categoryName = categories.find((category) => category.id === categoryId)?.name;

  return rule?.name ?? `${categoryName ?? copy.category}, notify the owner`;
}

function recipientFor(rule: Rule | undefined, staff: StaffMember[]): string {
  return rule?.recipient.roleId ?? staff.find((member) => member.role)?.role?.id ?? '';
}

export function defaultsFor({
  rule,
  categories,
  staff,
  suggested,
  detail,
}: {
  rule?: Rule;
  categories: Category[];
  staff: StaffMember[];
  suggested: string | null;
  detail?: string;
}) {
  const categoryId = categoryFor(rule, categories, suggested);

  return {
    name: nameFor(rule, categories, categoryId),
    conditionText: rule?.conditionText ?? detail ?? copy.defaultCondition,
    categoryId,
    eventType: rule?.eventType ?? 'new',
    recipientRoleId: recipientFor(rule, staff),
  };
}
