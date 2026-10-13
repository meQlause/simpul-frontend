import { useState, type SubmitEvent } from 'react';
import { useSaveRule } from './rules.api';
import { fieldErrors, validationFields, type RuleErrors } from './rules.form';
import { ruleFormSchema, type Rule } from './rules.schema';

export function useRuleForm({
  rule,
  reviewItemId,
  onSaved,
}: {
  rule?: Rule;
  reviewItemId: string | null;
  onSaved: () => void;
}) {
  const save = useSaveRule(rule?.id);
  const [errors, setErrors] = useState<RuleErrors>({});
  const [failed, setFailed] = useState(false);

  function showErrors(form: HTMLFormElement, fields: RuleErrors) {
    setErrors(fields);

    const control = form.elements.namedItem(Object.keys(fields)[0] ?? '');

    if (control instanceof HTMLElement) {
      control.focus();
    }
  }

  async function persist(form: HTMLFormElement, input: Record<string, unknown>) {
    try {
      await save.mutateAsync(reviewItemId && !rule ? { ...input, reviewItemId } : input);
      onSaved();
    } catch (error) {
      const fields = validationFields(error);

      setFailed(Object.keys(fields).length === 0);
      showErrors(form, fields);
    }
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (save.isPending) {
      return;
    }

    const form = event.currentTarget;

    setFailed(false);
    setErrors({});
    const parsed = ruleFormSchema.safeParse(Object.fromEntries(new FormData(form)));

    if (!parsed.success) {
      showErrors(form, fieldErrors(parsed.error.issues));

      return;
    }

    await persist(form, parsed.data);
  }

  return { submit, errors, failed, setFailed, pending: save.isPending };
}
