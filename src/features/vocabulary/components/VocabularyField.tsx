import type { ReactNode } from 'react';

export function VocabularyField({
  name,
  label,
  error,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={'vocab-' + name}>{label}</label>
      {children}
      {error && (
        <p role="alert" id={'vocab-error-' + name}>
          {error}
        </p>
      )}
    </div>
  );
}
