import type { ReactNode } from 'react';
import { InfoTip } from '../../../shared/ui/InfoTip';

export function VocabularyField({
  name,
  label,
  error,
  hint,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={'vocab-' + name}>{label}</label>
      {hint && <InfoTip title={label} text={hint} />}
      {children}
      {error && (
        <p role="alert" id={'vocab-error-' + name}>
          {error}
        </p>
      )}
    </div>
  );
}
