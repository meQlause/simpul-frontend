import { DrawerSection } from '../../../shared/ui/DrawerParts';
import { useState } from 'react';
import type { Vocabulary } from '../vocabulary.schema';
import { templateInput } from '../vocabulary.schema';
import { useVocabularyForm } from '../useVocabularyForm';
import { vocabularyCopy as copy } from '../vocabulary.copy';
import { VocabularyField } from './VocabularyField';

export function TemplatesTab({
  vocabulary,
  onSaved,
}: {
  vocabulary: Vocabulary;
  onSaved: () => void;
}) {
  const templates = vocabulary.templates;
  const [body, setBody] = useState(templates.internal.body);
  const schema = templateInput.refine(
    (input) =>
      Array.from(input.body.matchAll(/\{\{([^{}]+)\}\}/gu)).every((match) =>
        templates.internal.allowedFields.includes(match[1].trim()),
      ),
    { path: ['body'] },
  );
  const form = useVocabularyForm({
    path: '/templates/internal',
    method: 'PUT',
    schema,
    message: copy.templateError,
    onSaved,
  });

  return (
    <>
      <DrawerSection
        number="01"
        title="Internal update template"
        description="Only approved summary fields can be used."
      >
        <form id="vocabulary-form" onSubmit={form.submit} noValidate>
          <VocabularyField name="body" label="Template" error={form.errors.body}>
            <textarea
              id="vocab-body"
              name="body"
              rows={4}
              maxLength={300}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              disabled={form.disabled}
              aria-invalid={!!form.errors.body}
              aria-describedby={form.errors.body ? 'vocab-error-body' : undefined}
            />
            <small>
              Available:{' '}
              {templates.internal.allowedFields.map((field) => '{{' + field + '}}').join(', ')}.
              External wording is fixed.
            </small>
          </VocabularyField>
          <div className="message-preview">
            <small>Internal sample preview</small>
            <p data-testid="template-preview">{preview(body, templates.sample)}</p>
          </div>
          {form.failed && <p role="alert">{copy.failed}</p>}
        </form>
      </DrawerSection>
      <DrawerSection
        number="02"
        title="External group template"
        description="Sensitive internal fields are never available here."
      >
        <div data-testid="external-template">
          <div className="message-preview">
            <small>Approved · Read only</small>
            <p>{preview(templates.external.body, templates.sample)}</p>
          </div>
          <p className="drawer-inline-note">Cost, margin and internal notes are excluded.</p>
        </div>
      </DrawerSection>
    </>
  );
}

function preview(body: string, sample: Record<string, string>) {
  return body.replace(
    /\{\{([^{}]+)\}\}/gu,
    (match: string, field: string) => sample[field.trim()] ?? match,
  );
}
