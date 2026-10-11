import { AuthShell } from './AuthShell';
import { SignInForm } from './SignInForm';
import { authCopy } from './auth.copy';

export function SignInPage() {
  return (
    <AuthShell
      variant="sign-in"
      eyebrow={authCopy.eyebrow}
      title={authCopy.title}
      lead={authCopy.lead}
    >
      <SignInForm />
    </AuthShell>
  );
}
