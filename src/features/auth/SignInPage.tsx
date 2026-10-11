import { AuthStory } from './AuthStory';
import { SignInForm } from './SignInForm';
import { authCopy } from './auth.copy';

export function SignInPage() {
  useEffect(() => {
    document.body.classList.add('auth-view');

    return () => {
      document.body.classList.remove('auth-view');
    };
  }, []);

  return (
    <main id="page-content" tabIndex={-1}>
      <section className="auth-shell" data-component="AuthShell" data-variant="sign-in">
        <AuthStory />
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
            {authCopy.eyebrow}
          </div>
          <h1 className="page-title" data-role="page-title">
            {authCopy.title}
            <span className="heading-dot">.</span>
          </h1>
          <p className="page-description" data-role="page-description">
            {authCopy.lead}
          </p>
          <SignInForm />
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

import { useEffect } from 'react';
