import { useState, type SubmitEvent } from 'react';
import type { ZodType } from 'zod';
import { ApiError } from '../../shared/api/error';
import { useOnline } from '../../shared/useOnline';
import { useVocabularyWrite } from './vocabulary.api';

export function useVocabularyForm(options: {
  path: string;
  method: string;
  schema: ZodType;
  message: string;
  onSaved: () => void;
}) {
  const mutation = useVocabularyWrite();
  const online = useOnline();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);

  function showErrors(form: HTMLFormElement, fields: Record<string, string>) {
    setErrors(fields);
    const control = form.elements.namedItem(Object.keys(fields)[0]);

    if (control instanceof HTMLElement) {
      control.focus();
    }
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mutation.isPending || !online) {
      return;
    }

    const form = event.currentTarget;
    const parsed = options.schema.safeParse(Object.fromEntries(new FormData(form)));

    setFailed(false);

    if (!parsed.success) {
      showErrors(
        form,
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), options.message]),
        ),
      );

      return;
    }

    await save(form, parsed.data);
  }

  async function save(form: HTMLFormElement, input: unknown) {
    try {
      setErrors({});
      await mutation.mutateAsync({
        path: options.path,
        method: options.method,
        input,
      });
      form.reset();
      options.onSaved();
    } catch (error) {
      const fields = serverErrors(error);

      setFailed(!Object.keys(fields).length);
      showErrors(form, fields);
    }
  }

  return { errors, failed, submit, disabled: !online || mutation.isPending };
}

function serverErrors(error: unknown): Record<string, string> {
  if (
    !(error instanceof ApiError) ||
    !['E-VALIDATION', 'E-TEMPLATE-FIELD-NOT-ALLOWED', 'E-VOCAB-PREFIX-FIXED'].includes(error.code)
  ) {
    return {};
  }

  return Object.fromEntries(
    error.details.flatMap((detail) => {
      if (
        !detail ||
        typeof detail !== 'object' ||
        !('field' in detail) ||
        typeof detail.field !== 'string'
      ) {
        return [];
      }

      return [[detail.field, error.message]];
    }),
  );
}
