import { useEffect, type ReactNode } from 'react';
import { AuthStory } from './AuthStory';
import { authCopy } from './auth.copy';

type AuthVariant = 'sign-in' | 'set-password' | 'no-access';

type Props = {
  variant: AuthVariant;
  eyebrow: string;
  title: string;
  lead?: string;
  children: ReactNode;
};

export function AuthShell({ variant, eyebrow, title, lead, children }: Props) {
  useEffect(() => {
    document.body.classList.add('auth-view');

    return () => {
      document.body.classList.remove('auth-view');
    };
  }, []);

  return (
    <main id="page-content" tabIndex={-1}>
      <section className="auth-shell" data-component="AuthShell" data-variant={variant}>
        <AuthStory held={variant === 'no-access'} />
        <div className="auth-form">
          <div className="brand">
            <span className="brand-mark">
              <img className="brand-logo" src="/assets/simpul-mark.png" alt="" />
            </span>
            <span>
              {authCopy.brand}
              <span className="brand-period">.</span>
            </span>
          </div>
          <div className="eyebrow" data-role="eyebrow">
            {eyebrow}
          </div>
          <h1 className="page-title" data-role="page-title">
            {title}
            <span className="heading-dot">.</span>
          </h1>
          {lead && (
            <p className="page-description" data-role="page-description">
              {lead}
            </p>
          )}
          {children}
          <footer className="page-footer">
            <span>
              <span className="tiny-dot" />
              {authCopy.account}
            </span>
            <span>
              {authCopy.product} <span>·</span> {authCopy.made}
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}
