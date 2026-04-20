import { Suspense } from 'react';
import ResetPasswordForm from './reset-password-form';

function ResetPasswordSkeleton() {
  return (
    <div className="auth-form-shell">
      <div className="auth-skeleton">
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-screen">
      <header className="auth-header">
        <h1 className="auth-brand">Moul Hanout</h1>
      </header>

      <main className="auth-main">
        <div className="auth-frame auth-frame--compact">
          <div className="auth-surface">
            <Suspense fallback={<ResetPasswordSkeleton />}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </main>

      <footer className="auth-footer">
        <div className="auth-footer__inner">
          <span>&copy; 2026 Moul Hanout Digital</span>
          <span>&bull;</span>
          <button type="button">
            Privacy Policy
          </button>
          <span>&bull;</span>
          <button type="button">
            Terms of Service
          </button>
        </div>
      </footer>
    </div>
  );
}
