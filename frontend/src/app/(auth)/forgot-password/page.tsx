'use client';

import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <main className="auth-layout">
      <section className="auth-card">
        <div className="auth-card-top" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="eyebrow">Recovery</span>
          <h1>Reset Password</h1>
          <p>This feature is currently under development. Please contact your administrator to reset your password manually.</p>
        </div>

        <div className="auth-actions" style={{ display: 'flex', justifyContent: 'center' }}>
          <Link href="/login" className="button-link">
            Back to Login
          </Link>
        </div>
      </section>
    </main>
  );
}
